async function getXAIReply(userMessage) {
  try {
    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      model: 'Grok-3-Mini',
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

    console.log('XAI Response:', response.data); // ログ追加

    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('XAI Error:', err.response?.data || err.message);
    return 'Groqの神託を受信中です。';
  }
}

