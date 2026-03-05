"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Compass, PlusCircle, MessageSquare, User } from "lucide-react"

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/character/create", label: "Create", icon: PlusCircle },
  { href: "/chats", label: "Chats", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
]

export default function MobileNav() {
  const pathname = usePathname()

  // Hide during chat — chat is full-screen
  if (pathname.startsWith("/chat/")) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 rounded-lg transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
