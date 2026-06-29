# 💎 Crystal Mine — Discord Minigame Bot

A production-quality Discord.js v14 minigame where players bet coins, mine tiles to find crystals, and avoid bombs. Built with TypeScript, clean architecture, and full separation of game logic from Discord UI.

---

## Features

- **Risk-vs-reward gameplay** — find crystals to increase your multiplier, or hit a bomb and lose it all
- **Interactive Discord buttons** — 3×3 grid with real-time updates
- **Premium embeds** — color-coded game states, emoji board visualization
- **Anti-abuse** — one game per player, 3s cooldown, timeout after 120s
- **Economy system** — pluggable via dependency injection
- **Configurable** — board size, bombs, timeouts, multipliers, bet limits

---

## Architecture

```
/mine command → GameManager → MineGame → MineBoard + MultiplierCalculator
       ↕              ↕
   Discord UI    IEconomyProvider
  (Embeds +      (InMemoryEconomy
   Buttons)       or your DB)
```

| Layer | Folder | Responsibility |
|---|---|---|
| **Types** | `src/types/` | Interfaces, enums, contracts |
| **Config** | `src/config/` | Game settings, multiplier table |
| **Game Logic** | `src/game/` | Pure game rules — zero Discord imports |
| **Database** | `src/database/` | Economy provider implementations |
| **UI** | `src/ui/` | Discord embeds and button builders |
| **Commands** | `src/commands/` | Slash command definitions |
| **Events** | `src/events/` | Button interaction handlers |
| **Utils** | `src/utils/` | Formatting, logging |

---

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd crystal-mine-bot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your bot token and client ID
```

---

## Configuration

### Environment Variables (`.env`)

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | Yes | Your Discord bot token |
| `CLIENT_ID` | Yes | Your bot's application/client ID |
| `GUILD_ID` | No | Guild ID for dev command registration (instant) |

### Game Settings (`config.json`, optional)

```json
{
  "boardSize": 3,
  "bombs": 3,
  "timeout": 120,
  "minBet": 100,
  "maxBet": 1000000
}
```

---

## Running Locally

```bash
# Register slash commands (run once, or after changes)
npm run deploy-commands

# Start in development mode (auto-restart on changes)
npm run dev

# Or build and start in production
npm run build
npm start
```

---

## Commands

| Command | Description |
|---|---|
| `/mine bet:<amount>` | Start a Crystal Mine game |
| `/balance` | Check your coin balance |

---

## Adding Your Own Economy System

The bot uses dependency injection for the economy. Implement the `IEconomyProvider` interface:

```typescript
import { IEconomyProvider, TransactionRecord } from './types/Economy.js';

export class MyDatabaseEconomy implements IEconomyProvider {
  async getBalance(userId: string): Promise<number> { /* your DB query */ }
  async addCoins(userId: string, amount: number, reason: string, gameId: string): Promise<number> { /* ... */ }
  async removeCoins(userId: string, amount: number, reason: string, gameId: string): Promise<number> { /* ... */ }
  async transactionLog(record: TransactionRecord): Promise<void> { /* ... */ }
}
```

Then swap in `src/index.ts`:

```typescript
const economy = new MyDatabaseEconomy();
const gameManager = new GameManager(economy, gameConfig);
```

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

Tests cover:
- Board generation (bomb placement, uniqueness, boundaries)
- Multiplier accuracy (full table verification)
- Payout calculation (floor rounding, edge cases)
- Game flow (win, lose, timeout, state transitions)
- GameManager (balance, cooldown, concurrency)

---

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5 (strict mode)
- **Discord**: discord.js v14
- **Testing**: Vitest
- **Linting**: ESLint + @typescript-eslint

---

## License

MIT
