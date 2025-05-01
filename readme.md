# Discord Expense Tracker Bot

A Discord bot that helps users collaboratively track expenses using Google Sheets.

## Features

- Track expenses by adding them to a Google Sheet
- List recent expenses
- View summaries by period (week/month)
- Split expenses between multiple users
- Export expenses to CSV
- Generate charts for expense visualization
- Budget alerts when thresholds are reached

## Setup Instructions

### Prerequisites

- Node.js v16.9.0 or higher
- A Discord account and a server where you have admin privileges
- A Google account with Google Sheets

### Discord Bot Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" tab and click "Add Bot"
4. Under "Privileged Gateway Intents," enable all intents
5. Copy the bot token (you'll need this later)
6. Go to the "OAuth2" tab, then "URL Generator"
7. Select the following scopes: `bot`, `applications.commands`
8. Select bot permissions: `Send Messages`, `Embed Links`, `Attach Files`, `Read Message History`, `Use Slash Commands`
9. Copy the generated URL and open it in your browser to add the bot to your server

### Google Sheets Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Sheets API
4. Create a Service Account under "IAM & Admin" > "Service Accounts"
5. Create and download a JSON key for this service account
6. Save the downloaded JSON file as `service-account-key.json` in the root directory of this project
7. Create a new Google Sheet and share it with the email address of your service account (with editor permissions)
8. Copy the Sheet ID from the URL (it's the long string between /d/ and /edit in the URL)

### Bot Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Create a `.env` file with the following variables:
   ```
   BOT_TOKEN=your_discord_bot_token
   GOOGLE_SHEET_ID=your_google_sheet_id
   GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
   ```
4. Run `npm start` to start the bot

## Usage

- `/addexpense amount category description` - Add a new expense
- `/listexpenses [category] [user]` - List recent expenses with optional filters
- `/summary period=week|month [category] [user]` - Get expense summaries
- `/splitexpense amount description user1 user2...` - Split an expense between users
- `/exportexpenses [period=week|month]` - Export expenses to CSV
- `/setchart type=pie|bar period=week|month` - Generate expense charts

## License

MIT

Discord Expense Tracker Bot
This project structure follows a modular approach for maintainability

Project Structure:
├── .env                     // Environment variables (not committed to git)
├── .gitignore               // Git ignore file
├── README.md                // Setup instructions
├── package.json             // Project dependencies
├── src/
    ├── index.js             // Main entry point
    ├── config.js            // Configuration loader
    ├── commands/            // Command handlers
    │   ├── addExpense.js    // Add expense command
    │   ├── listExpenses.js  // List expenses command
    │   ├── summary.js       // Summary command
    │   ├── splitExpense.js  // Split expense command
    │   └── exportExpenses.js // Export expenses command
    ├── services/            // External services
    │   ├── sheetsService.js // Google Sheets integration
    │   └── chartService.js  // Chart generation
    └── utils/               // Utility functions
        ├── dateUtils.js     // Date manipulation helpers
        └── formatUtils.js   // Formatting helpers
