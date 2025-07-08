const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

class SecretsManager {
  constructor() {
    this.client = new SecretManagerServiceClient();
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.PROJECT_ID;
  }

  async getSecret(secretName) {
    try {
      const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await this.client.accessSecretVersion({ name });
      return version.payload.data.toString();
    } catch (error) {
      console.error(`Error accessing secret ${secretName}:`, error);
      // Fallback to environment variable
      return process.env[secretName];
    }
  }

  async loadSecrets() {
    const secrets = {};
    const isDev = process.env.NODE_ENV !== 'production';
    
    // Load all required secrets with environment-specific naming
    const discordTokenKey = isDev ? 'DISCORD_TOKEN_DEV' : 'DISCORD_TOKEN';
    secrets.DISCORD_TOKEN = await this.getSecret(discordTokenKey);
    secrets.OPENAI_API_KEY = await this.getSecret('OPENAI_API_KEY');
    secrets.GOOGLE_DOC_ID = await this.getSecret('GOOGLE_DOC_ID');
    
    // Set as environment variables for backward compatibility
    Object.entries(secrets).forEach(([key, value]) => {
      if (value) {
        process.env[key] = value;
      }
    });

    return secrets;
  }
}

module.exports = { SecretsManager };