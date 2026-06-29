# Crystal Mine Bot

Crystal Mine is a highly interactive, full-featured Discord minigame bot. It allows users to play a risk-reward mining game, answer trivia questions, solve advanced mathematical problems, and manage a persistent virtual economy. 

## Installation

To invite Crystal Mine to your Discord server, click the following authorization link:
[Invite Crystal Mine Bot](https://discord.com/oauth2/authorize?client_id=1521156805571514649)

## Features

### Crystal Mine Game
The core feature is a push-your-luck mining game. Players place a bet and are presented with a 5x5 grid of hidden tiles. 
Each tile can either be a Gem or a Mine. 
If a player uncovers a Gem, their multiplier increases, and they can choose to cash out their winnings or keep mining. 
If a player uncovers a Mine, the game ends immediately, and their entire bet is lost. 
The difficulty and multiplier scaling are governed by a configurable risk curve.

### Trivia Quest
Players can participate in time-limited trivia quests across three difficulty levels (easy, medium, hard). 
Questions are pulled dynamically from the OpenTDB database. 
Unlike standard multiple choice, the bot requires users to type their answers directly into the chat within a strict time limit. 
The bot uses lenient string matching to accommodate minor typos or punctuation differences.

### Advanced Math Challenge
For users seeking a harder challenge, the bot provides an advanced math engine. 
It generates complex expressions using concepts like factorials, permutations, combinations, modulo arithmetic, integer logarithms, and prime counting. 
The problem is rendered locally as a high-quality LaTeX image and sent to the channel. 
Players have a strict 60 second window to solve the problem for a massive coin reward.

### Economy System
The bot features a persistent, MongoDB-backed virtual economy. 
Users start with a default balance and can increase it through games, quests, or by claiming hourly rewards. 
A peer-to-peer transfer system allows users to give coins to others. 
All transactions are logged securely in the database to prevent exploitation and track the flow of currency.

## Command Reference

The bot supports both modern Discord Slash Commands and traditional prefix commands using the "cm" prefix.

### Game Commands
* `/mine bet:<amount>` or `cmmine <amount>`: Starts a new Crystal Mine game with the specified bet.
* `/quest difficulty:<easy|medium|hard>` or `cmquest <easy|medium|hard>`: Starts a trivia quest with a 15 to 30 second timer based on difficulty.
* `/math` or `cmmath`: Generates an advanced math problem. Players have 60 seconds to answer for a 100000 coin reward. This command has a 1 minute cooldown.

### Economy Commands
* `/balance` or `cmbalance`: Displays your current coin balance.
* `/hourly` or `cmhourly`: Claims a free reward of 1000 coins. This command has a 1 hour cooldown.
* `/give user:<@user> amount:<amount>` or `cmgive <@user> <amount>`: Transfers the specified amount of coins from your balance to another user.

### Utility Commands
* `/help` or `cmhelp`: Displays a list of all available commands.

### Administrator Commands
(These commands are restricted to authorized server administrators only)
* `/admin give user:<@user> amount:<amount>`: Mints new coins and adds them to a user's balance.
* `/admin set-balance user:<@user> amount:<amount>`: Overwrites a user's balance to an exact amount.
* `/admin reset user:<@user>`: Resets a user's balance back to the starting default.
* `/admin check user:<@user>`: Silently checks the balance of any user.

## Technical Architecture

The bot is built using TypeScript and Node.js. 
It utilizes the discord.js library for seamless interaction with the Discord API. 
The architecture strictly separates user interface logic (Discord Embeds and Buttons) from the underlying business logic (Economy and Game State). 
Persistent storage is handled via MongoDB and Mongoose. 
Mathematical problems are generated using a custom Abstract Syntax Tree engine and rendered locally into PNG images using sharp and mathjax-node.
