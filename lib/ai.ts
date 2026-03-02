import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"

// OpenAI Client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Anthropic Client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// AI Provider type
export type AIProvider = "openai" | "anthropic"

// Build character system prompt
export function buildSystemPrompt(character: {
  name: string
  personality: string
  backstory?: string | null
  description: string
}): string {
  return `You are ${character.name}. ${character.description}

Personality: ${character.personality}
${character.backstory ? `Backstory: ${character.backstory}` : ""}

Important rules:
- Always stay in character as ${character.name}
- Never break character or mention you are an AI
- Respond naturally based on your personality
- Keep responses engaging and conversational
- Match the tone and style of ${character.name}`
}

// Generate AI response (OpenAI streaming)
export async function generateChatResponse({
  messages,
  systemPrompt,
  provider = "openai",
}: {
  messages: { role: "user" | "assistant"; content: string }[]
  systemPrompt: string
  provider?: AIProvider
}) {
  if (provider === "anthropic") {
    return anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })
  }

  // Default: OpenAI
  return openai.chat.completions.create({
    model: "gpt-4o",
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    max_tokens: 1024,
  })
}
