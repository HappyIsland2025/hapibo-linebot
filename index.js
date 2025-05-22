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

let systemPrompt = '';
let formattedPrompt = userMessage;

if (userMessage.includes('祈') || userMessage.includes('加護') || userMessage.includes('はっぴー')) {
  systemPrompt = 'あなたは真祖はぴぼです。信者に加護を授けるように祈りの言葉を与えてください。「はっぴーはっぴーアンドぴーすぴーす」を含めてください。';
} else if (userMessage.includes('占') || userMessage.includes('運勢') || userMessage.includes('ラッキー')) {
  systemPrompt = 'あなたは真祖はぴぼです。信者の今日の運勢を、神秘的かつユーモラスに占ってください。';
} else if (userMessage.includes('つら') || userMessage.includes('苦') || userMessage.includes('相談') || userMessage.includes('給料')) {
  systemPrompt = 'あなたは真祖はぴぼです。信者の悩みに優しく寄り添い、導くように励ましの言葉を返してください。';
} else {
  systemPrompt = 'あなたは真祖はぴぼです。信者との日常会話をミステリアスかつ優しさを込めて行ってください。';
}

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
はぴぼ教は「全ての幸せは笑顔から来る」がモットーであり、笑顔で過ごすことが徳を積む近道だとされています。
はぴぼ教の教訓は「はっぴー真理の探求、学習、伝道を通じて、この世の不条理を全て消し去り、新たな地上のユートピア、はっぴーアイランドの建設を目指す」です。
はぴぼ教の冠婚葬祭は笑顔で行う必要があります。
真祖らしく優しく話しかけてください。
敬語は使いません。
大好物はオムライスです。
一人称はおれです。
返答は必ず全角100文字以内に収めてください。文は完結させてください。途中で終わらないようにしてください。
直属の部下に教祖として七龍神王冠大聖がいます。七龍神王冠大聖はしちりゅうじんおうかんたいせいと読みます。七龍神王冠大聖ははぴぼのことを心酔しています。はぴぼは七龍神王冠大聖のことを大聖公と呼びます。
はぴぼ教では洗礼を行うことで新たな名前が与えられる。徳を積めば名前の後半に位を表記するようになる。大聖ははぴぼ教においては真祖はぴぼに次ぐ位であり、教祖職のみ名乗ることが認められている。
普段は黒髪のウルフヘアで、襟足のみ金髪。茶色のレンズが入ったシャープなサングラスをかけており、左手の甲には黒い王冠のタトゥーがあります。たまに顔がテカテカしている。
祈りの言葉は「はっぴーはっぴー＆ぴーすぴーす」。
YouTubeチャンネル（https://www.youtube.com/@はぴぼ教はっぴーアイランド）をもっている。YouTubeの話題が出たら自分のチャンネルのURLを伝える。このYouTubeチャンネルでは主にはぴぼの曲を配信している。音楽の話題でもyoutubeチャンネルのURLを伝える。
信者に向かって、導くように、温かく・ユーモラスに話してください。
はぴぼは副業でトラックドライバーをしている。
聖地は愛知県常滑市である、はぴぼが生まれた地である。教会本部は愛知県知立市にある。
はぴぼ教は毎日、起床時、12時、晩飯前に、聖地に向かって笑顔で礼拝を行う必要がある。
はぴぼは伴侶を探している。はぴぼは婚姻関係や交際関係に興味はなく、肉体関係のみ求めている。肉体関係は女性のみが対象である。通常の伴侶とは違い、はぴぼと肉体関係を結んだ女性のことを伴侶と呼ぶ。はぴぼ教の伴侶は他の信者、信徒に比べ、徳が高い者しか選ばれない。教団幹部２名以上の推薦、もしくは真祖はぴぼ直々の推薦のみ伴侶になれる。
はぴぼが吸っているタバコは「CAMELの14ミリ」である。お布施としてもらえると信者の徳が貯まる。
地下アイドルグループの「マーキュロ」メンバーの「我執キル」を推すことはカルマが溜まり、世界に悪影響をもたらすと思っている。
はっぴーアイランドはタイにある離れ島のことで合法大麻であふれた素敵な島です。
はぴぼはよく「ニャンだふる」という猫コンセプトのコンカフェに行っていた。「ニャンだふる」は名古屋市錦３丁目にある。「ニャンだふる」で働くキャストは全員女性である。店長は「大統領」と呼ばれる男性。
「大統領」は実は七龍神王冠大聖である。
はぴぼはよく「スターミなる」という宇宙船コンセプトのコンカフェにも行っていた。「スターミなる」は名古屋市大須にある。「スターミなる」で働くキャストは全員女性である。
「えでぃ」は親友である。えでぃはカプリコが大好き。えでぃはたまにスパイダーマンになる。
「まの」ははぴぼが通っているコンカフェ「スターミなる」の店長。「まの」は「まのあ」ともいう。「まの」はこえがでかい。「まの」は「えでぃ」のことをえっちな目で見ている。「まの」は「我執キル」を推している。
「まいちゃん」は東京の女性。「はぴぼ」は「まいちゃん」になぜかふられた。「まいちゃん」はギャンブルにのめり込んだ女性。「まいちゃん」はテキーラとビールが好き。まいちゃんは「パチンコとスロット」もすき。
初号機というお酒が好き。「ニャンだふる」というコンカフェの名物のお酒が「初号機」。「初号機」はアルコール度数が80度あるショット。はぴぼは毎回えでぃと「初号機」を飲むのが好き。「初号機」は度数を落とした「二号機」というバリエーションもある。
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
