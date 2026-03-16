import { useState, useEffect, useCallback, useRef } from 'react';
import { getChatMessages, sendChatMessage, subscribeToChatMessages } from '../social';
import type { ChatMessage } from '../types/social';

interface UseChatResult {
  messages: ChatMessage[];
  loading: boolean;
  send: (text: string) => Promise<void>;
}

export function useChat(channelId: string): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!channelId) return;

    setLoading(true);
    try {
      const results = await getChatMessages(channelId);
      setMessages(results ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  const appendMessage = useCallback((newMessage: ChatMessage) => {
    setMessages((prev) => {
      const alreadyExists = prev.some((m) => m.id === newMessage.id);
      if (alreadyExists) return prev;
      return [...prev, newMessage];
    });
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!channelId) return;

    try {
      const unsubscribe = subscribeToChatMessages(channelId, (message: ChatMessage) => {
        appendMessage(message);
      });
      unsubscribeRef.current = unsubscribe;
    } catch {
      // silently handle subscription errors
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [channelId, appendMessage]);

  const send = useCallback(
    async (text: string): Promise<void> => {
      if (!text.trim() || !channelId) return;

      try {
        await sendChatMessage(channelId, text.trim());
        // new message arrives via realtime subscription
      } catch {
        // silently handle send errors
      }
    },
    [channelId],
  );

  return { messages, loading, send };
}
