export type Plan = "FREE" | "PRO" | "ULTRA"
export type MessageRole = "USER" | "ASSISTANT" | "SYSTEM"
export type Category =
  | "ANIME"
  | "GAME"
  | "MOVIE"
  | "BOOK"
  | "CELEBRITY"
  | "HISTORICAL"
  | "ASSISTANT"
  | "ROLEPLAY"
  | "OTHER"

export interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
  bio?: string | null
  username?: string | null
  plan: Plan
  credits: number
  isAdmin: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Character {
  id: string
  name: string
  description: string
  personality: string
  backstory?: string | null
  greeting: string
  avatar?: string | null
  banner?: string | null
  voiceId?: string | null
  category: Category
  tags: string[]
  isPublic: boolean
  isNSFW: boolean
  isFeatured: boolean
  interactionCount: number
  creatorId: string
  creator?: User
  createdAt: Date
  updatedAt: Date
  _count?: {
    likes: number
    conversations: number
  }
  isLiked?: boolean
}

export interface Message {
  id: string
  content: string
  role: MessageRole
  audioUrl?: string | null
  createdAt: Date
  conversationId: string
}

export interface Conversation {
  id: string
  title?: string | null
  summary?: string | null
  userId: string
  characterId: string
  character?: Character
  messages?: Message[]
  createdAt: Date
  updatedAt: Date
}
