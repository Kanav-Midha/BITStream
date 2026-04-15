"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send } from "lucide-react";

export function ChatWidget() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <Card className="w-80 h-96 flex flex-col shadow-xl border bg-background">
          <div className="p-3 border-b flex justify-between items-center bg-primary text-primary-foreground">
            <span className="font-medium text-sm">BITStream Support</span>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <span className={`inline-block p-2 rounded-lg ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {m.content}
                </span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="p-2 border-t flex gap-2">
            <Input value={input} onChange={handleInputChange} placeholder="Ask..." className="h-8 text-xs" />
            <Button type="submit" size="sm" disabled={isLoading}>
              <Send className="h-3 w-3" />
            </Button>
          </form>
        </Card>
      ) : (
        <Button onClick={() => setIsOpen(true)} className="rounded-full h-12 w-12 shadow-lg">
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
