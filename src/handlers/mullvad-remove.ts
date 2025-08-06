import { Autocomplete, Command, Option } from 'discord-hono';
import { factory } from '$utils/init';
import {
	fetchTailscaleContext,
	findDevice,
	getMullvadIps,
	removeDeviceFromMullvadAcl,
	updateTailscaleAcl,
} from '$utils/mullvad';
import type { TailscaleDevice } from '$utils/types';

const mullvadRemoveCommand = new Command(
	'mullvad-remove',
	'Remove device from Mullvad ACL',
).options(new Option('device', 'Device name or IP').autocomplete().required());

export const command_mullvad_remove = factory.autocomplete(
	mullvadRemoveCommand,
	async (c) => {
		const { devices, acl } = await fetchTailscaleContext(c.env);
		const mullvadIps = getMullvadIps(acl);
		const filtered = devices.devices.filter((d: TailscaleDevice) =>
			d.addresses.some((ip: string) => mullvadIps.includes(ip)),
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

			const newAcl = removeDeviceFromMullvadAcl(acl, deviceIp);
			if (!newAcl)
				return c.res(
					`Failed to remove device ${device.name} from Mullvad ACL.`,
				);

			await updateTailscaleAcl(c.env, newAcl);
			return c.res(
				`Device ${device.name} (${deviceIp}) removed from Mullvad ACL.`,
			);
		} catch (err) {
			return c.res(
				`Error: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	},
);
