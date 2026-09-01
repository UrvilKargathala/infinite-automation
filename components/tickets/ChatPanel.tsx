"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { initials } from "@/lib/utils/initials";
import type { ChatMessage } from "@/types";

function chatTime(iso: string): string {
  const secs = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

async function fetchMessages(): Promise<ChatMessage[]> {
  const res = await fetch("/api/chat");
  if (!res.ok) throw new Error("Failed to load messages");
  return res.json();
}

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const myId = useAuthStore((s) => s.user?.id);
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages"],
    queryFn: fetchMessages,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to send");
      return res.json() as Promise<ChatMessage>;
    },
    onSuccess: (msg) => {
      queryClient.setQueryData<ChatMessage[]>(["chat-messages"], (prev = []) => [...prev, msg]);
    },
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
    setText("");
  }

  return (
    <div
      ref={ref}
      className="absolute mt-2 right-0 w-[340px] h-[460px] flex flex-col rounded-2xl bg-white shadow-dropdown z-50"
    >
      <div className="px-4 py-3 border-b border-border text-sm text-text-primary shrink-0">Team chat</div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-text-muted text-sm py-8">No messages yet — say hi</div>
        ) : (
          messages.map((m) => {
            const mine = m.userId === myId;
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                <div className="w-7 h-7 rounded-full bg-brand-blue text-white text-[10px] flex items-center justify-center shrink-0">
                  {initials(m.fullName)}
                </div>
                <div className={`max-w-[220px] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  {!mine && <div className="text-[11px] text-text-muted mb-0.5">{m.fullName}</div>}
                  <div
                    className={`rounded-xl px-3 py-1.5 text-sm ${
                      mine ? "bg-brand-gradient text-white" : "bg-[#F9FAFB] text-text-primary"
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">{chatTime(m.createdAt)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-2 border-t border-border flex items-center gap-2 shrink-0">
        <input
          className="flex-1 bg-white border border-border rounded-lg py-2 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors"
          placeholder="Message the team..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white shrink-0 disabled:opacity-40"
          aria-label="Send"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
