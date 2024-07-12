const { App } = require('@slack/bolt');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

let userLevels = {};

app.event('app_mention', async ({ event, client }) => {
  try {
    console.log('app_mention event received:', event);
    const question = 'What is your coding experience level? (beginner, intermediate, advanced)';
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: question,
    });
  } catch (error) {
    console.error('Error in app_mention event handler:', error);
  }
});

app.message(async ({ message, say }) => {
  console.log('message event received:', message);
  if (message.thread_ts) {
    const user = message.user;
    const text = message.text.toLowerCase();
    console.log('message in thread:', text);

    if (['beginner', 'intermediate', 'advanced'].includes(text)) {
      userLevels[user] = text;
      try {
        const response = await openai.createChatCompletion({
          model: "gpt-4",
          messages: [
            { role: "system", content: `You are a helpful assistant for generating coding project ideas.` },
            { role: "user", content: `Generate a coding project idea for a ${text} level programmer.` }
          ],
        });

        const idea = response.data.choices[0].message.content;
        console.log('Generated idea:', idea);
        await say({
          text: `Here is a project idea for a ${text} level programmer:\n${idea}`,
          thread_ts: message.thread_ts,
        });
      } catch (error) {
        console.error('Error generating project idea:', error);
      }
    }
  }
});

(async () => {
  await app.start();
  console.log('!!⚡️ Slack bot is running!');
})();
