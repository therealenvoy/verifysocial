import { OpenAI } from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
// DeepSeek uses OpenAI-compatible API

export type AIModel = "deepseek-v3" | "claude-3-5-sonnet" | "gpt-4o";

export interface AIResponse {
  content: string;
  model: AIModel;
  tokens: {
    input: number;
    output: number;
  };
  costMicros: number; // microdollars (1,000,000 = $1)
}

export class AIModelRouter {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private deepseekApiKey: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
    this.deepseekApiKey = process.env.DEEPSEEK_API_KEY || "";
  }

  async generateResponse(
    prompt: string,
    options: {
      model?: AIModel;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<AIResponse> {
    const model = options.model || "deepseek-v3";
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 500;

    switch (model) {
      case "deepseek-v3":
        return this.callDeepSeek(prompt, temperature, maxTokens);
      case "claude-3-5-sonnet":
        return this.callClaude(prompt, temperature, maxTokens);
      case "gpt-4o":
        return this.callOpenAI(prompt, temperature, maxTokens);
      default:
        throw new Error(`Unsupported model: ${model}`);
    }
  }

  private async callDeepSeek(
    prompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<AIResponse> {
    const response = await this.openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }, {
      baseURL: "https://api.deepseek.com",
      apiKey: this.deepseekApiKey,
    });

    const content = response.choices[0]?.message?.content || "";
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    // DeepSeek pricing: $0.14/1M input, $0.28/1M output tokens (approx)
    const costMicros = Math.floor(
      (inputTokens * 0.14 + outputTokens * 0.28) / 1000
    );

    return {
      content,
      model: "deepseek-v3",
      tokens: { input: inputTokens, output: outputTokens },
      costMicros,
    };
  }

  private async callClaude(
    prompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<AIResponse> {
    const response = await this.anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0]?.text || "";
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;

    // Claude 3.5 Sonnet: $3/1M input, $15/1M output
    const costMicros = Math.floor(
      (inputTokens * 3 + outputTokens * 15) / 1000
    );

    return {
      content,
      model: "claude-3-5-sonnet",
      tokens: { input: inputTokens, output: outputTokens },
      costMicros,
    };
  }

  private async callOpenAI(
    prompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<AIResponse> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content || "";
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    // GPT-4o: $5/1M input, $15/1M output
    const costMicros = Math.floor(
      (inputTokens * 5 + outputTokens * 15) / 1000
    );

    return {
      content,
      model: "gpt-4o",
      tokens: { input: inputTokens, output: outputTokens },
      costMicros,
    };
  }

  // Model selection based on message characteristics
  selectModelForMessage(
    message: string,
    fanValueCents: number, // How much this fan has spent
    conversationLength: number
  ): AIModel {
    // VIP fans get Claude for better relationship building
    if (fanValueCents > 10000) { // $100+
      return "claude-3-5-sonnet";
    }

    // Long conversations might need more coherence
    if (conversationLength > 20) {
      return "claude-3-5-sonnet";
    }

    // Sales/persuasion messages get GPT-4o
    const salesKeywords = ["buy", "purchase", "offer", "deal", "price"];
    if (salesKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      return "gpt-4o";
    }

    // Default to DeepSeek for cost efficiency
    return "deepseek-v3";
  }
}