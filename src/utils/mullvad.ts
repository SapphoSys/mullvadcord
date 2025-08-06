import type {
	MullvadAcl,
	MullvadNodeAttr,
	TailscaleApiTokenResponse,
	TailscaleDevice,
	TailscaleDevicesResponse,
} from '$utils/types';

export async function getTailscaleApiToken(env: Env, forceRefresh = false) {
	const now = Math.floor(Date.now() / 1000);
	if (!forceRefresh) {
		const cachedToken = await env.TAILSCALE_KV.get('tailscale_token');
		const expiryStr = await env.TAILSCALE_KV.get('tailscale_token_expiry');
		const tokenExpiry = expiryStr ? parseInt(expiryStr, 10) : 0;

		if (cachedToken && tokenExpiry && now < tokenExpiry) {
			return cachedToken;
		}
	}

	const clientSecret = process.env.TAILSCALE_CLIENT_SECRET;
	if (!clientSecret) throw new Error('TAILSCALE_CLIENT_SECRET is not set');

	const response = await fetch('https://api.tailscale.com/api/v2/oauth/token', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${clientSecret}`,
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		throw new Error(
			`Failed to fetch Tailscale API token: ${response.statusText}`,
		);
	}

	const data = (await response.json()) as TailscaleApiTokenResponse;

	const token = data.access_token;
	const tokenExpiry = now + (data.expires_in || 3600) - 60;
	if (!token) throw new Error('No access_token returned from Tailscale');

	await env.TAILSCALE_KV.put('tailscale_token', token);
	await env.TAILSCALE_KV.put('tailscale_token_expiry', tokenExpiry.toString());

	return token;
}

async function withTailscaleToken<T>(
	env: Env,
	fn: (token: string) => Promise<T>,
): Promise<T> {
	try {
		const token = await getTailscaleApiToken(env);
		return await fn(token);
	} catch (err) {
		if ((err as Error)?.message?.match(/token|unauthorized|expired|401|403/i)) {
			const token = await getTailscaleApiToken(env, true);
			return await fn(token);
		}

		throw err;
	}
}

export async function getTailscaleAcl(env: Env): Promise<MullvadAcl> {
	return withTailscaleToken(env, async (tok) => {
		const response = await fetch(
			`https://api.tailscale.com/api/v2/tailnet/-/acl`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${tok}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			},
		);

		if (!response.ok) {
			throw new Error(`Failed to fetch ACL: ${response.statusText}`);
		}

		return (await response.json()) as MullvadAcl;
	});
}

export async function getTailscaleDevices(
	env: Env,
): Promise<TailscaleDevicesResponse> {
	return withTailscaleToken(env, async (tok) => {
		const response = await fetch(
			`https://api.tailscale.com/api/v2/tailnet/-/devices`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${tok}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
			},
		);

		if (!response.ok) {
			throw new Error(`Failed to fetch devices: ${response.statusText}`);
		}

		return (await response.json()) as TailscaleDevicesResponse;
	});
}

export async function updateTailscaleAcl(env: Env, acl: MullvadAcl) {
	return withTailscaleToken(env, async (tok) => {
		const response = await fetch(
			`https://api.tailscale.com/api/v2/tailnet/-/acl`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${tok}`,
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify(acl),
			},
		);

		if (!response.ok) {
			throw new Error(`Failed to update ACL: ${response.statusText}`);
		}

		return await response.json();
	});
}

export async function fetchTailscaleContext(env: Env) {
	const token = await getTailscaleApiToken(env);
	if (!token)
		throw new Error(
			'Failed to fetch Tailscale API token. You likely forgot to set the TAILSCALE_CLIENT_SECRET environment variable.',
		);

	const devices = await getTailscaleDevices(env);
	if (!devices) throw new Error('No devices found.');

	const acl = await getTailscaleAcl(env);
	if (!acl) throw new Error('Failed to fetch ACL.');

	return { token, devices, acl };
}

export function findDevice(
	devices: TailscaleDevicesResponse,
	deviceArg: string,
): TailscaleDevice | undefined {
	return devices.devices.find(
		(d: TailscaleDevice) =>
			d.name === deviceArg || d.addresses.includes(deviceArg),
	);
}

export function getMullvadIps(acl: MullvadAcl): string[] {
	return (acl.nodeAttrs || [])
		.filter((entry: MullvadNodeAttr) => entry.attr.includes('mullvad'))
		.flatMap((entry: MullvadNodeAttr) => entry.target);
}

export function addDeviceToMullvadAcl(
	acl: MullvadAcl,
	deviceIp: string,
): MullvadAcl {
	if (!acl.nodeAttrs) acl.nodeAttrs = [];

	const exists = acl.nodeAttrs.some(
		(entry: MullvadNodeAttr) =>
			entry.target.includes(deviceIp) && entry.attr.includes('mullvad'),
	);
	if (!exists) {
		acl.nodeAttrs.push({ target: [deviceIp], attr: ['mullvad'] });
	}

	return acl;
}

export function removeDeviceFromMullvadAcl(
	acl: MullvadAcl,
	deviceIp: string,
): MullvadAcl {
	if (!acl.nodeAttrs) return acl;
	acl.nodeAttrs = acl.nodeAttrs.filter(
		(entry: MullvadNodeAttr) =>
			!(entry.target.includes(deviceIp) && entry.attr.includes('mullvad')),
	);

	return acl;
}
