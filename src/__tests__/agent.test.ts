import { describe, it, expect, vi, beforeAll } from 'vitest';
import { runAgent } from '../agent.js';

// Mock OpenAI and Tavily since we don't want to make real API calls in tests
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Mocked agent response about AI research in robotics'
            }
          }]
        })
      }
    }
  }))
}));

vi.mock('tavily-ts', () => ({
  TavilyClient: vi.fn().mockImplementation(() => ({
    search: vi.fn().mockResolvedValue({
      results: [{
        title: 'Mock Search Result',
        content: 'Mocked search content about robotics'
      }]
    })
  }))
}));

describe('Agent', () => {
  beforeAll(() => {
    // Set required env vars
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.TAVILY_API_KEY = 'test-key';
  });

  it('should return a response for a valid prompt', async () => {
    const prompt = 'What is the current status of AI research in robotics?';
    const result = await runAgent(prompt);
    
    expect(result).toBeDefined();
    expect(result.content).toContain('robotics');
  });

  it('should throw an error for empty prompt', async () => {
    await expect(runAgent('')).rejects.toThrow('Prompt is required');
  });

  it('should throw an error for null prompt', async () => {
    // @ts-ignore - Testing null case
    await expect(runAgent(null)).rejects.toThrow('Prompt is required');
  });
});
