export function isAdminRole(role: { role: string } | null, suspended: boolean): boolean {
  return role?.role === "admin" && !suspended;
}

export function chatTotals(chats: { unread: number; awaitingReply: boolean }[]) {
  return {
    unread: chats.reduce((total, chat) => total + chat.unread, 0),
    waiting: chats.filter((chat) => chat.awaitingReply).length,
  };
}