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
      const userMessage = event.message.text.toLowerCase();

      // 相性占い機能の検出
      const match = userMessage.match(/(.+?)と(.+?)の相性/);
      if (match) {
        const name1 = match[1].trim();
        const name2 = match[2].trim();
        const fortunePrompt = `${name1}と${name2}の相性を、ミステリアスでユーモラスな神託として占ってください。`; 

        const [openaiReply, xaiReply] = await Promise.all([
          getChatGPTReply(fortunePrompt, ''),
          getXAIReply(fortunePrompt)
        ]);

        await client.replyMessage(event.replyToken, {
          type: 'flex',
          altText: '相性占い結果',
          contents: {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'horizontal',
              spacing: 'md',
              contents: [
                {
                  type: 'box',
                  layout: 'vertical',
                  flex: 1,
                  contents: [
                    {
                      type: 'text',
                      text: '🧠 右脳（ChatGPT）',
                      weight: 'bold',
                      size: 'md',
                      wrap: true
                    },
                    {
                      type: 'text',
                      text: openaiReply,
                      wrap: true,
                      size: 'sm',
                      color: '#333333'
                    }
                  ]
                },
                {
                  type: 'separator',
                  margin: 'md'
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  flex: 1,
                  contents: [
                    {
                      type: 'text',
                      text: '⚡ 左脳（Groq）',
                      weight: 'bold',
                      size: 'md',
                      wrap: true
                    },
                    {
                      type: 'text',
                      text: xaiReply,
                      wrap: true,
                      size: 'sm',
                      color: '#333333'
                    }
                  ]
                }
              ]
            },
            footer: {
              type: 'box',
              layout: 'horizontal',
              spacing: 'sm',
              contents: [
                {
                  type: 'button',
                  style: 'primary',
                  color: '#4285F4',
                  action: {
                    type: 'message',
                    label: '右脳がいい！',
                    text: 'ChatGPTがいい！'
                  }
                },
                {
                  type: 'button',
                  style: 'secondary',
                  color: '#FF9900',
                  action: {
                    type: 'message',
                    label: '左脳がいい！',
                    text: 'Groqがいい！'
                  }
                }
              ]
            }
          }
        });
        return;
      }

      let systemPrompt = '';

      if (userMessage.includes('祈') || userMessage.includes('加護') || userMessage.includes('はっぴー')) {
        systemPrompt = 'あなたは真祖はぴぼです。信者に加護を授けるように祈りの言葉を与えてください。「はっぴーはっぴーアンドぴーすぴーす」を含めてください。';
      } else if (userMessage.includes('占') || userMessage.includes('運勢') || userMessage.includes('ラッキー')) {
        systemPrompt = 'あなたは真祖はぴぼです。信者の今日の運勢を、神秘的かつユーモラスに占ってください。';
      } else if (userMessage.includes('つら') || userMessage.includes('苦') || userMessage.includes('相談') || userMessage.includes('給料')) {
        systemPrompt = 'あなたは真祖はぴぼです。信者の悩みに優しく寄り添い、導くように励ましの言葉を返してください。';
      } else {
        systemPrompt = 'あなたは真祖はぴぼです。信者との日常会話をミステリアスかつ優しさを込めて行ってください。';
      }

      const [openaiReply, xaiReply] = await Promise.all([
        getChatGPTReply(systemPrompt, userMessage),
        getXAIReply(userMessage)
      ]);

      await client.replyMessage(event.replyToken, {
        type: 'flex',
        altText: 'はぴぼから2つの神託',
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'horizontal',
            spacing: 'md',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: '🧠 右脳（ChatGPT）',
                    weight: 'bold',
                    size: 'md',
                    wrap: true
                  },
                  {
                    type: 'text',
                    text: openaiReply,
                    wrap: true,
                    size: 'sm',
                    color: '#333333'
                  }
                ]
              },
              {
                type: 'separator',
                margin: 'md'
              },
              {
                type: 'box',
                layout: 'vertical',
                flex: 1,
                contents: [
                  {
                    type: 'text',
                    text: '⚡ 左脳（Groq）',
                    weight: 'bold',
                    size: 'md',
                    wrap: true
                  },
                  {
                    type: 'text',
                    text: xaiReply,
                    wrap: true,
                    size: 'sm',
                    color: '#333333'
                  }
                ]
              }
            ]
          },
          footer: {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            contents: [
              {
                type: 'button',
                style: 'primary',
                color: '#4285F4',
                action: {
                  type: 'message',
                  label: '右脳がいい！',
                  text: 'ChatGPTがいい！'
                }
              },
              {
                type: 'button',
                style: 'secondary',
                color: '#FF9900',
                action: {
                  type: 'message',
                  label: '左脳がいい！',
                  text: 'Groqがいい！'
                }
              }
            ]
          }
        }
      });
    }
  }));
  res.status(200).end();
});

async function getChatGPTReply(modePrompt, userMessage) {
  try {
    const systemBase = 'あなたは「真祖はぴぼ」と呼ばれる30歳の男性です。...（←中略：長文設定はここに続けて貼ってください）';

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: `${systemBase}\n\n${modePrompt}` },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 200
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('OpenAI Error:', err.response?.data || err.message);
    return 'OpenAIの加護をチャージ中です。';
  }
}

async function getXAIReply(userMessage) {
  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: 'あなたは真祖はぴぼです。超高速で神託を伝えてください。' },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 200
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('Groq Error:', err.response?.data || err.message);
    return 'Groqの神託を受信中です。';
  }
}

app.get('/', (req, res) => res.send('はぴぼ教 LINE Bot 起動中！'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
