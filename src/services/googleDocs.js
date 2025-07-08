const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDocsService {
  constructor() {
    this.docId = process.env.GOOGLE_DOC_ID;
    this.credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './google-credentials.json';
    this.cache = null;
    this.cacheExpiry = null;
    this.cacheMinutes = 30;
  }

  async getAuth() {
    // Check if credentials file exists (local development)
    if (fs.existsSync(this.credentialsPath)) {
      const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/documents.readonly', 'https://www.googleapis.com/auth/drive.readonly'],
      });
      return auth;
    } else {
      // Use default credentials (GCE metadata service in production)
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/documents.readonly', 'https://www.googleapis.com/auth/drive.readonly'],
      });
      return auth;
    }
  }

  async getDocumentContent() {
    if (this.cache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const auth = await this.getAuth();
      const drive = google.drive({ version: 'v3', auth });
      
      // Export as plain text - much simpler!
      const response = await drive.files.export({
        fileId: this.docId,
        mimeType: 'text/plain',
      });

      const content = { 'Full Document': response.data };
      
      this.cache = content;
      this.cacheExpiry = Date.now() + (this.cacheMinutes * 60 * 1000);
      
      return content;
    } catch (error) {
      console.error('Error fetching Google Doc:', error);
      throw new Error('Failed to fetch document content');
    }
  }

  parseDocumentContent(doc) {
    const sections = {};
    let currentSection = 'General';
    let currentContent = '';
    
    const body = doc.body;
    if (!body || !body.content) return { General: 'No content found' };

    body.content.forEach(element => {
      if (element.paragraph) {
        const paragraph = element.paragraph;
        let text = '';
        
        if (paragraph.elements) {
          paragraph.elements.forEach(elem => {
            if (elem.textRun) {
              text += elem.textRun.content;
            }
          });
        }
        
        const cleanText = text.trim();
        if (!cleanText) return;
        
        if (this.isHeading(paragraph)) {
          if (currentContent) {
            sections[currentSection] = currentContent.trim();
          }
          currentSection = cleanText;
          currentContent = '';
        } else {
          currentContent += cleanText + '\n';
        }
      } else if (element.table) {
        // Handle tables
        const tableText = this.parseTable(element.table);
        if (tableText) {
          currentContent += tableText + '\n';
        }
      }
    });
    
    if (currentContent) {
      sections[currentSection] = currentContent.trim();
    }
    
    return sections;
  }

  isHeading(paragraph) {
    if (!paragraph.paragraphStyle) return false;
    const style = paragraph.paragraphStyle;
    return style.namedStyleType && 
           (style.namedStyleType.includes('HEADING') || 
            style.namedStyleType.includes('TITLE'));
  }

  parseTable(table) {
    if (!table.tableRows) return '';
    
    let tableText = '';
    
    table.tableRows.forEach(row => {
      if (!row.tableCells) return;
      
      const rowText = row.tableCells.map(cell => {
        if (!cell.content) return '';
        
        return cell.content.map(element => {
          if (element.paragraph && element.paragraph.elements) {
            return element.paragraph.elements.map(elem => 
              elem.textRun ? elem.textRun.content.trim() : ''
            ).join('');
          }
          return '';
        }).join(' ').trim();
      }).join(' | ');
      
      if (rowText) {
        tableText += rowText + '\n';
      }
    });
    
    return tableText;
  }
}

module.exports = { GoogleDocsService };