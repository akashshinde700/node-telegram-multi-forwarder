const axios = require('axios');


const TELEGRAM_BOT_TOKEN = '';


async function getUpdatesAndReply() {
  try {
   
    const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);

 
    if (response.data.result && response.data.result.length > 0) {
      
      response.data.result.forEach(async (update) => {
        const chatId = update.message.chat.id;
        const messageText = update.message.text;


        if (messageText && messageText.toLowerCase() === 'hi') {
         
          const feedback = `Hello! Your message was received. Your chat ID is: ${chatId}`;
          await sendMessage(chatId, feedback);

          console.log(`Message from chat ID ${chatId}: ${messageText}`);
          console.log('Feedback sent:', feedback);
        }
      });
    } else {
      console.log('No new messages.');
    }
  } catch (error) {
    console.error('Error fetching updates:', error);
  }
}


async function sendMessage(chatId, text) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: chatId,
      text: text
    });
    console.log('Message sent:', response.data);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function pollUpdates() {
  await getUpdatesAndReply();

  setTimeout(pollUpdates, 5000);
}


pollUpdates();
