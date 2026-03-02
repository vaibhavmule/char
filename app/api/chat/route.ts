import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { buildSystemPrompt, generateChatResponse } from "@/lib/ai"
import type { AIProvider } from "@/lib/ai"

export async function POST(req: NextRequest) {
  try {
    const { characterId, message, conversationId } = await req.json()

    if (!characterId || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get character
    const character = await db.character.findUnique({
      where: { id: characterId },
    })

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 })
    }

    // Get or create demo user
    let demoUser = await db.user.findFirst({ where: { email: "demo@persona.ai" } })
    if (!demoUser) {
      demoUser = await db.user.create({
        data: { name: "Demo User", email: "demo@persona.ai", username: "demo_user" },
      })
    }

    // Get or create conversation
    let conversation
    if (conversationId) {
      conversation = await db.conversation.findUnique({ where: { id: conversationId } })
    }

    if (!conversation) {
      conversation = await db.conversation.upsert({
        where: { userId_characterId: { userId: demoUser.id, characterId } },
        update: {},
        create: {
          userId: demoUser.id,
          characterId,
          title: `Chat with ${character.name}`,
        },
      })
    }

    // Get last 20 messages for context
    const previousMessages = await db.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    })

    // Save user message
    await db.message.create({
      data: {
        content: message,
        role: "USER",
        conversationId: conversation.id,
        userId: demoUser.id,
      },
    })

    // Build messages for OpenAI
    const chatMessages = [
      ...previousMessages.map((m) => ({
        role: m.role === "USER" ? "user" : "assistant" as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ]

    // Build system prompt
    const systemPrompt = buildSystemPrompt(character)

    // Use provider from env (openai or anthropic)
    const provider = (process.env.AI_PROVIDER ?? "openai") as AIProvider

    // Call AI via helper — easy to switch provider
    const stream = await generateChatResponse({
      messages: chatMessages,
      systemPrompt,
      provider,
    })

    // Collect full response for saving to DB
    let fullResponse = ""

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream as any) {
          // OpenAI chunk format
          const text = chunk.choices?.[0]?.delta?.content
            // Anthropic chunk format
            ?? (chunk.type === "content_block_delta" ? chunk.delta?.text : null)
            ?? ""
          if (text) {
            fullResponse += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        // Save assistant message to DB
        await db.message.create({
          data: {
            content: fullResponse,
            role: "ASSISTANT",
            conversationId: conversation!.id,
          },
        })

        // Increment interaction count
        await db.character.update({
          where: { id: characterId },
          data: { interactionCount: { increment: 1 } },
        })

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: conversation!.id })}\n\n`)
        )
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error: any) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Chat failed" }, { status: 500 })
  }
}
