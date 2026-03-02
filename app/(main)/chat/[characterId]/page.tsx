import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import ChatWindow from "@/components/chat/ChatWindow"

interface ChatPageProps {
  params: Promise<{ characterId: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { characterId } = await params

  const character = await db.character.findUnique({
    where: { id: characterId },
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
      _count: { select: { likes: true, conversations: true } },
    },
  })

  if (!character) notFound()

  // Get existing conversation messages
  const demoUser = await db.user.findFirst({ where: { email: "demo@persona.ai" } })

  let messages: any[] = []
  if (demoUser) {
    const conversation = await db.conversation.findUnique({
      where: { userId_characterId: { userId: demoUser.id, characterId } },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    })
    messages = conversation?.messages ?? []
  }

  return (
    <ChatWindow
      character={character as any}
      initialMessages={messages}
    />
  )
}
