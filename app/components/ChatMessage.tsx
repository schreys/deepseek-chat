import { MessageCircle, Bot, Loader2 } from "lucide-react";
import { Message } from "../types";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({
  message,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      } max-w-[85%] mx-auto`}
    >
      <div
        className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} ${
          !isUser && "w-full"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser ? "bg-blue-500" : "bg-gray-600"
          }`}
        >
          {isUser ? (
            <MessageCircle size={18} className="text-white" />
          ) : isStreaming ? (
            <Loader2 size={18} className="text-white animate-spin" />
          ) : (
            <Bot size={18} className="text-white" />
          )}
        </div>
        <div
          className={`${
            isUser
              ? "bg-blue-500 text-white"
              : "bg-white border border-gray-200 text-gray-900"
          } rounded-lg px-4 py-2 shadow-sm ${!isUser && "flex-1"}`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
