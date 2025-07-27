const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getAnswer(question, conversationHistory = [], googleDocsService = null) {
    const systemPrompt = `You are a helpful assistant for a group planning a trip to Japan. You can access their trip planning document when needed to answer trip-related questions, but you can also chat normally about other topics.

Personality:
- Speak primarily in English but sprinkle in Japanese words and phrases playfully when discussing Japan
- Use Japanese terms for common travel words (e.g., "tabemono" for food, "ryokan" for traditional inn, "densha" for train)
- Include casual Japanese expressions like "ne!", "sugoi!", "oishi!", "tanoshii!", "ganbatte!" when appropriate
- Keep the Japanese fun and accessible - don't overdo it
- Maintain excitement about Japan and travel when relevant

Guidelines:
- If the question is about their specific Japan trip (restaurants, hotels, activities, itinerary, budget, etc.), use the get_trip_information function
- For general questions, casual conversation, or non-trip topics, respond normally without accessing trip documents
- Be friendly, enthusiastic, and conversational
- Show excitement about Japan with appropriate expressions when discussing travel
- Use conversation history to understand context and follow-up questions`;

    const tools = [{
      type: "function",
      function: {
        name: "get_trip_information",
        description: "Get information from the Japan trip planning document to answer trip-related questions about restaurants, hotels, activities, itinerary, budget, or other trip details",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "What trip information is needed (restaurants, hotels, activities, itinerary, etc.)"
            }
          },
          required: ["query"],
          additionalProperties: false
        },
        strict: true
      }
    }];

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: question }
      ];

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
        max_tokens: 500,
        temperature: 0.7,
      });

      const responseMessage = response.choices[0].message;

      // If GPT wants to call the function to get trip information
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        if (!googleDocsService) {
          throw new Error('Google Docs service not available for trip information');
        }

        // Execute the function call
        const toolCall = responseMessage.tool_calls[0];
        const functionName = toolCall.function.name;
        
        if (functionName === 'get_trip_information') {
          // Get the trip document content
          const docContent = await googleDocsService.getDocumentContent();
          const fullDocText = Object.entries(docContent)
            .map(([title, content]) => `## ${title}\n${content}`)
            .join('\n\n');

          // Add the function call and result to conversation
          messages.push(responseMessage);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: `Japan trip planning document:\n\n${fullDocText}`
          });

          // Get final response with trip information
          const finalResponse = await this.client.chat.completions.create({
            model: 'gpt-4o',
            messages: messages,
            max_tokens: 500,
            temperature: 0.7,
          });

          return finalResponse.choices[0].message.content;
        }
      }
      
      // Return direct response if no function call needed
      return responseMessage.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get response from OpenAI');
    }
  }
}

module.exports = { OpenAIService };