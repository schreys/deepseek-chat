import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { ChatMessage } from "~/components/ChatMessage";
import type { Message } from "~/types";
import { useLoaderData } from "@remix-run/react";
import { getModels } from "./api.getModels";

export const loader = getModels;

export default function Index() {
  const { models } = useLoaderData<typeof loader>();
  const [selectedModel, setSelectedModel] = useState<string>(models[0] || "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [partialResponse, setPartialResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, partialResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !selectedModel) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setPartialResponse("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      let fullResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        try {
          //bugfix: noticed that in some cases I received multiple messages in a single chunk
          chunk
            .split("\n")
            .filter(Boolean)
            .forEach((chunk) => {
              const parsed = JSON.parse(chunk);
              fullResponse += parsed.message.content;
              setPartialResponse(fullResponse);
            });
        } catch (e) {
          console.error("Error parsing chunk:", e);
          console.log("Chunk:", chunk);
        }
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: fullResponse,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setPartialResponse("");
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gray-800 text-white py-4 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Ollama Chat</h1>
            <div className="flex items-center gap-3">
              <label htmlFor="model" className="text-sm">
                Model:
              </label>
              <select
                id="model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-gray-700 text-white rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={models.length === 0}
              >
                {models.length === 0 ? (
                  <option>No models found</option>
                ) : (
                  models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          {partialResponse && (
            <ChatMessage
              message={{ role: "assistant", content: partialResponse }}
              isStreaming={true}
            />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t bg-white">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                models.length === 0
                  ? "No models available"
                  : "Type your message..."
              }
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500"
              disabled={isLoading || models.length === 0}
            />
            <button
              type="submit"
              disabled={isLoading || models.length === 0 || !input.trim()}
              className={`rounded-lg px-4 py-2 flex items-center justify-center ${
                isLoading || models.length === 0 || !input.trim()
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin text-white" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
