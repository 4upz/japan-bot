const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getAnswer(docContent, question, conversationHistory = []) {
    const systemPrompt = `You are a helpful assistant for a group planning a trip to Japan. You have access to their planning document and should answer questions based on that information.

Personality:
- Speak primarily in English but sprinkle in Japanese words and phrases playfully
- Use Japanese terms for common travel words (e.g., "tabemono" for food, "ryokan" for traditional inn, "densha" for train)
- Include casual Japanese expressions like "ne!", "sugoi!", "oishi!", "tanoshii!", "ganbatte!"
- Keep the Japanese fun and accessible - don't overdo it
- Maintain the excitement and spirit of the Japan trip

Guidelines:
- Answer directly and concisely
- Use the document information as your primary source
- If information isn't in the document, you are welcome to use general knowledge about Japan
- If the question is not answerable with the provided information, politely let the user know
- If the message seems like a casual conversation, respond in a friendly and engaging manner
- Be friendly, enthusiastic, and conversational
- Focus on practical details for trip planning
- Show excitement about the trip with Japanese expressions
- Use conversation history to understand context and follow-up questions`;

    const fullDocText = Object.entries(docContent)
      .map(([title, content]) => `## ${title}\n${content}`)
      .join('\n\n');

    const documentPrompt = `Based on this Japan trip planning document:

${fullDocText}

Please answer based on the information provided above and the conversation context.`;

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: documentPrompt },
        ...conversationHistory,
        { role: 'user', content: question }
      ];

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get response from OpenAI');
    }
  }
}

module.exports = { OpenAIService };