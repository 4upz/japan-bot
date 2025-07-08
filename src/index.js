const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleDocsService } = require('./services/googleDocs');
const { OpenAIService } = require('./services/openai');
const { ChunkingService } = require('./services/chunking');
const { ContextManager } = require('./services/contextManager');
const { SecretsManager } = require('./utils/secrets');
require('dotenv').config();

async function startBot() {
  // Load secrets from Google Secret Manager
  const secretsManager = new SecretsManager();
  await secretsManager.loadSecrets();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  const googleDocs = new GoogleDocsService();
  const openai = new OpenAIService();
  const chunking = new ChunkingService();
  const contextManager = new ContextManager();

  client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    const isMentioned = message.mentions.has(client.user);
    if (!isMentioned) return;

    const question = message.content.replace(`<@${client.user.id}>`, '').trim();
    if (!question) {
      await message.reply('Please ask me a question about your Japan trip!');
      return;
    }

    try {
      await message.channel.sendTyping();
      
      const channelId = message.channel.id;
      const conversationHistory = contextManager.getContext(channelId);
      
      const docContent = await googleDocs.getDocumentContent();
      const answer = await openai.getAnswer(docContent, question, conversationHistory);
      
      contextManager.storeMessage(channelId, 'user', question);
      contextManager.storeMessage(channelId, 'assistant', answer);
      
      await message.reply(answer);
    } catch (error) {
      console.error('Error processing question:', error);
      await message.reply('Sorry, I encountered an error processing your question. Please try again.');
    }
  });

  await client.login(process.env.DISCORD_TOKEN);
}

startBot().catch(console.error);