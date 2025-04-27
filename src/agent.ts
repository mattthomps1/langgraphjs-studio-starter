import { ChatOpenAI } from "@langchain/openai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { config } from '../../src/config.js';
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { pull } from "langchain/hub";

/** Initialize once — keep across invocations */
const llm = new ChatOpenAI({ 
  temperature: 0,
  modelName: 'gpt-4-turbo-preview',
  openAIApiKey: config.OPENAI_API_KEY,
});

const tools = [
  new TavilySearchResults({ 
    maxResults: 3,
    apiKey: config.TAVILY_API_KEY,
  })
];

// Create the agent executor
let agentExecutor: AgentExecutor | null = null;

async function initializeAgent() {
  if (agentExecutor) return;

  const prompt = await pull("hwchase17/openai-functions-agent") as any;  // TODO: Fix type
  const agent = await createOpenAIFunctionsAgent({
    llm,
    tools,
    prompt,
  });

  agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: true,
  });
}

/**
 * Thin wrapper used by Fastify.
 * @param prompt   End-user prompt
 * @returns The agent's response as a string
 * @throws Error if the agent fails to process the prompt
 */
export async function runAgent(prompt: string) {
  if (!prompt.trim()) {
    throw new Error('Prompt cannot be empty');
  }

  try {
    await initializeAgent();
    if (!agentExecutor) {
      throw new Error('Agent initialization failed');
    }

    const result = await agentExecutor.invoke({
      input: prompt,
    });

    if (!result.output) {
      throw new Error('Agent returned no response');
    }

    return result.output;
  } catch (error) {
    console.error('Agent error:', error);
    throw error;
  }
}

