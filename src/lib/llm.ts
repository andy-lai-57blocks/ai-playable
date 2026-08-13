import OpenAI from "openai";

// ── Multi-provider LLM support ──
// Set LLM_PROVIDER=openrouter to use OpenRouter, default is deepseek

type Provider = "deepseek" | "openrouter";

const provider: Provider = (process.env.LLM_PROVIDER as Provider) || "deepseek";

const clients: Record<Provider, OpenAI> = {
  deepseek: new OpenAI({
    baseURL: "https://api.deepseek.com/v1",
    apiKey: process.env.DEEPSEEK_API_KEY || "",
  }),
  openrouter: new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "",
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002",
      "X-Title": "57Creative Playable Generator",
    },
  }),
};

const defaultModels: Record<Provider, string> = {
  deepseek: "deepseek-v4-pro",
  openrouter: "anthropic/claude-sonnet-4",
};

export async function llmChat(
  system: string,
  user: string,
  opts?: { temperature?: number; maxTokens?: number; model?: string; provider?: Provider }
): Promise<string> {
  const useProvider = opts?.provider || provider;
  const client = clients[useProvider];
  const model = opts?.model || process.env.LLM_MODEL || defaultModels[useProvider];

  const res = await client.chat.completions.create({
    model,
    temperature: opts?.temperature ?? 0.5,
    max_tokens: opts?.maxTokens ?? 4000,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return res.choices[0]?.message?.content || "";
}
