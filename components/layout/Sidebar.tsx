"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Home,
  Compass,
  PlusCircle,
  MessageSquare,
  User,
  Sparkles,
  Settings,
  Crown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/character/create", label: "Create", icon: PlusCircle },
  { href: "/chats", label: "My Chats", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
]

interface RecentChat {
  id: string
  character: {
    id: string
    name: string
    avatar: string | null
  }
  messages: { content: string }[]
}

export default function Sidebar() {
  const pathname = usePathname()
  const [recentChats, setRecentChats] = useState<RecentChat[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChats = () => {
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        setRecentChats(Array.isArray(data) ? data.slice(0, 5) : [])
      })
      .catch(() => setRecentChats([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchChats()
  }, [pathname]) // refetch when route changes

  useEffect(() => {
    window.addEventListener("conversation-updated", fetchChats)
    return () => window.removeEventListener("conversation-updated", fetchChats)
  }, [])

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card hidden md:flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <Sparkles className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold tracking-tight">Persona</span>
        <Badge variant="secondary" className="ml-auto text-xs">Beta</Badge>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Recent Chats */}
        <div className="mt-6">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Recent Chats
          </p>

          <div className="space-y-1">
            {loading ? (
              // Skeleton loading
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2">
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-32" />
                  </div>
                </div>
              ))
            ) : recentChats.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No recent chats yet
              </p>
            ) : (
              recentChats.map((chat) => {
                const isActive = pathname === `/chat/${chat.character.id}`
                const lastMsg = chat.messages[0]?.content ?? ""
                return (
                  <Link key={chat.id} href={`/chat/${chat.character.id}`}>
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                      )}
                    >
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={chat.character.avatar ?? ""} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {chat.character.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {chat.character.name}
                        </p>
                        {lastMsg && (
                          <p className="text-xs text-muted-foreground truncate">
                            {lastMsg.slice(0, 28)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Bottom Section */}
      <div className="border-t border-border p-3 space-y-2">
        {/* Upgrade Banner */}
        <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-semibold">Upgrade to Pro</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Unlimited chats & voice</p>
          <Button size="sm" className="w-full h-7 text-xs">
            Upgrade Now
          </Button>
        </div>

        {/* Settings */}
        <Link href="/settings">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all">
            <Settings className="h-4 w-4" />
            Settings
          </div>
        </Link>
      </div>
    </aside>
  )
}
