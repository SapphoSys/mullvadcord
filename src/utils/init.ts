import { createFactory } from 'discord-hono';

if (!process.env.DISCORD_APPLICATION_ID) throw new Error('DISCORD_APPLICATION_ID is not set in environment variables');
if (!process.env.DISCORD_PUBLIC_KEY) throw new Error('DISCORD_PUBLIC_KEY is not set in environment variables');
if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is not set in environment variables');
if (!process.env.TAILSCALE_CLIENT_SECRET) throw new Error('TAILSCALE_CLIENT_SECRET is not set in environment variables');

export const factory = createFactory<{ Bindings: Env }>();
