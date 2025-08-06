import { register } from 'discord-hono';
import * as handlers from '$handlers/index';
import { factory } from '$utils/init';

register(
	factory.getCommands(Object.values(handlers)),
	process.env.DISCORD_APPLICATION_ID,
	process.env.DISCORD_TOKEN,
	process.env.DISCORD_GUILD_ID ?? undefined,
);
