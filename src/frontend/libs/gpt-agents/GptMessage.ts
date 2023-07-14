export type ChatRole = 'assistant' | 'user' | 'system';

export interface GptMessage {
  content: string;
  role: ChatRole;
}

export const createGptMessage = (role: ChatRole, message: string) => {
    return {
      role,
      content: message,
    }
}