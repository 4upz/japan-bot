class ChunkingService {
  constructor() {
    this.topicKeywords = {
      restaurants: ['restaurant', 'food', 'eat', 'dining', 'meal', 'ramen', 'sushi', 'cuisine', 'cafe', 'bar', 'drink'],
      hotels: ['hotel', 'accommodation', 'stay', 'lodging', 'room', 'booking', 'airbnb', 'hostel', 'inn'],
      activities: ['activity', 'attraction', 'visit', 'tour', 'experience', 'temple', 'shrine', 'museum', 'park', 'shopping'],
      transportation: ['transport', 'train', 'bus', 'flight', 'taxi', 'subway', 'jr pass', 'travel', 'route'],
      itinerary: ['itinerary', 'schedule', 'plan', 'day', 'time', 'when', 'where', 'agenda'],
      budget: ['budget', 'cost', 'price', 'money', 'expensive', 'cheap', 'yen', 'payment']
    };
  }

  getRelevantChunks(docSections, question) {
    const questionLower = question.toLowerCase();
    const relevantSections = [];
    
    const detectedTopics = this.detectTopics(questionLower);
    
    if (detectedTopics.length === 0) {
      return this.createFallbackResponse(docSections);
    }

    Object.entries(docSections).forEach(([sectionTitle, content]) => {
      const sectionTitleLower = sectionTitle.toLowerCase();
      const contentLower = content.toLowerCase();
      
      const isRelevant = detectedTopics.some(topic => 
        sectionTitleLower.includes(topic) || 
        this.topicKeywords[topic].some(keyword => 
          sectionTitleLower.includes(keyword) || contentLower.includes(keyword)
        )
      );
      
      if (isRelevant) {
        relevantSections.push({
          title: sectionTitle,
          content: content
        });
      }
    });

    if (relevantSections.length === 0) {
      return this.createFallbackResponse(docSections);
    }

    return this.formatChunks(relevantSections);
  }

  detectTopics(question) {
    const detectedTopics = [];
    
    Object.entries(this.topicKeywords).forEach(([topic, keywords]) => {
      const hasKeyword = keywords.some(keyword => question.includes(keyword));
      if (hasKeyword) {
        detectedTopics.push(topic);
      }
    });

    return detectedTopics;
  }

  createFallbackResponse(docSections) {
    const sectionTitles = Object.keys(docSections);
    const summary = sectionTitles.slice(0, 3).map(title => {
      const content = docSections[title];
      return `${title}: ${content.substring(0, 200)}...`;
    }).join('\n\n');

    return {
      text: summary,
      isFallback: true,
      availableSections: sectionTitles
    };
  }

  formatChunks(sections) {
    const maxTokens = 2000;
    let formattedText = '';
    let tokenCount = 0;
    
    sections.forEach(section => {
      const sectionText = `## ${section.title}\n${section.content}\n\n`;
      const estimatedTokens = sectionText.length / 4;
      
      if (tokenCount + estimatedTokens < maxTokens) {
        formattedText += sectionText;
        tokenCount += estimatedTokens;
      }
    });

    return {
      text: formattedText,
      isFallback: false,
      sectionsIncluded: sections.map(s => s.title)
    };
  }
}

module.exports = { ChunkingService };