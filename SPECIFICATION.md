# Crystal Mine
Version: 1.0

A Discord minigame inspired by risk-vs-reward mining games.

---

# 1. Overview

Crystal Mine is an interactive Discord minigame.

A player starts by betting coins.

The game generates a hidden board containing crystals and bombs.

The player repeatedly chooses tiles.

Finding crystals increases the payout multiplier.

Finding a bomb immediately loses the bet.

The player may cash out after every successful reveal.

The game is fully interactive using Discord Buttons.

Only the player who started the game may interact with it.

---

# 2. Objectives

The gameplay should be

- fast
- satisfying
- replayable
- fair
- expandable

---

# 3. Board

Default board size

3 x 3

Total tiles

9

Configurable.

Future versions may support

4x4

5x5

etc.

---

# 4. Game Parameters

Default:

Board:
3x3

Bombs:
3

Safe Tiles:
6

Entry Fee:
User defined

Minimum bet:
100

Maximum bet:
1000000

---

# 5. Game Flow

Player executes

/mine bet:5000

Validation:

- player has enough balance
- player not already in game
- bet within limits

System deducts bet immediately.

Random board generated.

Message appears.

Board:

⬛ ⬛ ⬛

⬛ ⬛ ⬛

⬛ ⬛ ⬛

Multiplier

1.00x

Potential payout

5000

Buttons:

Tile Buttons

Cash Out

---

# 6. Tile Generation

Bomb locations are generated uniformly.

Exactly N bombs.

No duplicates.

Cryptographically secure randomness preferred.

Pseudo:

shuffle(all positions)

take first bombCount

---

# 7. Tile States

Hidden

Safe

Bomb

Revealed Safe

Revealed Bomb

Disabled

---

# 8. Reveal Logic

When player clicks hidden tile

IF bomb

Game Over

Reveal full board

Disable buttons

ELSE

Reveal crystal

Increase multiplier

Update payout

Continue

---

# 9. Multiplier

Multiplier increases after every successful reveal.

Should reward risk.

Recommended table:

0 crystals
1.00

1
1.20

2
1.45

3
1.78

4
2.25

5
3.00

6
4.50

Values configurable.

---

# 10. Cash Out

Player presses Cash Out.

Reward

bet × multiplier

Coins added.

Game ends.

Board revealed.

Buttons disabled.

---

# 11. Losing

Bomb clicked.

Player loses entire bet.

Reward = 0

Board revealed.

Buttons disabled.

---

# 12. Timeout

Game expires after

120 seconds

If timeout

Reveal board

Disable buttons

Player loses bet.

Reason:

Prevent abandoned sessions.

---

# 13. Discord UI

Message layout:

━━━━━━━━━━━━━━━━━━━━━━

💎 Crystal Mine

Bet:
5,000

Bombs:
3

Multiplier:
1.45x

Potential Win:
7,250

━━━━━━━━━━━━━━━━━━━━━━

Board

🟦 🟦 🟦

🟦 🟦 🟦

🟦 🟦 🟦

━━━━━━━━━━━━━━━━━━━━━━

Buttons

[Tile][Tile][Tile]

[Tile][Tile][Tile]

[Tile][Tile][Tile]

[Cash Out]

---

# 14. Emojis

Hidden
⬛

Crystal
💎

Bomb
💣

Disabled
⬜

Cash Out
💰

---

# 15. Interaction Rules

Only the original player may click.

Anyone else receives

"This isn't your game."

---

# 16. Anti Abuse

One active game per player.

Cooldown

3 seconds after game ends.

Cannot start while active.

---

# 17. Economy Integration

Required API

getBalance(user)

removeCoins(user)

addCoins(user)

transactionLog(...)

No economy implementation inside game logic.

Use dependency injection.

---

# 18. Game State

Each active game stores

Game ID

Player ID

Bet

Board

Bomb Positions

Revealed Tiles

Multiplier

Status

Start Time

Timeout

Message ID

Channel ID

---

# 19. Architecture

Recommended folders

src/

commands/

mine.ts

game/

MineGame.ts

MineBoard.ts

Multiplier.ts

GameManager.ts

ui/

MineEmbed.ts

MineButtons.ts

database/

Economy.ts

events/

interactionCreate.ts

types/

GameState.ts

---

# 20. Board Model

Each tile

Tile

position

containsBomb

revealed

---

# 21. State Machine

WAITING

↓

ACTIVE

↓

SAFE CLICK

↓

ACTIVE

↓

SAFE CLICK

↓

ACTIVE

↓

Cash Out

↓

WON

OR

Bomb

↓

LOST

OR

Timeout

↓

EXPIRED

---

# 22. Configuration

config.json

{
    "boardSize":3,
    "bombs":3,
    "timeout":120,
    "minBet":100,
    "maxBet":1000000
}

---

# 23. Extensibility

Future additions

Different difficulties

Daily quests

Achievements

Leaderboards

Statistics

Prestige

Powerups

Lucky pick

Insurance

Bomb detector

Double crystal

Special events

Season pass

---

# 24. Error Messages

Insufficient balance

Already in game

Invalid bet

Game expired

Interaction not allowed

Internal error

---

# 25. Testing

Should test

Random board generation

Multiplier accuracy

Cash out correctness

Loss handling

Timeout

Button permissions

Concurrency

Economy integration

Game recovery

---

# 26. Performance

Support thousands of concurrent games.

Game state stored in memory.

Database only used for economy.

No polling.

Fully event-driven.

---

# 27. Security

Never trust client interactions.

Always verify

User

Game ID

Message ID

Channel

Game status

Button validity

Server-side state is authoritative.