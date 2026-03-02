import { db } from "@/lib/db"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"
import { formatDate } from "@/lib/utils"

async function getConversations() {
  const demoUser = await db.user.findFirst({ where: { email: "demo@persona.ai" } })
  if (!demoUser) return []

  return db.conversation.findMany({
    where: { userId: demoUser.id },
    include: {
      character: {
        select: { id: true, name: true, avatar: true, description: true, category: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  })
}

export default async function ChatsPage() {
  const conversations = await getConversations()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          My Chats
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your recent conversations
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium mb-1">No chats yet</p>
          <p className="text-sm mb-4">Start chatting with a character!</p>
          <Link
            href="/discover"
            className="text-primary text-sm font-medium hover:underline"
          >
            Discover Characters →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const lastMessage = conv.messages[0]
            return (
              <Link key={conv.id} href={`/chat/${conv.character.id}`}>
                <div className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={conv.character.avatar ?? ""} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {conv.character.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm">{conv.character.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {conv.character.category}
                      </Badge>
                    </div>
                    {lastMessage ? (
                      <p className="text-xs text-muted-foreground truncate">
                        {lastMessage.role === "USER" ? "You: " : ""}
                        {lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No messages yet</p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(conv.updatedAt)}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
