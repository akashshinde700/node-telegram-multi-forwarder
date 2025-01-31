require('dotenv').config({ path: __dirname + '/../.env' });
const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql2/promise');
const express = require('express');

const app = express();
app.use(express.json());


console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'Loaded' : 'Missing');
console.log('RECEIVER_CHANNELS:', process.env.RECEIVER_CHANNELS || 'Missing');


if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN is missing!');
  process.exit(1);
}

if (!process.env.SENDER_CHANNEL || !process.env.RECEIVER_CHANNELS) {
  console.error('Error: SENDER_CHANNEL or RECEIVER_CHANNELS is missing!');
  process.exit(1);
}

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });


const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


const SENDER_CHANNEL = process.env.SENDER_CHANNEL || '';
const RECEIVER_CHANNELS = process.env.RECEIVER_CHANNELS ? process.env.RECEIVER_CHANNELS.split(',') : [];

console.log('SENDER_CHANNEL:', SENDER_CHANNEL);
console.log('RECEIVER_CHANNELS:', RECEIVER_CHANNELS);


// const ADMIN_CHAT_ID = ;


bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;
  const lastName = msg.from.last_name || '';
  const username = msg.from.username || '';

  console.log(`User started the bot: ${firstName} ${lastName} (${username})`);


  try {
    await pool.query(
      'INSERT INTO users (chat_id, first_name, last_name, username) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE first_name = ?, last_name = ?, username = ?',
      [chatId, firstName, lastName, username, firstName, lastName, username]
    );
    console.log(`User ${firstName} ${lastName} saved in database.`);
  } catch (error) {
    console.error('Error storing user information:', error);
  }


  const inlineKeyboard = [
    [
      {
        text: 'Join SENDER Channel',
        url: `https://t.me/${SENDER_CHANNEL.replace('@', '')}`,
      },
    ],
    ...RECEIVER_CHANNELS.map(channel => [
      {
        text: `Join ${channel}`,
        url: `https://t.me/${channel.replace('@', '')}`,
      },
    ]),
  ];

  await bot.sendMessage(chatId, "Welcome to the bot! Please join the channels by clicking the buttons below:", {
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  });
});


bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;
  const lastName = msg.from.last_name || '';
  const username = msg.from.username || '';

  console.log(`Received message from ${firstName} ${lastName} (${username}): ${msg.text}`);


  if (chatId === ADMIN_CHAT_ID) {
    try {

      await bot.sendMessage(SENDER_CHANNEL, msg.text);
      console.log(`Message forwarded to SENDER_CHANNEL: ${SENDER_CHANNEL}`);

      for (const receiverChannel of RECEIVER_CHANNELS) {
        await bot.sendMessage(receiverChannel, msg.text);
        console.log(`Message forwarded to RECEIVER_CHANNEL: ${receiverChannel}`);
      }
    } catch (error) {
      console.error('Error forwarding message:', error);
    }
  } else {

    console.log('Non-admin user attempted to send a message. Ignoring...');
  }


  try {
    await pool.query(
      'INSERT INTO users (chat_id, first_name, last_name, username) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE first_name = ?, last_name = ?, username = ?',
      [chatId, firstName, lastName, username, firstName, lastName, username]
    );
    console.log(`User ${firstName} ${lastName} saved in database.`);
  } catch (error) {
    console.error('Error storing user information:', error);
  }
});


bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;
  const lastName = msg.from.last_name || '';
  const joinedChannel = msg.chat.title || '';

  if (msg.chat.type === 'channel') {
    try {
      await pool.query(
        'INSERT INTO users (chat_id, first_name, last_name, joined_channel) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE first_name = ?, last_name = ?, joined_channel = ?',
        [chatId, firstName, lastName, joinedChannel, firstName, lastName, joinedChannel]
      );
      console.log(`User ${firstName} ${lastName} joined channel ${joinedChannel}`);
    } catch (error) {
      console.error('Error storing user information:', error);
    }
  }
});


bot.on('channel_post', async (msg) => {
  const sourceChannel = msg.chat.username || msg.chat.id.toString();

  if (sourceChannel === SENDER_CHANNEL.replace('@', '')) {
    const messageText = msg.text || msg.caption || '';

  
    for (const receiverChannel of RECEIVER_CHANNELS) {
      try {
        await bot.sendMessage(receiverChannel, messageText);
        console.log(`Message forwarded to ${receiverChannel}`);
      } catch (error) {
        console.error(`Error forwarding message to ${receiverChannel}:`, error);
      }
    }
  }
});


app.post('/add-subscription', async (req, res) => {
  const { sourceChannel, targetType, targetId } = req.body;

  if (!sourceChannel || !targetType || !targetId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await pool.query(
      'INSERT INTO channel_subscriptions (source_channel, target_type, target_id) VALUES (?, ?, ?)',
      [sourceChannel, targetType, targetId]
    );
    res.status(201).json({ message: 'Subscription added successfully' });
  } catch (error) {
    console.error('Error adding subscription:', error);
    res.status(500).json({ error: 'Failed to add subscription' });
  }
});


app.post('/remove-subscription', async (req, res) => {
  const { sourceChannel, targetId } = req.body;

  if (!sourceChannel || !targetId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await pool.query(
      'DELETE FROM channel_subscriptions WHERE source_channel = ? AND target_id = ?',
      [sourceChannel, targetId]
    );
    res.status(200).json({ message: 'Subscription removed successfully' });
  } catch (error) {
    console.error('Error removing subscription:', error);
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
