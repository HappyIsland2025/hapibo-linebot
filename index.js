const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const axios = require('axios');
require('dotenv').config();

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);
const app = express();

app.post('/webhook', middleware(config), async (req, res) => {
  const events = req.body.events;
  await Promise.all(events.map(async (event) => {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;

      const reply = await getChatGPTReply(userMessage);

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: reply,
      });
    }
  }));
  res.status(200).end();
});

async function getChatGPTReply(prompt) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error(err);
    return 'すみません、うまく応答できませんでした。';
  }
}

app.get('/', (req, res) => res.send('はぴぼ教 LINE Bot 起動中！'));

const PORT = process.env.PORT || 3000;
app.listen(PORT);
