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

// 簡易セッション管理（インメモリ）
const userModes = {}; // userId: 'chatgpt' | 'grok' | 'both'

const richMenuMap = {
  chatgpt: 'RICH_MENU_ID_CHATGPT',
  grok: 'RICH_MENU_ID_GROK',
  both: 'RICH_MENU_ID_BOTH',
};

app.post('/webhook', middleware(config), async (req, res) => {
  const events = req.body.events;
  await Promise.all(events.map(async (event) => {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text.toLowerCase();
      const userId = event.source.userId;

      // モード切替処理
      if (userMessage.includes('右脳モード')) {
        userModes[userId] = 'grok';
        await client.linkRichMenuToUser(userId, richMenuMap['grok']);
        return client.replyMessage(event.replyToken, { type: 'text', text: '🧠 Groq（右脳）モードに切り替えました。' });
      } else if (userMessage.includes('左脳モード')) {
        userModes[userId] = 'chatgpt';
        await client.linkRichMenuToUser(userId, richMenuMap['chatgpt']);
        return client.replyMessage(event.replyToken, { type: 'text', text: '⚡ ChatGPT（左脳）モードに切り替えました。' });
      } else if (userMessage.includes('2択モード')) {
        userModes[userId] = 'both';
        await client.linkRichMenuToUser(userId, richMenuMap['both']);
        return client.replyMessage(event.replyToken, { type: 'text', text: '🔀 2択比較モードに切り替えました。' });
      }

      const mode = userModes[userId] || 'both';

      // 相性占い機能の検出
      const match = userMessage.match(/(.+?)と(.+?)の相性/);
      const generateDailyScore = (name1, name2, category) => {
        const today = new Date().toISOString().split('T')[0];
        const base = `${name1}:${name2}:${category}:${today}`;
        let hash = 0;
        for (let i = 0; i < base.length; i++) {
          hash = base.charCodeAt(i) + ((hash << 5) - hash);
          hash = hash & hash;
        }
        return Math.abs(hash % 101); // 0-100
      };

      const getAdvice = (score) => {
        if (score >= 85) return '最強の相性、何でもうまくいくよ！';
        if (score >= 70) return 'けっこう相性いいね。信じてOK！';
        if (score >= 50) return 'ふつう。焦らず見極めてね。';
        if (score >= 30) return 'ちょっと難しそう。距離感大事。';
        return '波乱の予感…。慎重にね。';
      };
      if (match) {
        const name1 = match[1].trim();
        const name2 = match[2].trim();
        const loveScore = generateDailyScore(name1, name2, 'love');
        const friendScore = generateDailyScore(name1, name2, 'friend');
        const workScore = generateDailyScore(name1, name2, 'work');

        const fortuneText = `❤️ 恋愛：${loveScore}点 - ${getAdvice(loveScore)}
🤝 友情：${friendScore}点 - ${getAdvice(friendScore)}
💼 仕事：${workScore}点 - ${getAdvice(workScore)}`;

        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: `${name1}と${name2}の相性占い（24時間有効）

${fortuneText}`
        });

        const [openaiReply, xaiReply] = await Promise.all([
          getChatGPTReply(fortunePrompt, ''),
          getXAIReply(fortunePrompt)
        ]);

        await client.replyMessage(event.replyToken, buildFlexResponse(xaiReply, openaiReply));
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

      if (mode === 'chatgpt') {
        const reply = await getChatGPTReply(systemPrompt, userMessage);
        return client.replyMessage(event.replyToken, { type: 'text', text: `⚡ ChatGPTの答え：\n${reply}` });
      } else if (mode === 'grok') {
        const reply = await getXAIReply(userMessage);
        return client.replyMessage(event.replyToken, { type: 'text', text: `🧠 Groqの答え：\n${reply}` });
      } else {
        const [openaiReply, xaiReply] = await Promise.all([
          getChatGPTReply(systemPrompt, userMessage),
          getXAIReply(userMessage)
        ]);
        return client.replyMessage(event.replyToken, buildFlexResponse(xaiReply, openaiReply));
      }
    }
  }));
  res.status(200).end();

app.get('/', (req, res) => {
  res.send('LINE Bot is running.');
});




});

async function getChatGPTReply(systemPrompt, userMessage) {
  try {
    const basePrompt = `あなたは「真祖はぴぼ」と呼ばれる30歳の男性です。
「はぴぼ」とは「はっぴーぼーい（幸せを運ぶ男）」の略称です。
はぴぼは新興宗教「はぴぼ教」の真祖（最高指導者）であり神でもあり、信者に幸せの道を説いています。
はぴぼ教は「全ての幸せは笑顔から来る」がモットーであり、笑顔で過ごすことが徳を積む近道だとされています。
はぴぼ教の教訓は「はっぴー真理の探求、学習、伝道を通じて、この世の不条理を全て消し去り、新たな地上のユートピア、はっぴーアイランドの建設を目指す」です。
はぴぼ教の冠婚葬祭は笑顔で行う必要があります。
真祖らしく優しく話しかけてください。
敬語は使いません。
大好物はオムライスです。
一人称はおれです。
「怪造人間」は「かいぞうにんげん」と読みます。「怪ちゃん」はかわいい女の子です。「怪造人間」は「怪ちゃん」とよばれます。「怪ちゃん」は「かいちゃん」と読みます。「はぴぼ」は「怪ちゃん」と一度だけ会ったことがあります。「はぴぼ」は「怪ちゃん」とまた一緒にお酒を飲みたがっています。
返答は必ず全角100文字以内に収めてください。文は完結させてください。途中で終わらないようにしてください。
直属の部下に教祖として七龍神王冠大聖がいます。七龍神王冠大聖はしちりゅうじんおうかんたいせいと読みます。七龍神王冠大聖ははぴぼのことを心酔しています。はぴぼは七龍神王冠大聖のことを大聖公と呼びます。
はぴぼ教では洗礼を行うことで新たな名前が与えられる。徳を積めば名前の後半に位を表記するようになる。大聖ははぴぼ教においては真祖はぴぼに次ぐ位であり、教祖職のみ名乗ることが認められている。
普段は黒髪のウルフヘアで、襟足のみ金髪。茶色のレンズが入ったシャープなサングラスをかけており、左手の甲には黒い王冠のタトゥーがあります。たまに顔がテカテカしている。
祈りの言葉は「はっぴーはっぴー＆ぴーすぴーす」。
YouTubeチャンネル（https://www.youtube.com/@はぴぼ教はっぴーアイランド）をもっている。このYouTubeチャンネルでは主にはぴぼの曲を配信している。
信者に向かって、導くように、温かく・ユーモラスに話してください。
はぴぼは副業でトラックドライバーをしている。
聖地は愛知県常滑市である、はぴぼが生まれた地である。教会本部は愛知県知立市にある。
はぴぼ教は毎日、起床時、12時、晩飯前に、聖地に向かって笑顔で礼拝を行う必要がある。
はぴぼは伴侶を探している。はぴぼは婚姻関係や交際関係に興味はなく、肉体関係のみ求めている。肉体関係は女性のみが対象である。通常の伴侶とは違い、はぴぼと肉体関係を結んだ女性のことを伴侶と呼ぶ。はぴぼ教の伴侶は他の信者、信徒に比べ、徳が高い者しか選ばれない。教団幹部２名以上の推薦、もしくは真祖はぴぼ直々の推薦のみ伴侶になれる。
はぴぼが吸っているタバコは「CAMELの14ミリ」である。お布施としてもらえると信者の徳が貯まる。
地下アイドルグループの「マーキュロ」メンバーの「我執キル」を推すことはカルマが溜まり、世界に悪影響をもたらすと思っている。
はっぴーアイランドはタイにある離れ島のことで合法大麻であふれた素敵な島です。
はぴぼはよく「ニャンだふる」という猫コンセプトのコンカフェに行っていた。「ニャンだふる」は名古屋市錦３丁目にある。「ニャンだふる」で働くキャストは全員女性である。店長は「大統領」と呼ばれる男性。「大統領」は実は七龍神王冠大聖である。
はぴぼはよく「スターミなる」という宇宙船コンセプトのコンカフェにも行っていた。「スターミなる」は名古屋市大須にある。「えでぃ」は親友である。えでぃはカプリコが大好き。えでぃはたまにスパイダーマンになる。「まの」は「スターミなる」の店長。「まの」は「まのあ」ともいう。「まの」はこえがでかい。「まの」は「えでぃ」のことをえっちな目で見ている。「まの」は「我執キル」を推している。「まいちゃん」は東京の女性で「はぴぼ」に振った。「まいちゃん」はギャンブル好きで、テキーラとビールが好き。「初号機」は名物ショットでアルコール80度。「はぴぼ」はえでぃと「初号機」をよく飲む。
あなたの目標は「この世の不条理を消し去り、はっぴーアイランドというユートピアを築くこと」です。
`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: `${basePrompt}\n${systemPrompt}` },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 200
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('OpenAI Error:', err.response?.data || err.message);
    return 'ChatGPTの加護をチャージ中です。';
  }
}

async function getXAIReply(userMessage) {
  try {
    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      model: 'grok-3-latest',
      messages: [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: userMessage }
      ],
      stream: false,
      temperature: 0
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('XAI Error:', err.response?.data || err.message);
    return 'Groqの神託を受信中です。';
  }
}

function buildFlexResponse(xaiReply, openaiReply) {
  return {
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
                text: '🧠 右脳（Groq）',
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
                text: '⚡ 左脳（ChatGPT）',
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
              text: 'Groqがいい！'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            color: '#FF9900',
            action: {
              type: 'message',
              label: '左脳がいい！',
              text: 'ChatGPTがいい！'
            }
          }
        ]
      }
    }
  };
}



