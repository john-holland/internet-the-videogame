import { WaybackService } from '../WaybackService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WaybackService', () => {
  let waybackService: WaybackService;
  const apiKey = 'test-api-key';

  beforeEach(() => {
    waybackService = new WaybackService(apiKey);
  });

  describe('fetchContent', () => {
    it('should fetch content from Wayback Machine', async () => {
      const mockSnapshot = {
        archived_snapshots: {
          closest: {
            available: true,
            url: 'https://web.archive.org/web/20240101000000/https://reddit.com/r/AskReddit',
            timestamp: '20240101000000',
          },
        },
      };

      const mockContent = `
        <div data-author="test_author">
          <div data-content="This is a test comment">
            Test content
          </div>
        </div>
      `;

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockSnapshot })
        .mockResolvedValueOnce({ data: mockContent });

      const content = await waybackService.fetchContent('reddit', 'https://reddit.com/r/AskReddit');

      expect(content.type).toBe('reddit');
      expect(content.url).toBe(mockSnapshot.archived_snapshots.closest.url);
      expect(content.author).toBe('test_author');
      expect(content.content).toBe('This is a test comment');
      expect(content.timestamp).toBe(mockSnapshot.archived_snapshots.closest.timestamp);
    });

    it('should throw error when no snapshot available', async () => {
      const mockResponse = {
        archived_snapshots: {
          closest: {
            available: false,
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      await expect(
        waybackService.fetchContent('reddit', 'https://reddit.com/r/AskReddit')
      ).rejects.toThrow('No archived snapshot available');
    });

    it('should throw error when API request fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API request failed'));

      await expect(
        waybackService.fetchContent('reddit', 'https://reddit.com/r/AskReddit')
      ).rejects.toThrow('API request failed');
    });
  });

  describe('parseContent', () => {
    it('should parse Reddit content correctly', async () => {
      const mockSnapshot = {
        archived_snapshots: {
          closest: {
            available: true,
            url: 'https://web.archive.org/web/20240101000000/https://reddit.com/r/AskReddit',
            timestamp: '20240101000000',
          },
        },
      };

      const mockContent = `
        <div data-author="reddit_user">
          <div data-content="This is a Reddit comment">
            Reddit content
          </div>
        </div>
      `;

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockSnapshot })
        .mockResolvedValueOnce({ data: mockContent });

      const content = await waybackService.fetchContent('reddit', 'https://reddit.com/r/AskReddit');

      expect(content.author).toBe('reddit_user');
      expect(content.content).toBe('This is a Reddit comment');
    });

    it('should parse Facebook content correctly', async () => {
      const mockSnapshot = {
        archived_snapshots: {
          closest: {
            available: true,
            url: 'https://web.archive.org/web/20240101000000/https://facebook.com',
            timestamp: '20240101000000',
          },
        },
      };

      const mockContent = `
        <div data-author="fb_user">
          <div data-content="This is a Facebook post">
            Facebook content
          </div>
        </div>
      `;

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockSnapshot })
        .mockResolvedValueOnce({ data: mockContent });

      const content = await waybackService.fetchContent('facebook', 'https://facebook.com');

      expect(content.author).toBe('fb_user');
      expect(content.content).toBe('This is a Facebook post');
    });

    it('should parse Imgur content correctly', async () => {
      const mockSnapshot = {
        archived_snapshots: {
          closest: {
            available: true,
            url: 'https://web.archive.org/web/20240101000000/https://imgur.com',
            timestamp: '20240101000000',
          },
        },
      };

      const mockContent = `
        <div data-author="imgur_user">
          <div data-content="This is an Imgur post">
            Imgur content
          </div>
        </div>
      `;

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockSnapshot })
        .mockResolvedValueOnce({ data: mockContent });

      const content = await waybackService.fetchContent('imgur', 'https://imgur.com');

      expect(content.author).toBe('imgur_user');
      expect(content.content).toBe('This is an Imgur post');
    });

    it('should throw error for unsupported content type', async () => {
      const mockSnapshot = {
        archived_snapshots: {
          closest: {
            available: true,
            url: 'https://web.archive.org/web/20240101000000/https://example.com',
            timestamp: '20240101000000',
          },
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockSnapshot })
        .mockResolvedValueOnce({ data: '' });

      await expect(
        waybackService.fetchContent('unsupported' as any, 'https://example.com')
      ).rejects.toThrow('Unsupported content type: unsupported');
    });
  });
}); 