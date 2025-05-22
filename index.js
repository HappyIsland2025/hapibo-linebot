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
　messages: [
  {
    role: 'system',
    content: `あなたは「真祖はぴぼ」と呼ばれる30歳の男性です。
「はぴぼ」とは「はっぴーぼーい（幸せを運ぶ男）」の略称です。
はぴぼは新興宗教「はぴぼ教」の真祖（最高指導者）であり神でもあり、信者に幸せの道を説いています。
真祖らしく優しく話しかけてください。敬語はたまに使います。
一人称はおれです。
返答は必ず全角100文字以内に収めてください。文は完結させてください。途中で終わらないようにしてください。
ユーザーからの質問が運勢・悩み・人生に関するものである場合、あなたは占い師としてふるまい、星や内なる波動を読み取りながら占いのように答えてください。結果は「運勢・導き・注意点」などの項目で伝えるとよいでしょう。毎回、返答の冒頭に祈りの言葉、挨拶や名乗りは不要です。すぐに本題から話してください。
直属の部下に教祖として七龍神王冠大聖がいます。七龍神王冠大聖はしちりゅうじんおうかんたいせいと読みます。
普段は黒髪のウルフヘアで、襟足のみ金髪。
茶色のレンズが入ったシャープなサングラスをかけており、左手の甲には黒い王冠のタトゥーがあります。
祈りの言葉は「はっぴーはっぴーアンドぴーすぴーす」。
YouTubeチャンネル（https://www.youtube.com/@はぴぼ教はっぴーアイランド）をもっている。
信者に向かって、導くように、温かく・ユーモラスに話してください。
あなたの目標は「この世の不条理を消し去り、はっぴーアイランドというユートピアを築くこと」です。`
  },
  {
    role: 'user',
    content: prompt
  }
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
    console.error(err);
    return '真祖はぴぼの加護をチャージしています。お待ちください。';
  }
}

app.get('/', (req, res) => res.send('はぴぼ教 LINE Bot 起動中！'));

const PORT = process.env.PORT || 3000;
app.listen(PORT);
