"use client"

import { useState, useRef, useEffect } from "react"
import { Send, ArrowLeft, Heart, Info, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatNumber } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"
import type { Character, Message } from "@/types"
import { cn } from "@/lib/utils"

interface ChatWindowProps {
  character: Character
  initialMessages: Message[]
}

interface ChatMessage {
  id: string
  content: string
  role: "USER" | "ASSISTANT"
  createdAt: Date
}

export default function ChatWindow({ character, initialMessages }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages as any)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [streamingText, setStreamingText] = useState("")
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(character._count?.likes ?? 0)
  const [likeLoading, setLikeLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const toggleLike = async () => {
    setLikeLoading(true)
    try {
      const res = await fetch(`/api/characters/${character.id}/like`, { method: "POST" })
      const data = await res.json()
      setLiked(data.liked)
      setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1))
      toast.success(data.liked ? "Added to favorites!" : "Removed from favorites")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLikeLoading(false)
    }
  }

  // Show greeting if no messages
  const showGreeting = messages.length === 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingText])

  const sendMessage = async () => {
    const content = input.trim()
    if (!content || loading) return

    setInput("")
    setLoading(true)
    setStreamingText("")

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: "USER",
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          message: content,
          conversationId,
        }),
      })

      if (!res.ok) throw new Error("Failed to get response")

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let aiText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n\n").filter(Boolean)

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = JSON.parse(line.replace("data: ", ""))

          if (data.text) {
            aiText += data.text
            setStreamingText(aiText)
          }

          if (data.done) {
            if (data.conversationId) {
              setConversationId(data.conversationId)
              window.dispatchEvent(new Event("conversation-updated"))
            }

            // Add final AI message
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString() + "_ai",
                content: aiText,
                role: "ASSISTANT",
                createdAt: new Date(),
              },
            ])
            setStreamingText("")
          }
        }
      }
    } catch (error) {
      toast.error("Failed to send message. Please try again.")
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <Link href="/home">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        <Avatar className="h-9 w-9">
          <AvatarImage src={character.avatar ?? ""} alt={character.name} />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
            {character.name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm truncate">{character.name}</h2>
            <Badge variant="outline" className="text-xs shrink-0">{character.category}</Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{character.description}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggleLike}
            disabled={likeLoading}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
              liked
                ? "text-pink-500 bg-pink-500/10"
                : "text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10"
            )}
          >
            <Heart className={cn("h-4 w-4", liked && "fill-pink-500")} />
            {formatNumber(likeCount)}
          </button>
          <Link href={`/character/${character.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Info className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Greeting card */}
          {showGreeting && (
            <div className="flex flex-col items-center text-center py-8 space-y-3">
              <Avatar className="h-20 w-20">
                <AvatarImage src={character.avatar ?? ""} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-3xl">
                  {character.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg">{character.name}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">{character.description}</p>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{formatNumber(character.interactionCount)} chats</span>
                <span>{formatNumber(character._count?.likes ?? 0)} likes</span>
              </div>

              {/* Greeting bubble */}
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-sm text-sm text-left">
                {character.greeting}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "USER" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {msg.role === "ASSISTANT" && (
                <Avatar className="h-8 w-8 shrink-0 mt-1">
                  <AvatarImage src={character.avatar ?? ""} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                    {character.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === "USER"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {streamingText && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0 mt-1">
                <AvatarImage src={character.avatar ?? ""} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                  {character.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm bg-muted">
                <p className="whitespace-pre-wrap leading-relaxed">{streamingText}</p>
                <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse rounded-sm" />
              </div>
            </div>
          )}

          {/* Loading dots */}
          {loading && !streamingText && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                  {character.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm px-4 py-3 shrink-0">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 mb-0.5">
            <Mic className="h-4 w-4" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${character.name}...`}
            className="min-h-[42px] max-h-32 resize-none flex-1"
            rows={1}
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-10 w-10 shrink-0 mb-0.5"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="hidden sm:block text-xs text-muted-foreground text-center mt-1.5">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
