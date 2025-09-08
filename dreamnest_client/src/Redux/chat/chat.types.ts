export type Message = {
  id: number
  content: string
  createdAt: string
  senderId: number
  chatRoomId: number
}

export type ParticipantUser = {
  id: number
  userName: string
  profilePicture?: string | null
}

export type ChatParticipant = {
  id: number
  userId: number
  chatRoomId: number
  user: ParticipantUser
}

export type ChatRoom = {
  id: number
  name?: string | null
  messages?: Message[]
  participants?: ChatParticipant[]
}
