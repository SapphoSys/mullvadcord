import { Autocomplete, Command, Option } from 'discord-hono';
import { factory } from '$utils/init';
import {
	addDeviceToMullvadAcl,
	fetchTailscaleContext,
	findDevice,
	getMullvadIps,
	updateTailscaleAcl,
} from '$utils/mullvad';
import type { TailscaleDevice } from '$utils/types';

const mullvadAddCommand = new Command(
	'mullvad-add',
	'Add device to Mullvad ACL',
).options(new Option('device', 'Device name or IP').autocomplete().required());

export const command_mullvad_add = factory.autocomplete(
	mullvadAddCommand,
	async (c) => {
		const { devices, acl } = await fetchTailscaleContext(c.env);
		const mullvadIps = getMullvadIps(acl);
		const filtered = devices.devices.filter(
			(d: TailscaleDevice) =>
				!d.addresses.some((ip: string) => mullvadIps.includes(ip)),
		);
		const choices = filtered.map((d: TailscaleDevice) => ({
			name: d.name,
			value: d.addresses[0],
		}));
		return c.resAutocomplete(
			new Autocomplete(c.focused?.value).choices(...choices),
		);
	},
	async (c) => {
		try {
			const { devices, acl } = await fetchTailscaleContext(c.env);

			const deviceArg = c.var.device;
			if (!deviceArg)
				return c.res(
					'No device specified. Please select a device from the autocomplete list.',
				);

			const device = findDevice(devices, deviceArg);
			if (!device) return c.res(`Device not found: ${deviceArg}`);

			const deviceIp = device.addresses[0];

			const newAcl = addDeviceToMullvadAcl(acl, deviceIp);
			if (!newAcl)
				return c.res(`Failed to add device ${device.name} to Mullvad ACL.`);

			await updateTailscaleAcl(c.env, newAcl);
			return c.res(`Device ${device.name} (${deviceIp}) added to Mullvad ACL.`);
		} catch (err) {
			return c.res(
				`Error: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	},
);
