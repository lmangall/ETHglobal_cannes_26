"use client";

import { useState, useEffect } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

export default function ChatView() {
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isInWorldApp, setIsInWorldApp] = useState(true);

  useEffect(() => {
    setIsInWorldApp(MiniKit.isInstalled());
  }, []);

  async function handleSend() {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const opts: { message: string; to?: string[] } = { message };
      if (username.trim()) {
        opts.to = [username.trim()];
      }
      await MiniKit.chat(opts);
      setSuccess(true);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open chat");
    } finally {
      setLoading(false);
    }
  }

  if (!isInWorldApp) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-[#1E3A5F]/40 bg-[#0C2340]/60">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <h2 className="font-[system-ui] text-lg font-bold text-white tracking-tight">
          Open in World App
        </h2>
        <p className="mt-2 font-[system-ui] text-sm text-[#64748B] leading-relaxed max-w-[280px]">
          Chat is powered by World App. Open this mini app inside World App to message crew members directly.
        </p>
        <div className="mt-6 rounded-xl border border-[#1E3A5F]/30 bg-[#0C2340]/40 px-5 py-3">
          <p className="font-[system-ui] text-[11px] text-[#475569]">
            World App &rarr; Discover &rarr; Yachtbook
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col px-5 pt-10 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-[system-ui] text-lg font-bold text-white tracking-tight">
          World Chat
        </h1>
        <p className="mt-1 font-[system-ui] text-xs text-[#64748B]">
          Send a message via World App
        </p>
      </div>

      {/* Username field (optional) */}
      <div className="mb-4">
        <label className="mb-1.5 block font-[system-ui] text-[11px] font-medium uppercase tracking-widest text-[#64748B]">
          Recipient (optional)
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="World username"
          className="w-full rounded-xl border border-[#1E3A5F]/40 bg-[#0C2340]/60 px-4 py-3 font-[system-ui] text-sm text-white placeholder-[#475569] outline-none focus:border-[#3B82F6]/50"
        />
        <p className="mt-1 font-[system-ui] text-[11px] text-[#475569]">
          Leave empty to pick a contact
        </p>
      </div>

      {/* Message field */}
      <div className="mb-5">
        <label className="mb-1.5 block font-[system-ui] text-[11px] font-medium uppercase tracking-widest text-[#64748B]">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          rows={4}
          className="w-full resize-none rounded-xl border border-[#1E3A5F]/40 bg-[#0C2340]/60 px-4 py-3 font-[system-ui] text-sm text-white placeholder-[#475569] outline-none focus:border-[#3B82F6]/50"
        />
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={loading || !message.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-4 py-3.5 font-[system-ui] text-sm font-semibold text-[#3B82F6] transition-colors active:bg-[#3B82F6]/20 disabled:opacity-40"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        {loading ? "Opening…" : "Send via World Chat"}
      </button>

      {/* Quick actions */}
      <div className="mt-6">
        <p className="mb-2 font-[system-ui] text-[11px] font-medium uppercase tracking-widest text-[#64748B]">
          Quick Messages
        </p>
        <div className="space-y-2">
          {[
            "Looking for daywork opportunities nearby",
            "Any crew positions available?",
            "Hey from Yachtbook! 👋",
          ].map((msg) => (
            <button
              key={msg}
              onClick={() => setMessage(msg)}
              className="w-full rounded-xl border border-[#1E3A5F]/20 bg-[#0C2340]/30 px-4 py-2.5 text-left font-[system-ui] text-xs text-[#94A3B8] transition-colors active:bg-[#1E3A5F]/30"
            >
              {msg}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {success && (
        <p className="mt-4 text-center font-[system-ui] text-xs text-[#16A34A]">
          Chat opened successfully
        </p>
      )}
      {error && (
        <p className="mt-4 text-center font-[system-ui] text-xs text-[#EF4444]">
          {error}
        </p>
      )}
    </div>
  );
}
