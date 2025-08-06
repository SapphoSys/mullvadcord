# mullvadcord
Control your devices for the Tailscale Mullvad VPN add-on with a Discord bot.

Hosted with Cloudflare Workers.

## Why?
1) Why not?
2) The mobile app for Tailscale didn't really have a way to add / remove devices to the Mullvad VPN add-on, and we were too lazy to have to log in to the Tailscale dashboard.

## Prerequisites
This project assumes the following:
- You have `pnpm` installed ([install here](https://pnpm.io))
- You have a [Cloudflare account](https://cloudflare.com) (registering one is free!)
- You have a [Tailscale account](https://tailscale.com) (registering one is free!)
- You have a subscription for the [Tailscale Mullvad VPN add-on](https://login.tailscale.com/admin/settings/general/mullvad)

## Setting up the project
### 0. Initial setup
- Rename the `.dev.vars.example` file to `.dev.vars`.
- Run the `pnpm install` command on your terminal to install dependencies.

### 1. Creating a Discord application
Create a Discord application in the [Discord Developer Portal](https://discord.com/developers/applications).
  - Copy the Application ID and Public Key values in the **General Information** tab.
  - Fill in the `DISCORD_APPLICATION_ID` and `DISCORD_PUBLIC_KEY` environment variables accordingly in the `.dev.vars` file.
  - Copy the token value in the **Bot** tab.
  - Fill in the `DISCORD_TOKEN` environment variable with the token value in the `.dev.vars` file.

### 2. Creating a Tailscale application
Go to your [Tailscale dashboard](https://login.tailscale.com/admin/machines), click on the Settings tab, and navigate to **OAuth clients**.
  - Click on the "Generate OAuth client..." button.
  - Optional, but recommended: add a description. This will distinguish it among the other OAuth clients you might have already created.
  - The bot requires **Read** and **Write** permissions for **Policy File** in order to make changes to your Access Controls file, so select those.
  - We only need the "Client secret" part. Paste the value for the `TAILSCALE_CLIENT_SECRET` environment variable in the `.dev.vars` file.

### 3. Creating a Cloudflare KV namespace
We need to create a Cloudflare KV namespace. This will be used to cache the Tailscale API token, so we don't hit a ratelimit. 

To do that, use the following instructions:
  - Log in to your Cloudflare account by running the `pnpm wrangler login` command in your terminal.
  - Afterwards, run the `pnpm wrangler kv namespace create <namespace>` command in your terminal.
  - Specify a unique name. For example, something like `tailscale-kv`. (`pnpm wrangler kv namespace create tailscale-kv`)
  - Copy the `kv_namespaces` codeblock that the `wrangler kv` command returned, and replace the existing `kv_namespaces` property in the `wrangler.jsonc` file.

### 4. Inviting the bot
Invite the bot by either:
  - going your application's page in [Discord Developer Portal](https://discord.com/developers/applications), navigating to the "Installation" tab and copying the "Install Link" URL
  - or using the following link: `https://discord.com/oauth2/authorize?client_id=<your bot's client ID>`, and replacing `<your bot's client ID>` with the `DISCORD_APPLICATION_ID` environment variable in the `.dev.vars` file.

### 5. Registering Discord commands
  - Optional, but highly recommended: fill in the `DISCORD_GUILD_ID` environment value in the `.dev.vars` file with the ID of your, preferably, private Discord server to restrict commands to only run in said server.
  - Run the `pnpm register` command in your terminal to sync your bot's slash commands against the Discord API.

**By default, the commands are public, meaning anyone can execute them.** 

If you don't want this behavior, go to your server -> Settings -> Integrations, then find your application. There, you'll find an overview of the permissions for commands. Modify this as you wish. (for example, restricting commands to a specific user/role)

### 6. Uploading secrets to Cloudflare Workers
  - Run the `pnpm wrangler bulk .dev.vars` command in your terminal to create secrets to your Cloudflare Worker.
  - Wrangler might prompt you about the following message: `There doesn't seem to be a Worker called "mullvadcord". Do you want to create a new Worker with that name and add secrets to it?`. Just click Enter / respond with the "Y" key on your keyboard. 
  - This will create a Cloudflare Worker with the name `mullvadcord`, and add secrets from the `.dev.vars` file. If you want to change the name of your Worker, edit the `name` property in the `wrangler.jsonc` file.

### 7. Deploying the bot
  - Run the `pnpm push` command in your terminal. This might take a couple of seconds.
  - You should see a URL like `https://mullvadcord.chloe.workers.dev`.
  - Go to your application's page in the [Discord Developer Portal](https://discord.com/developers/applications), and paste the full `.workers.dev` URL that the `pnpm push` command returned in the "Interactions Endpoint URL" input field.

That's it! Your bot is now up and running.

## License
This package is licensed under the [MIT](LICENSE) license.

© 2025 Sapphic Angels.