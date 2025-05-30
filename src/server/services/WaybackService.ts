import axios from 'axios';
import { ContentSource, ContentType } from '@/types/game';

export class WaybackService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://archive.org/wayback/available';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchContent(type: ContentType, url: string): Promise<ContentSource> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          url,
          timestamp: this.getRandomTimestamp(),
        },
        headers: {
          'Authorization': `LOW ${this.apiKey}`,
        },
      });

      const snapshot = response.data.archived_snapshots.closest;
      if (!snapshot || !snapshot.available) {
        throw new Error('No archived snapshot available');
      }

      // Fetch the actual content
      const contentResponse = await axios.get(snapshot.url);
      const content = this.parseContent(type, contentResponse.data);

      return {
        type,
        id: this.generateId(url),
        url: snapshot.url,
        content: content.text,
        author: content.author,
        timestamp: snapshot.timestamp,
      };
    } catch (error) {
      console.error('Error fetching from Wayback Machine:', error);
      throw error;
    }
  }

  private getRandomTimestamp(): string {
    // Get a random timestamp between 2010 and now
    const start = new Date('2010-01-01').getTime();
    const end = new Date().getTime();
    const timestamp = new Date(start + Math.random() * (end - start));
    return timestamp.toISOString().split('T')[0];
  }

  private generateId(url: string): string {
    return Buffer.from(url).toString('base64');
  }

  private parseContent(type: ContentType, html: string): { text: string; author: string } {
    // Basic parsing - in production, use proper HTML parsing libraries
    switch (type) {
      case 'reddit':
        return this.parseRedditContent(html);
      case 'facebook':
        return this.parseFacebookContent(html);
      case 'imgur':
        return this.parseImgurContent(html);
      default:
        throw new Error(`Unsupported content type: ${type}`);
    }
  }

  private parseRedditContent(html: string): { text: string; author: string } {
    // Basic Reddit comment parsing
    const authorMatch = html.match(/data-author="([^"]+)"/);
    const contentMatch = html.match(/data-content="([^"]+)"/);

    return {
      author: authorMatch ? authorMatch[1] : 'unknown',
      text: contentMatch ? contentMatch[1] : 'No content found',
    };
  }

  private parseFacebookContent(html: string): { text: string; author: string } {
    // Basic Facebook post parsing
    const authorMatch = html.match(/data-author="([^"]+)"/);
    const contentMatch = html.match(/data-content="([^"]+)"/);

    return {
      author: authorMatch ? authorMatch[1] : 'unknown',
      text: contentMatch ? contentMatch[1] : 'No content found',
    };
  }

  private parseImgurContent(html: string): { text: string; author: string } {
    // Basic Imgur post parsing
    const authorMatch = html.match(/data-author="([^"]+)"/);
    const contentMatch = html.match(/data-content="([^"]+)"/);

    return {
      author: authorMatch ? authorMatch[1] : 'unknown',
      text: contentMatch ? contentMatch[1] : 'No content found',
    };
  }
} 