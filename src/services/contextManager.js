class ContextManager {
  constructor() {
    this.contexts = new Map();
    this.maxMessagesPerChannel = 8;
    this.contextExpiryMs = 30 * 60 * 1000; // 30 minutes
    this.cleanupIntervalMs = 5 * 60 * 1000; // 5 minutes
    
    // Start periodic cleanup
    this.startCleanupTimer();
  }

  storeMessage(channelId, role, content) {
    const timestamp = Date.now();
    
    if (!this.contexts.has(channelId)) {
      this.contexts.set(channelId, {
        messages: [],
        lastActivity: timestamp
      });
    }
    
    const context = this.contexts.get(channelId);
    context.messages.push({
      role,
      content,
      timestamp
    });
    
    context.lastActivity = timestamp;
    
    // Trim messages if exceeding limit
    if (context.messages.length > this.maxMessagesPerChannel) {
      context.messages = context.messages.slice(-this.maxMessagesPerChannel);
    }
  }

  getContext(channelId) {
    const context = this.contexts.get(channelId);
    if (!context) {
      return [];
    }
    
    const now = Date.now();
    const cutoffTime = now - this.contextExpiryMs;
    
    // Filter out expired messages
    const validMessages = context.messages.filter(msg => msg.timestamp > cutoffTime);
    
    // Update context if we filtered messages
    if (validMessages.length !== context.messages.length) {
      if (validMessages.length === 0) {
        this.contexts.delete(channelId);
        return [];
      }
      context.messages = validMessages;
    }
    
    return validMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  cleanupExpired() {
    const now = Date.now();
    const cutoffTime = now - this.contextExpiryMs;
    
    for (const [channelId, context] of this.contexts.entries()) {
      if (context.lastActivity < cutoffTime) {
        this.contexts.delete(channelId);
      }
    }
  }

  startCleanupTimer() {
    setInterval(() => {
      this.cleanupExpired();
    }, this.cleanupIntervalMs);
  }

  getStats() {
    return {
      totalChannels: this.contexts.size,
      totalMessages: Array.from(this.contexts.values())
        .reduce((sum, context) => sum + context.messages.length, 0),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  estimateMemoryUsage() {
    let totalSize = 0;
    for (const context of this.contexts.values()) {
      for (const message of context.messages) {
        totalSize += message.content.length * 2; // Rough estimate for UTF-16
      }
    }
    return `${Math.round(totalSize / 1024)} KB`;
  }

  clearChannel(channelId) {
    this.contexts.delete(channelId);
  }

  clearAll() {
    this.contexts.clear();
  }
}

module.exports = { ContextManager };