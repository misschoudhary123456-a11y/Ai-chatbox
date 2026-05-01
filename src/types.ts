/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
  type?: 'text' | 'image' | 'file' | 'quiz' | 'video';
  fileName?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoProcessing?: boolean;
  quizOptions?: string[];
  correctIndex?: number;
  selectedIndex?: number;
}

export type ChatMode = 'normal' | 'study' | 'exam' | 'pencil' | 'guide';

export interface User {
  username: string;
  isLoggedIn: boolean;
  avatar?: string;
}

export interface AppState {
  messages: Message[];
  mode: ChatMode;
  isTyping: boolean;
  user: User | null;
  apiKey: string;
  isDarkMode: boolean;
  zoyaAvatar: string;
  notificationSound: boolean;
}
