import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().min(10).max(500),
  personality: z.string().min(10).max(1000),
  backstory: z.string().max(2000).optional(),
  greeting: z.string().min(5).max(500),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  avatar: z.string().nullable().optional(),
  isPublic: z.boolean().default(true),
  isNSFW: z.boolean().default(false),
})

// GET all public characters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")
    const category = searchParams.get("category")
    const limit = parseInt(searchParams.get("limit") ?? "20")
    const page = parseInt(searchParams.get("page") ?? "1")
    const skip = (page - 1) * limit

    const characters = await db.character.findMany({
      where: {
        isPublic: true,
        ...(q && {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }),
        ...(category && { category: category as any }),
      },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { likes: true, conversations: true } },
      },
      orderBy: { interactionCount: "desc" },
      take: limit,
      skip,
    })

    return NextResponse.json(characters)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch characters" }, { status: 500 })
  }
}

// POST create character
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    // TODO: Replace with real user session when auth is added
    // For now use a demo user or create one
    let demoUser = await db.user.findFirst({ where: { email: "demo@persona.ai" } })

    if (!demoUser) {
      demoUser = await db.user.create({
        data: {
          name: "Demo User",
          email: "demo@persona.ai",
          username: "demo_user",
        },
      })
    }

    const character = await db.character.create({
      data: {
        ...data,
        backstory: data.backstory ?? null,
        avatar: data.avatar ?? null,
        creatorId: demoUser.id,
        category: data.category as any,
      },
    })

    return NextResponse.json(character, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create character" }, { status: 500 })
  }
}
