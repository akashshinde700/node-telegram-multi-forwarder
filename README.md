# node-telegram-multi-forwarder
A Node.js-based Telegram bot that forwards messages from a source channel to multiple destination channels and tracks channel member information using MySQL.


## Features

- Forward messages from a source channel to multiple destination channels
- Track new channel members in a MySQL database
- Error logging and admin notifications
- Environment-based configuration
- Secure credential management

## Prerequisites

- Node.js 16 or higher
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- MySQL Server
- Admin rights in all involved Telegram channels

## Setup

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up MySQL Database:**
   - Create a new MySQL database
   - Create the following table in your database:
   ```sql
   CREATE TABLE channel_members (
     id INT AUTO_INCREMENT PRIMARY KEY,
     user_id BIGINT NOT NULL,
     first_name VARCHAR(255) NOT NULL,
     last_name VARCHAR(255),
     username VARCHAR(255),
     chat_id BIGINT NOT NULL,
     joined_channel VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in the required values:
     - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
     - `SENDER_CHANNEL`: Source channel username (e.g., @channelname)
     - `RECEIVER_CHANNELS`: Comma-separated list of destination channel usernames
     - `DB_HOST`: MySQL host address
     - `DB_USER`: MySQL username
     - `DB_PASSWORD`: MySQL password
     - `DB_NAME`: MySQL database name
     - `DB_PORT`: MySQL port (default: 3306)
     - `ADMIN_CHAT_ID`: Your Telegram chat ID for receiving alerts

4. **Start the bot:**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

## Bot Commands

The bot automatically:
- Forwards all messages from the sender channel to receiver channels
- Tracks new members joining the sender channel
- Logs errors and sends notifications to the admin

## Error Handling

The bot includes comprehensive error handling:
- All errors are logged to `error.log`
- Combined logs are stored in `combined.log`
- Critical errors are sent to the admin via Telegram
