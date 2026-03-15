/**
 * Supabase persistence layer for chat messages.
 * Handles fetching, inserting, updating, and clearing messages in the chat_messages table.
 */
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { ChatMessage } from '@/components/ChatComponents';
import type { ParsedIntent } from '@/lib/chatParser';

export const CHAT_QUERY_KEY = ['chat_messages'];

function dbRowToMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: row.id as string,
    role: row.role as 'user' | 'assistant',
    content: row.content as string,
    imageUrl: (row.image_url as string | null) ?? undefined,
    parsedIntent: (row.parsed_intent as ParsedIntent | null) ?? undefined,
    confirmed: row.confirmed as boolean | undefined,
    isLoading: (row.is_loading as boolean | null) ?? false,
    timestamp: (row.created_at as string) ?? new Date().toISOString(),
  };
}

export function useChatMessages() {
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: CHAT_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => dbRowToMessage(row as Record<string, unknown>));
    },
  });

  const persistMessage = useCallback(async (msg: ChatMessage) => {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('chat_messages').insert({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      image_url: msg.imageUrl ?? null,
      parsed_intent: msg.parsedIntent ?? null,
      confirmed: msg.confirmed ?? null,
      is_loading: msg.isLoading ?? false,
      user_id: session?.user?.id,
    });
    if (error) logger.error('[Chat] Failed to persist message', error.message);
  }, []);

  const updatePersistedMessage = useCallback(async (id: string, updates: Partial<ChatMessage>) => {
    const dbUpdates: Record<string, unknown> = {};
    if ('content' in updates) dbUpdates.content = updates.content;
    if ('parsedIntent' in updates) dbUpdates.parsed_intent = updates.parsedIntent ?? null;
    if ('confirmed' in updates) dbUpdates.confirmed = updates.confirmed ?? null;
    if ('isLoading' in updates) dbUpdates.is_loading = updates.isLoading ?? false;

    const { error } = await supabase.from('chat_messages').update(dbUpdates).eq('id', id);
    if (error) logger.error('[Chat] Failed to update message', error.message);
    queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEY });
  }, [queryClient]);

  const setMessages = useCallback((updater: ((prev: ChatMessage[]) => ChatMessage[]) | ChatMessage[]) => {
    queryClient.setQueryData<ChatMessage[]>(CHAT_QUERY_KEY, (prev = []) =>
      typeof updater === 'function' ? updater(prev) : updater
    );
  }, [queryClient]);

  const clearMessages = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return false;
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', session.user.id);
    if (!error) setMessages([]);
    return !error;
  }, [setMessages]);

  return { messages, persistMessage, updatePersistedMessage, setMessages, clearMessages };
}
