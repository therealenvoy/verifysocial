import { OpenAI } from "openai";
import { Anthropic } from "@anthropic-ai/sdk";

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

export interface ChatMessage {
  role: "fan" | "creator" | "ai_assistant";
  content: string;
}

export interface CompleteOptions {
  history: ChatMessage[];
  systemPrompt?: string;
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
  /**
   * When true, returns a deterministic stub without calling any model.
   * Used in tests and in sandbox mode when API keys are absent.
   */
  sandbox?: boolean;
}

/**
 * Per-model pricing in dollars per million tokens. Source: vendor pricing
 * pages as of 2026-05-18. Verifier-tested via unit test on calculateCost.
 */
export const MODEL_PRICING: Record<AIModel, { inputPerMillion: number; outputPerMillion: number }> = {
  "deepseek-v3": { inputPerMillion: 0.14, outputPerMillion: 0.28 },
  "claude-3-5-sonnet": { inputPerMillion: 3, outputPerMillion: 15 },
  "gpt-4o": { inputPerMillion: 5, outputPerMillion: 15 },
};

/**
 * Cost in microdollars for the given model and token counts.
 * Pure function — exported for unit testing the math directly.
 */
export function calculateCost(model: AIModel, inputTokens: number, outputTokens: number): number {
  const price = MODEL_PRICING[model];
  const dollars = (inputTokens * price.inputPerMillion + outputTokens * price.outputPerMillion) / 1_000_000;
  return Math.round(dollars * 1_000_000);
}

export class AIModelRouter {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private deepseek: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });
    this.deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY || "",
      baseURL: "https://api.deepseek.com",
    });
  }

  /**
   * Conversation-style completion. Picks model via `options.model` or the
   * router heuristic. Returns sandbox stub when keys are absent or `sandbox`
   * is explicitly set — see CompleteOptions.sandbox.
   */
  async complete(options: CompleteOptions): Promise<AIResponse> {
    const model = options.model ?? "deepseek-v3";
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 500;
    const useSandbox = options.sandbox || !this.hasKeyFor(model);

    if (useSandbox) {
      return this.sandboxResponse(options, model);
    }

    const prompt = this.formatPrompt(options);
    switch (model) {
      case "deepseek-v3":
        return this.callDeepSeek(prompt, temperature, maxTokens);
      case "claude-3-5-sonnet":
        return this.callClaude(prompt, temperature, maxTokens);
      case "gpt-4o":
        return this.callOpenAI(prompt, temperature, maxTokens);
      default:
        throw new Error(`Unsupported model: ${String(model)}`);
    }
  }

  /**
   * Single-shot prompt completion. Retained for backward compatibility with
   * any caller that already wraps history into a prompt string itself.
   */
  async generateResponse(
    prompt: string,
    options: { model?: AIModel; temperature?: number; maxTokens?: number } = {},
  ): Promise<AIResponse> {
    const history: ChatMessage[] = [{ role: "fan", content: prompt }];
    return this.complete({ ...options, history });
  }

  private hasKeyFor(model: AIModel): boolean {
    switch (model) {
      case "deepseek-v3":
        return Boolean(process.env.DEEPSEEK_API_KEY);
      case "claude-3-5-sonnet":
        return Boolean(process.env.ANTHROPIC_API_KEY);
      case "gpt-4o":
        return Boolean(process.env.OPENAI_API_KEY);
    }
  }

  private formatPrompt(options: CompleteOptions): string {
    const sys = options.systemPrompt ? `${options.systemPrompt}\n\n` : "";
    const turns = options.history
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
    return `${sys}${turns}\nai_assistant:`;
  }

  private sandboxResponse(options: CompleteOptions, model: AIModel): AIResponse {
    const lastFan = [...options.history].reverse().find((m) => m.role === "fan");
    const inputTokens = options.history.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
    const content = lastFan
      ? `[sandbox reply to ${lastFan.content.slice(0, 40).trim()}]`
      : `[sandbox reply]`;
    const outputTokens = Math.ceil(content.length / 4);
    return {
      content,
      model,
      tokens: { input: inputTokens, output: outputTokens },
      costMicros: 0,
    };
  }

  private async callDeepSeek(
    prompt: string,
    temperature: number,
    maxTokens: number,
  ): Promise<AIResponse> {
    const response = await this.deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content || "";
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    return {
      content,
      model: "deepseek-v3",
      tokens: { input: inputTokens, output: outputTokens },
      costMicros: calculateCost("deepseek-v3", inputTokens, outputTokens),
    };
  }

  private async callClaude(
    prompt: string,
    temperature: number,
    maxTokens: number,
  ): Promise<AIResponse> {
    const response = await this.anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const content = textBlock && "text" in textBlock ? textBlock.text : "";
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;

    return {
      content,
      model: "claude-3-5-sonnet",
      tokens: { input: inputTokens, output: outputTokens },
      costMicros: calculateCost("claude-3-5-sonnet", inputTokens, outputTokens),
    };
  }

  private async callOpenAI(
    prompt: string,
    temperature: number,
    maxTokens: number,
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

    return {
      content,
      model: "gpt-4o",
      tokens: { input: inputTokens, output: outputTokens },
      costMicros: calculateCost("gpt-4o", inputTokens, outputTokens),
    };
  }

  /**
   * Pick a model based on fan value, conversation length, and message intent.
   * VIPs and long conversations get Claude; sales-intent messages get GPT-4o;
   * everything else routes to DeepSeek for cost efficiency.
   */
  selectModelForMessage(
    message: string,
    fanValueCents: number,
    conversationLength: number,
  ): AIModel {
    if (fanValueCents > 10_000) return "claude-3-5-sonnet";
    if (conversationLength > 20) return "claude-3-5-sonnet";
    const salesKeywords = ["buy", "purchase", "offer", "deal", "price"];
    if (salesKeywords.some((keyword) => message.toLowerCase().includes(keyword))) {
      return "gpt-4o";
    }
    return "deepseek-v3";
  }
}

/**
 * Process-singleton router. Re-instantiating per-request would re-construct
 * the OpenAI / Anthropic clients each call; we let the SDKs handle their own
 * connection reuse and just share one router across the action layer.
 */
export const aiRouter = new AIModelRouter();
