const { App } = require('@slack/bolt');
const fs = require('fs');
require('dotenv').config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

const ideas = {
  beginner: readIdeasFromFile('beginner.txt'),
  intermediate: readIdeasFromFile('intermediate.txt'),
  advanced: readIdeasFromFile('advanced.txt'),
};

function readIdeasFromFile(filename) {
  try {
    const ideas = fs.readFileSync(filename, 'utf8').split('\n').filter(line => line.trim() !== '');
    return ideas;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

app.event('app_mention', async ({ event, client }) => {
  try {
    console.log('app_mention event received:', event);

    // Check if the mention is in a thread
    if (event.thread_ts) {
      const thread = await client.conversations.replies({
        channel: event.channel,
        ts: event.thread_ts
      });

      const userReply = thread.messages[thread.messages.length - 1]; // Get the latest reply in the thread
      const text = userReply.text.toLowerCase();
      const level = getLevel(text);

      console.log(`User response in thread: ${text}, Level detected: ${level}`);

      if (level && ideas[level]) {
        const ideasList = ideas[level];
        const randomIndex = Math.floor(Math.random() * ideasList.length);
        const idea = ideasList[randomIndex];

        await client.chat.postMessage({
          channel: event.channel,
          thread_ts: event.thread_ts,
          text: `Here is a project idea for ${level} programmers:\n${idea}`,
        });
      } else {
        await client.chat.postMessage({
          channel: event.channel,
          thread_ts: event.thread_ts,
          text: `Please specify your coding experience level as 'beginner', 'intermediate', or 'advanced'.`,
        });
      }
    } else {
      await client.chat.postMessage({
        channel: event.channel,
        thread_ts: event.ts,
        text: `Please reply in a thread to get project ideas. Mention me (@bot-name) again with your coding experience level.`,
      });
    }
  } catch (error) {
    console.error('Error in app_mention event handler:', error);
  }
});

(async () => {
  await app.start();
  console.log('⚡️ Slack bot is running!!');
})();

function getLevel(text) {
  const lowerText = text.toLowerCase(); // Convert to lowercase for case-insensitive comparison

  // Check for common phrases indicating skill levels
  if (lowerText.includes('beginner') || lowerText.includes('novice') || lowerText.includes('newbie')) {
    return 'beginner';
  } else if (lowerText.includes('intermediate') || lowerText.includes('intermed')) {
    return 'intermediate';
  } else if (lowerText.includes('advanced') || lowerText.includes('expert')) {
    return 'advanced';
  }

  // Default to null if no match found
  return null;
}
