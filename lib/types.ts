export type Role = "creator" | "user"

export type Creator = {
  id: string
  name: string
  bio: string
  symbol: string
  tokenPrice: number
  bannerUrl: string
  avatarUrl: string
}

export type Content = {
  id: string
  creatorId: string
  title: string
  thumbnailUrl: string
  requiredTokens: number
  description: string
}

export type User = {
  address: string
  role: Role
  displayName?: string
}

export type TokenBalance = {
  address: string
  symbol: string
  amount: number
}

export type Purchase = {
  address: string
  contentId: string
  date: string
  txHash: string
}

export type BookingRequest = {
  id: string
  creatorId: string
  userAddress: string
  date: string
  time: string
  status: "pending" | "accepted" | "declined"
}

export type Tx = {
  id: string
  creatorId: string
  date: string
  type: "sale" | "booking" | "payout"
  amount: number
  symbol: string
  txHash: string
}
