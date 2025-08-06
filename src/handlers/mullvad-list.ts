import { Command } from 'discord-hono';
import { factory } from '$utils/init';
import { fetchTailscaleContext, getMullvadIps } from '$utils/mullvad';
import type { TailscaleDevice } from '$utils/types';

const mullvadListCommand = new Command(
	'mullvad-list',
	'List devices on Mullvad network',
);

export const command_mullvad_list = factory.command(
	mullvadListCommand,
	async (c) => {
		try {
			const { devices, acl } = await fetchTailscaleContext(c.env);
			const mullvadIps = getMullvadIps(acl);
			const filtered = devices.devices.filter((d: TailscaleDevice) =>
				d.addresses.some((ip: string) => mullvadIps.includes(ip)),
			);
			if (!filtered || filtered.length === 0) {
				return c.res('No Mullvad devices found on your network.');
			}

			const deviceList = filtered
				.map((d: TailscaleDevice) => `• ${d.name} (${d.addresses.join(', ')})`)
				.join('\n');

			return c.res(`Devices on Mullvad network:\n${deviceList}`);
		} catch (err) {
			return c.res(
				`Error: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	},
);
