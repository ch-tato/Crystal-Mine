# 💎 Crystal Mine — Discord Minigame Bot

A production-quality Discord.js v14 minigame where players bet coins, mine tiles to find crystals, and avoid bombs. Built with TypeScript, MongoDB, and clean architecture.

---

## Features

- **Risk-vs-reward gameplay** — find crystals to increase your multiplier, or hit a bomb and lose it all
- **Interactive Discord buttons** — 3×3 grid with real-time updates
- **Premium embeds** — color-coded game states, emoji board visualization
- **Persistent economy** — MongoDB-backed balances that survive restarts
- **Anti-abuse** — one game per player, 3s cooldown, timeout after 120s
- **Admin commands** — give coins, set balances, reset users
- **Publicly invitable** — works across any Discord server
- **Configurable** — board size, bombs, timeouts, multipliers, bet limits

---

## Commands

| Command | Description |
|---|---|
| `/mine bet:<amount>` | Start a Crystal Mine game (100–1,000,000 coins) |
| `/balance` | Check your current coin balance |
| `/admin give user:<@user> amount:<n>` | Give coins to a user (admin only) |
| `/admin set-balance user:<@user> amount:<n>` | Set exact balance (admin only) |
| `/admin reset user:<@user>` | Reset user to 10,000 coins (admin only) |
| `/admin check user:<@user>` | Check any user's balance (admin only) |

---

## Architecture

```
/mine command → GameManager → MineGame → MineBoard + MultiplierCalculator
       ↕              ↕
   Discord UI    IEconomyProvider
  (Embeds +       (MongoEconomy
   Buttons)       → MongoDB Atlas)
```

| Layer | Folder | Responsibility |
|---|---|---|
| **Types** | `src/types/` | Interfaces, enums, contracts |
| **Config** | `src/config/` | Game settings, multiplier table |
| **Game Logic** | `src/game/` | Pure game rules — zero Discord imports |
| **Database** | `src/database/` | MongoDB models + economy provider |
| **UI** | `src/ui/` | Discord embeds and button builders |
| **Commands** | `src/commands/` | Slash command definitions |
| **Events** | `src/events/` | Button interaction handlers |
| **Utils** | `src/utils/` | Formatting, logging |

---

# 🚀 Complete Setup Guide (Beginner-Friendly)

This guide assumes you have never done this before. Follow every step in order.

---

## Step 1: Create a Discord Bot Application

1. Go to the **Discord Developer Portal**: https://discord.com/developers/applications
2. Click the **"New Application"** button (top right).
3. Name it `Crystal Mine` and click **Create**.
4. You are now on the **General Information** page.
   - Copy the **APPLICATION ID** — this is your `CLIENT_ID`. Save it somewhere (e.g., a notepad).
5. In the left sidebar, click **"Bot"**.
6. Click **"Reset Token"** and confirm.
   - Copy the **Token** that appears — this is your `DISCORD_TOKEN`. **Save it immediately.** You cannot see it again.
   - ⚠️ **NEVER share this token with anyone.** Anyone with it can control your bot.
7. On the same Bot page, scroll down to **"Privileged Gateway Intents"**.
   - You do NOT need to enable any intents for this bot. Leave them all off.

---

## Step 2: Get Your Discord User ID (for Admin Commands)

1. Open Discord (desktop or browser).
2. Go to **User Settings** (gear icon at the bottom left).
3. Go to **Advanced** → turn on **Developer Mode**.
4. Close settings.
5. Click on your own profile picture or username anywhere in Discord.
6. Click **"Copy User ID"**.
7. Save this — this is your `ADMIN_USER_IDS`.

---

## Step 3: Create a Free MongoDB Database

1. Go to **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account (use Google login if you want).
3. After signing up, you'll be asked to create a deployment:
   - Choose **M0 (Free)** — this is completely free forever.
   - Choose a region close to you (or leave the default).
   - Click **Create Deployment**.
4. You'll see a **"Connect"** dialog:
   - **Create a Database User**:
     - Username: `crystalmine` (or anything you want)
     - Password: Click **Autogenerate** and **copy the password**. Save it.
     - Click **Create Database User**.
   - Click **Choose a connection method**.
   - Select **"Drivers"** (Node.js).
   - You'll see a connection string like:
     ```
     mongodb+srv://crystalmine:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with the password you copied.
   - Add `crystalmine` after the `/` and before the `?`:
     ```
     mongodb+srv://crystalmine:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/crystalmine?retryWrites=true&w=majority
     ```
   - Save this full string — this is your `MONGODB_URI`.
5. **Allow network access from anywhere** (important for Railway):
   - In the left sidebar, click **Network Access**.
   - Click **Add IP Address**.
   - Click **Allow Access from Anywhere** (it will show `0.0.0.0/0`).
   - Click **Confirm**.

---

## Step 4: Deploy to Railway (Free Hosting)

1. Go to **Railway**: https://railway.app
2. Sign up with your **GitHub account** (the one that has `ch-tato/Crystal-Mine`).
3. After signing up, click **"New Project"** on the dashboard.
4. Select **"Deploy from GitHub Repo"**.
5. Find and select your **Crystal-Mine** repository.
6. Railway will detect it as a Node.js project and start building. **It will fail** — that's okay, because we haven't set the environment variables yet.
7. **Add Environment Variables:**
   - Click on the service that was created (it should be called `Crystal-Mine` or similar).
   - Go to the **"Variables"** tab.
   - Click **"New Variable"** for each of these:

     | Variable | Value |
     |---|---|
     | `DISCORD_TOKEN` | The bot token from Step 1 |
     | `CLIENT_ID` | The Application ID from Step 1 |
     | `MONGODB_URI` | The connection string from Step 3 |
     | `ADMIN_USER_IDS` | Your Discord User ID from Step 2 |

   - **Do NOT add `GUILD_ID`** — leaving it out makes the commands available on all servers.

8. After adding all 4 variables, Railway will automatically redeploy. Wait for it to show **"Active"** or a green checkmark.

---

## Step 5: Register the Slash Commands

The bot is now running on Railway, but Discord doesn't know about the `/mine` command yet. You need to register the commands once.

**Option A: Run locally (easiest)**
1. On your own computer, in the project folder, create a `.env` file:
   ```
   DISCORD_TOKEN=your_token_here
   CLIENT_ID=your_client_id_here
   ```
2. Run:
   ```bash
   npm run deploy-commands
   ```
3. You should see: `Registered global commands`. Done! Commands will appear in Discord within 1 hour.

**Option B: From Railway's terminal**
1. In Railway, click on your service.
2. Go to the **"Settings"** tab.
3. Under **"Custom Start Command"**, temporarily set it to:
   ```
   npm run build && node dist/deploy-commands.js
   ```
4. Wait for it to deploy and succeed.
5. Change the start command back to the default (blank) or `npm start`.
6. Redeploy.

---

## Step 6: Invite the Bot to Your Server

1. Go back to the **Discord Developer Portal**: https://discord.com/developers/applications
2. Click on your Crystal Mine application.
3. In the left sidebar, click **"OAuth2"**.
4. Scroll down to **"OAuth2 URL Generator"**.
5. Under **Scopes**, check:
   - ✅ `bot`
   - ✅ `applications.commands`
6. Under **Bot Permissions**, check:
   - ✅ `Send Messages`
   - ✅ `Embed Links`
   - ✅ `Use Slash Commands`
7. Copy the **Generated URL** at the bottom.
8. Open that URL in your browser.
9. Select the server you want to add the bot to.
10. Click **Authorize**.

---

## Step 7: Play!

1. Go to any channel in your Discord server.
2. Type `/mine` and set `bet` to a number (e.g., `500`).
3. Press Enter — the game board should appear with buttons!
4. Click tiles to reveal crystals 💎 or avoid bombs 💣.
5. Click **Cash Out** to collect your winnings.

---

## Sharing with Others

The invite link you created in Step 6 is **public**. You can share it with anyone, and they can add your bot to their own servers. Your bot will work across all servers simultaneously — each player has their own persistent coin balance stored in MongoDB.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Commands don't appear in Discord | Global commands take up to 1 hour. Wait, or use `GUILD_ID` for instant testing. |
| Bot is offline | Check Railway dashboard — look for error logs in the **"Deployments"** tab. |
| "MONGODB_URI is not set" | Make sure you added all 4 environment variables in Railway. |
| Bot replies "This isn't your game" | Only the player who started the game can click the buttons. |
| Admin commands don't work | Make sure your Discord User ID is in `ADMIN_USER_IDS`. |

---

## Running Locally (for development)

```bash
# 1. Clone the repo
git clone https://github.com/ch-tato/Crystal-Mine.git
cd Crystal-Mine

# 2. Install dependencies
npm install

# 3. Create .env file with your credentials
cp .env.example .env
# Edit .env with your real values

# 4. Register commands (once)
npm run deploy-commands

# 5. Start in dev mode (auto-restart on file changes)
npm run dev
```

---

## Testing

```bash
npm test          # Run all 55 tests
npm run test:watch # Watch mode
```

---

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5 (strict mode)
- **Discord**: discord.js v14
- **Database**: MongoDB (via Mongoose)
- **Hosting**: Railway
- **Testing**: Vitest

---

## License

MIT
