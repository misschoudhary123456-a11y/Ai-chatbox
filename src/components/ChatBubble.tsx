import { Message } from "../types";
import ReactMarkdown from 'react-markdown';
import { Check, CheckCheck, Copy, Trash2, Download, FileText, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatBubbleProps {
  message: Message;
  onDelete: (id: string) => void;
  onQuizAnswer?: (messageId: string, index: number) => void;
  zoyaAvatar?: string;
  userAvatar?: string;
}

export default function ChatBubble({ message, onDelete, onQuizAnswer, zoyaAvatar, userAvatar }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
  };

  const speak = () => {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = 'en-IN'; // Indian English accent
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full mb-3 gap-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && zoyaAvatar && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-auto mb-1 border border-gray-200 dark:border-gray-800">
          <img src={zoyaAvatar} alt="Zoya" className="w-full h-full object-cover" />
        </div>
      )}
      <div className={cn(
        isUser ? "chat-bubble-right" : "chat-bubble-left",
        "group"
      )}>
        {/* Actions Overlay */}
        <div className={cn(
          "absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-inherit p-0.5 rounded shadow-sm z-10",
        )}>
          {!isUser && (
            <button onClick={speak} className="p-1 hover:bg-black/5 rounded group/btn" title="Listen to Zoya">
              <Volume2 size={12} className="text-whatsapp-teal" />
            </button>
          )}
          <button onClick={copyToClipboard} className="p-1 hover:bg-black/5 rounded group/btn relative">
            <Copy size={12} className="text-gray-500" />
          </button>
          <button onClick={() => onDelete(message.id)} className="p-1 hover:bg-red-500/10 rounded">
            <Trash2 size={12} className="text-red-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2">
          {message.imageUrl && message.type === 'image' && (
            <div className="relative rounded overflow-hidden mt-1">
              <img src={message.imageUrl} alt="Uploaded" className="max-w-full h-auto object-cover rounded shadow-sm" referrerPolicy="no-referrer" />
            </div>
          )}

          {message.type === 'video' && (
            <div className="relative rounded-xl overflow-hidden mt-1 bg-black/5 dark:bg-black/20 p-1 border dark:border-gray-800">
              {message.videoProcessing ? (
                <div className="aspect-video w-full flex flex-col items-center justify-center p-8 text-center gap-3">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-8 h-8 border-4 border-whatsapp-teal border-t-transparent rounded-full"
                  />
                  <p className="text-xs font-bold text-gray-500 animate-pulse">{message.content}</p>
                </div>
              ) : (
                <video 
                  src={message.videoUrl} 
                  controls 
                  className="max-w-full rounded-lg shadow-lg aspect-video h-auto w-full object-cover"
                />
              )}
            </div>
          )}

          {message.type === 'file' && (
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 mt-1">
              <div className="w-12 h-12 flex items-center justify-center bg-red-500 text-white rounded-lg shadow-sm">
                <FileText size={28} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate dark:text-red-100">{message.fileName}</p>
                <p className="text-[10px] uppercase font-bold text-red-400">PDF Document</p>
              </div>
              <a href={message.imageUrl} download={message.fileName} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <Download size={18} className="text-red-500" />
              </a>
            </div>
          )}

          <div className="text-[15px] leading-relaxed break-words whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none prose-p:my-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {/* Quiz UI */}
          {message.type === 'quiz' && message.quizOptions && (
            <div className="flex flex-col gap-2 mt-2">
              {message.quizOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => onQuizAnswer?.(message.id, idx)}
                  disabled={message.selectedIndex !== undefined}
                  className={cn(
                    "px-4 py-2 text-sm text-left rounded-lg border transition-all",
                    message.selectedIndex === undefined 
                      ? "border-gray-200 dark:border-gray-700 hover:bg-black/5 dark:hover:bg-white/5"
                      : idx === message.correctIndex
                        ? "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300"
                        : idx === message.selectedIndex
                          ? "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300"
                          : "border-gray-100 dark:border-gray-800 opacity-50"
                  )}
                >
                  <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {option}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end items-center gap-1 mt-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{time}</span>
            {isUser && (
              <span className="text-[#34b7f1]">
                <CheckCheck size={14} />
              </span>
            )}
          </div>
        </div>
      </div>
      {isUser && userAvatar && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-auto mb-1 border border-[#075E54] dark:border-[#222d34]">
          <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
        </div>
      )}
    </motion.div>
  );
}
