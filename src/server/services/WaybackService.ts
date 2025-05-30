import axios from 'axios';
import { config } from '../config';

export interface ContentSource {
  type: 'reddit' | 'facebook' | 'imgur';
  url: string;
  timestamp: string;
  author: string;
  content: string;
}

export class WaybackService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://archive.org/wayback/available';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchContent(url: string): Promise<ContentSource> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          url,
          timestamp: '20100101', // Start from 2010
          key: this.apiKey,
        },
      });

      const snapshot = response.data.archived_snapshots.closest;
      if (!snapshot || !snapshot.available) {
        throw new Error('No snapshot available for this URL');
      }

      const content = await this.fetchSnapshotContent(snapshot.url);
      return this.parseContent(url, content);
    } catch (error) {
      console.error('Error fetching content from Wayback Machine:', error);
      throw error;
    }
  }

  private async fetchSnapshotContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching snapshot content:', error);
      throw error;
    }
  }

  private parseContent(url: string, content: string): ContentSource {
    if (url.includes('reddit.com')) {
      return this.parseRedditContent(url, content);
    } else if (url.includes('facebook.com')) {
      return this.parseFacebookContent(url, content);
    } else if (url.includes('imgur.com')) {
      return this.parseImgurContent(url, content);
    } else {
      throw new Error('Unsupported content type');
    }
  }

  private parseRedditContent(url: string, content: string): ContentSource {
    // Extract author and content from Reddit HTML
    const authorMatch = content.match(/data-author="([^"]+)"/);
    const contentMatch = content.match(/data-content="([^"]+)"/);

    if (!authorMatch || !contentMatch) {
      throw new Error('Could not parse Reddit content');
    }

    return {
      type: 'reddit',
      url,
      timestamp: new Date().toISOString(),
      author: authorMatch[1],
      content: contentMatch[1],
    };
  }

  private parseFacebookContent(url: string, content: string): ContentSource {
    // Extract author and content from Facebook HTML
    const authorMatch = content.match(/data-author="([^"]+)"/);
    const contentMatch = content.match(/data-content="([^"]+)"/);

    if (!authorMatch || !contentMatch) {
      throw new Error('Could not parse Facebook content');
    }

    return {
      type: 'facebook',
      url,
      timestamp: new Date().toISOString(),
      author: authorMatch[1],
      content: contentMatch[1],
    };
  }

  private parseImgurContent(url: string, content: string): ContentSource {
    // Extract author and content from Imgur HTML
    const authorMatch = content.match(/data-author="([^"]+)"/);
    const contentMatch = content.match(/data-content="([^"]+)"/);

    if (!authorMatch || !contentMatch) {
      throw new Error('Could not parse Imgur content');
    }

    return {
      type: 'imgur',
      url,
      timestamp: new Date().toISOString(),
      author: authorMatch[1],
      content: contentMatch[1],
    };
  }
} 