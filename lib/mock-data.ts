import type { BookingRequest, Content, Creator, Purchase, TokenBalance, Tx, User } from "./types"

export const CREATORS: Creator[] = [
  {
    id: "creator-1",
    name: "Ava Nguyen",
    bio: "Filmmaker and storyteller. Behind the scenes and exclusive cuts.",
    symbol: "AVA",
    tokenPrice: 2.75,
    bannerUrl: "https://picsum.photos/seed/ava-banner/1200/400",
    avatarUrl: "https://ui-avatars.com/api/?name=Ava+Nguyen&background=EEE&color=222&size=256",
  },
  {
    id: "creator-2",
    name: "Leo Park",
    bio: "Indie game dev. Prototypes, assets, and devlogs.",
    symbol: "LEO",
    tokenPrice: 1.2,
    bannerUrl: "https://picsum.photos/seed/leo-banner/1200/400",
    avatarUrl: "https://ui-avatars.com/api/?name=Leo+Park&background=EEE&color=222&size=256",
  },
  {
    id: "creator-3",
    name: "Maya Ortiz",
    bio: "Music producer sharing stems and behind-the-track commentary.",
    symbol: "MAYA",
    tokenPrice: 3.4,
    bannerUrl: "https://picsum.photos/seed/maya-banner/1200/400",
    avatarUrl: "https://ui-avatars.com/api/?name=Maya+Ortiz&background=EEE&color=222&size=256",
  },
  {
    id: "creator-4",
    name: "Kai Tanaka",
    bio: "Photographer. RAW files, edits, and shooting guides.",
    symbol: "KAI",
    tokenPrice: 0.95,
    bannerUrl: "https://picsum.photos/seed/kai-banner/1200/400",
    avatarUrl: "https://ui-avatars.com/api/?name=Kai+Tanaka&background=EEE&color=222&size=256",
  },
]

export const CONTENT: Content[] = [
  {
    id: "content-1",
    creatorId: "creator-1",
    title: "Directors Cut: Short Film",
    thumbnailUrl: "https://picsum.photos/seed/ava-content-1/800/500",
    requiredTokens: 25,
    description: "Exclusive directors cut with commentary and BTS footage for the short film.",
  },
  {
    id: "content-2",
    creatorId: "creator-1",
    title: "BTS Photo Pack",
    thumbnailUrl: "https://picsum.photos/seed/ava-content-2/800/500",
    requiredTokens: 10,
    description: "High-res behind the scenes photo pack from recent shoot.",
  },
  {
    id: "content-3",
    creatorId: "creator-2",
    title: "Devlog Vol. 12",
    thumbnailUrl: "https://picsum.photos/seed/leo-content-1/800/500",
    requiredTokens: 8,
    description: "Deep dive into AI behaviors and pathfinding for current prototype.",
  },
  {
    id: "content-4",
    creatorId: "creator-3",
    title: "Track Stems: Midnight Drive",
    thumbnailUrl: "https://picsum.photos/seed/maya-content-1/800/500",
    requiredTokens: 15,
    description: "Full multitrack stems and project notes for 'Midnight Drive' single.",
  },
  {
    id: "content-5",
    creatorId: "creator-4",
    title: "RAW Pack: Urban Night",
    thumbnailUrl: "https://picsum.photos/seed/kai-content-1/800/500",
    requiredTokens: 12,
    description: "20 RAW photos shot at night with notes on settings and post workflow.",
  },
]

export const USERS: User[] = [
  {
    address: "0xCREATOR001234567890abcdefABCDEF0001",
    role: "creator",
    displayName: "Ava Wallet",
  },
  { address: "0xUSER009876543210abcdefABCDEF9999", role: "user", displayName: "Primary Wallet" },
  { address: "0xCREATOR00FEDCBA9876543210ABCDE0002", role: "creator", displayName: "Maya Wallet" },
  { address: "0xUSER00AAAABBBBCCCCDDDDEEEEFFFF0003", role: "user", displayName: "Alt Wallet" },
]

export const BALANCES: TokenBalance[] = [
  { address: "0xUSER009876543210abcdefABCDEF9999", symbol: "AVA", amount: 42 },
  { address: "0xUSER009876543210abcdefABCDEF9999", symbol: "LEO", amount: 15 },
  { address: "0xUSER009876543210abcdefABCDEF9999", symbol: "MAYA", amount: 0 },
  { address: "0xUSER009876543210abcdefABCDEF9999", symbol: "KAI", amount: 5 },
  { address: "0xCREATOR001234567890abcdefABCDEF0001", symbol: "AVA", amount: 10 },
]

export const PURCHASES: Purchase[] = [
  {
    address: "0xUSER009876543210abcdefABCDEF9999",
    contentId: "content-1",
    date: "2025-06-10",
    txHash: "0xabcd1234",
  },
  {
    address: "0xUSER009876543210abcdefABCDEF9999",
    contentId: "content-3",
    date: "2025-07-02",
    txHash: "0x9876efef",
  },
]

export const BOOKING_REQUESTS: BookingRequest[] = [
  {
    id: "booking-1",
    creatorId: "creator-1",
    userAddress: "0xUSER009876543210abcdefABCDEF9999",
    date: "2025-08-15",
    time: "14:00",
    status: "pending",
  },
  {
    id: "booking-2",
    creatorId: "creator-1",
    userAddress: "0xUSER00AAAABBBBCCCCDDDDEEEEFFFF0003",
    date: "2025-08-20",
    time: "10:30",
    status: "pending",
  },
]

export const TRANSACTIONS: Tx[] = [
  {
    id: "tx-1",
    creatorId: "creator-1",
    date: "2025-08-03",
    type: "sale",
    amount: 25,
    symbol: "AVA",
    txHash: "0xaaa111",
  },
  {
    id: "tx-2",
    creatorId: "creator-1",
    date: "2025-08-04",
    type: "booking",
    amount: 50,
    symbol: "AVA",
    txHash: "0xbbb222",
  },
  {
    id: "tx-3",
    creatorId: "creator-1",
    date: "2025-08-05",
    type: "payout",
    amount: -40,
    symbol: "AVA",
    txHash: "0xccc333",
  },
]
