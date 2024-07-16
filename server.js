const { App } = require('@slack/bolt');
const fs = require('fs');
require('dotenv').config();
const port = 4000;

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

app.command('/idea', async ({ command, ack, client }) => {
  await ack();
  const text = command.text.toLowerCase();
  const level = getLevel(text);

  if (level && ideas[level]) {
    const ideasList = ideas[level];
    const randomIndex = Math.floor(Math.random() * ideasList.length);
    if (ideasList[randomIndex]) {
      const idea = ideasList[randomIndex];
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: `💡 Here is a project idea for ${level} programmers:\n${idea}!`,
      });
    } else {
      console.error(`Empty idea found at index ${randomIndex} in ${level} ideas list.`);
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: `🦑 Sorry, I couldn't find a project idea right now. Please try again later.`,
      });
    }
  } else {
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: `🌊 Please specify your coding experience level as 'beginner', 'intermediate', or 'advanced'.`,
    });
  }
});

(async () => {
  await app.start();
  console.log('⚡️ Slack bot is running!');
})();

function getLevel(text) {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('beginner') || lowerText.includes('novice') || lowerText.includes('newbie')) {
    return 'beginner';
  } else if (lowerText.includes('intermediate') || lowerText.includes('intermed')) {
    return 'intermediate';
  } else if (lowerText.includes('advanced') || lowerText.includes('expert')) {
    return 'advanced';
  }

  return null;
}
