"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content:
          data.reply || "Entschuldigung, ich konnte keine Antwort generieren.",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          content: "Etwas ist schief gelaufen. Bitte versuche es erneut.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* Floating Chat Window */}
      {isOpen && (
        <Card className="w-[380px] h-[600px] shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 border-border/50 backdrop-blur-sm bg-background/95">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  KI Assistent
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Frag etwas über deine Drucke
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleChat}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="h-full overflow-y-auto p-4 flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground p-4">
                  <Sparkles className="h-12 w-12 mb-4 text-primary/20" />
                  <p className="text-sm">
                    Willkommen! Ich bin dein 3D-Druck-Assistent.
                  </p>
                  <p className="text-xs mt-2">
                    Frag zum Beispiel: &quot;Welche Filamente habe ich?&quot;
                  </p>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-full",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm max-w-[85%]",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted text-foreground rounded-tl-none",
                    )}
                  >
                    {msg.role === "ai" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            code: ({
                              className,
                              children,
                              ...props
                            }: React.HTMLAttributes<HTMLElement>) => {
                              const content = String(children).trim();
                              if (content.startsWith("color:")) {
                                const color = content.replace("color:", "");
                                return (
                                  <span
                                    className="inline-block w-3 h-3 rounded-full border border-border/50 mx-1 align-middle"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                );
                              }
                              return (
                                <code
                                  className={cn(
                                    "bg-muted px-1 py-0.5 rounded text-xs font-mono",
                                    className,
                                  )}
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex w-full justify-start">
                  <div className="rounded-2xl px-4 py-2 bg-muted rounded-tl-none">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </CardContent>
          <CardFooter className="pt-3 border-t bg-muted/20 flex flex-col gap-2">
            <form
              onSubmit={handleSubmit}
              className="flex w-full items-center gap-2"
            >
              <Input
                placeholder="Schreib eine Nachricht..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-background"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <div className="text-[10px] text-muted-foreground/60 text-center w-full">
              Unterstützt von Google Gemini
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Floating Toggle Button */}
      <Button
        onClick={toggleChat}
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-105",
          isOpen
            ? "opacity-0 pointer-events-none scale-0"
            : "opacity-100 scale-100",
        )}
      >
        <MessageCircle className="h-7 w-7" />
      </Button>
    </div>
  );
}
