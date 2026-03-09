/**
 * Chat business logic — extracted from Chat.tsx for maintainability.
 * Messages persisted to Supabase chat_messages table.
 */
import { useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTransactions } from '@/hooks/useTransactions';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useAssets } from '@/hooks/useAssets';
import { useLoans } from '@/hooks/useLoans';
import { useBudgetGoals } from '@/hooks/useBudgetGoals';
import { useLLMSettings } from '@/hooks/useLLMSettings';
import { parseMessageFull, ParsedIntent } from '@/lib/chatParser';
import { callLLM, mapLLMResultToIntent } from '@/lib/llmService';
import { formatCurrency } from '@/lib/currencies';
import { getCategoryInfo } from '@/lib/categories';
import { answerQuery } from '@/lib/queryEngine';
import { ChatMessage, createMessage, HELP_TEXT } from '@/components/ChatComponents';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { analytics } from '@/lib/analytics';
import { toast } from 'sonner';

const CHAT_QUERY_KEY = ['chat_messages'];

function dbRowToMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: row.id as string,
    role: row.role as 'user' | 'assistant',
    content: row.content as string,
    imageUrl: (row.image_url as string | null) ?? undefined,
    parsedIntent: (row.parsed_intent as ParsedIntent | null) ?? undefined,
    confirmed: row.confirmed as boolean | undefined,
    isLoading: (row.is_loading as boolean | null) ?? false,
    timestamp: row.created_at ? new Date(row.created_at as string).getTime() : Date.now(),
  };
}

export function useChatActions() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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

  const { transactions, addTransaction } = useTransactions();
  const { accounts, addAccount, updateAccount } = useBankAccounts();
  const { cards, addCard, updateCard } = useCreditCards();
  const { assets, addAsset } = useAssets();
  const { loans, addLoan } = useLoans();
  const { addGoal } = useBudgetGoals();
  const { settings: llmSettings, isConfigured: isLLMConfigured } = useLLMSettings();

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const financialData = { transactions, accounts, cards, loans, assets };

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

  const resolveLinkedSource = useCallback(
    (sourceName?: string, sourceIsCard?: boolean): { linkedAccountId?: string; linkedCardId?: string } => {
      if (!sourceName) return {};
      const lower = sourceName.toLowerCase();
      if (sourceIsCard) {
        const match = cards.find((c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase()));
        return match ? { linkedCardId: match.id } : {};
      }
      const accountMatch = accounts.find((a) => a.name.toLowerCase().includes(lower) || lower.includes(a.name.toLowerCase()));
      if (accountMatch) return { linkedAccountId: accountMatch.id };
      const cardMatch = cards.find((c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase()));
      if (cardMatch) return { linkedCardId: cardMatch.id };
      return {};
    },
    [accounts, cards],
  );

  const buildResponse = useCallback(
    (parsed: ParsedIntent, imageUrl?: string): { content: string; parsedIntent?: ParsedIntent } => {
      switch (parsed.intent) {
        case 'transaction': {
          const d = parsed.data;
          const cashbackText = d.cashback ? ` with cashback **${formatCurrency(d.cashback, d.currency)}**` : '';
          const sourceText = d.sourceName ? ` from **${d.sourceName}**` : '';
          return {
            content: `I detected a **${d.type}** of **${formatCurrency(d.amount, d.currency)}** in category **${getCategoryInfo(d.category).label}**${sourceText}${cashbackText}. Shall I save this?`,
            parsedIntent: { intent: 'transaction', data: { ...d, receiptUrl: imageUrl } },
          };
        }
        case 'bank_account': {
          const d = parsed.data;
          return {
            content: `I'll add a **${d.type} account** "${d.name}" with balance **${formatCurrency(d.balance, d.currency)}**. Save it?`,
            parsedIntent: parsed,
          };
        }
        case 'credit_card': {
          const d = parsed.data;
          const outstandingText = d.outstanding ? ` and outstanding **${formatCurrency(d.outstanding, d.currency)}**` : '';
          return {
            content: `I'll add **${d.name}** with limit **${formatCurrency(d.limit, d.currency)}**${outstandingText}. Save it?`,
            parsedIntent: parsed,
          };
        }
        case 'asset': {
          const d = parsed.data;
          return {
            content: `I'll add asset **"${d.name}"** (${d.type}) worth **${formatCurrency(d.value, d.currency)}**. Save it?`,
            parsedIntent: parsed,
          };
        }
        case 'loan': {
          const d = parsed.data;
          return {
            content: `I'll add **${d.name}** of **${formatCurrency(d.principal, d.currency)}** at **${d.rate}%** for **${d.tenureMonths} months**. Save it?`,
            parsedIntent: parsed,
          };
        }
        case 'budget': {
          const d = parsed.data;
          return {
            content: `I'll set a monthly budget of **${formatCurrency(d.monthlyLimit, d.currency)}** for **${getCategoryInfo(d.category).label}**. Save it?`,
            parsedIntent: parsed,
          };
        }
        case 'query':
          return { content: answerQuery(parsed.data, financialData) };
        default:
          return { content: HELP_TEXT };
      }
    },
    [financialData],
  );

  const processWithLLM = useCallback(
    async (text: string, loadingMsg: ChatMessage, imageUrl?: string) => {
      try {
        const result = await callLLM(llmSettings.provider, llmSettings.apiKey, llmSettings.model, text);
        const mapped = mapLLMResultToIntent(result);

        if (mapped.intent === 'query') {
          const content = result.message || answerQuery(mapped.data as any, financialData);
          setMessages((prev) =>
            prev.map((m) => m.id === loadingMsg.id ? { ...m, content, isLoading: false, confirmed: false } : m),
          );
          await updatePersistedMessage(loadingMsg.id, { content, isLoading: false, confirmed: false });
          return;
        }

        if (mapped.intent === 'unknown') {
          const content = result.message || HELP_TEXT;
          setMessages((prev) =>
            prev.map((m) => m.id === loadingMsg.id ? { ...m, content, isLoading: false, confirmed: false } : m),
          );
          await updatePersistedMessage(loadingMsg.id, { content, isLoading: false, confirmed: false });
          return;
        }

        const parsedIntent = mapped as ParsedIntent;
        if (parsedIntent.intent === 'transaction' && imageUrl) {
          (parsedIntent.data as any).receiptUrl = imageUrl;
        }

        setMessages((prev) =>
          prev.map((m) => m.id === loadingMsg.id ? { ...m, content: result.message, isLoading: false, parsedIntent, confirmed: undefined } : m),
        );
        await updatePersistedMessage(loadingMsg.id, { content: result.message, isLoading: false, parsedIntent });
      } catch (error) {
        logger.error('LLM call failed', error instanceof Error ? error.message : error);
        const parsed = parseMessageFull(text);
        const { content, parsedIntent } = buildResponse(parsed, imageUrl);
        const isActionable = parsed.intent !== 'query' && parsed.intent !== 'unknown';
        const finalContent = `⚠️ AI unavailable, using smart parser:\n\n${content}`;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMsg.id
              ? { ...m, content: finalContent, isLoading: false, parsedIntent: isActionable ? parsedIntent : undefined, confirmed: isActionable ? undefined : false }
              : m,
          ),
        );
        await updatePersistedMessage(loadingMsg.id, {
          content: finalContent,
          isLoading: false,
          parsedIntent: isActionable ? parsedIntent : undefined,
          confirmed: isActionable ? undefined : false,
        });
        toast.error('AI call failed, used rule-based parser instead');
      } finally {
        setIsProcessing(false);
      }
    },
    [llmSettings, financialData, buildResponse, setMessages, updatePersistedMessage],
  );

  const handleSend = useCallback(
    (imageUrl?: string) => {
      const text = input.trim();
      if (!text && !imageUrl) return;

      logger.info('[Chat] Message sent', { hasText: !!text, hasImage: !!imageUrl, mode: isLLMConfigured ? 'llm' : 'rule' });
      analytics.track('chat_message_sent', { mode: isLLMConfigured ? 'llm' : 'rule', hasImage: !!imageUrl });
      const userMsg = createMessage('user', text || '📷 Receipt uploaded', { imageUrl });

      if (imageUrl && !text) {
        const assistantMsg = createMessage('assistant', '📷 Receipt received! Please describe the transaction (e.g., "spent ₹500 on groceries") so I can save it.');
        setMessages((prev) => [...prev, userMsg, assistantMsg]);
        persistMessage(userMsg);
        persistMessage(assistantMsg);
        setInput('');
        return;
      }

      if (isLLMConfigured) {
        const loadingMsg = createMessage('assistant', 'Thinking...', { isLoading: true });
        setMessages((prev) => [...prev, userMsg, loadingMsg]);
        persistMessage(userMsg);
        persistMessage(loadingMsg);
        setInput('');
        setIsProcessing(true);
        processWithLLM(text, loadingMsg, imageUrl);
        return;
      }

      const parsed = parseMessageFull(text);
      const { content, parsedIntent } = buildResponse(parsed, imageUrl);
      const isActionable = parsed.intent !== 'query' && parsed.intent !== 'unknown';
      const assistantMsg = createMessage('assistant', content, {
        parsedIntent: isActionable ? parsedIntent : undefined,
        confirmed: isActionable ? undefined : false,
      });

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      persistMessage(userMsg);
      persistMessage(assistantMsg);
      setInput('');
    },
    [input, isLLMConfigured, buildResponse, processWithLLM, setMessages, persistMessage],
  );

  const handleConfirm = useCallback(
    (msg: ChatMessage) => {
      const intent = msg.parsedIntent;
      if (!intent) return;

      const successMessages: Record<string, string> = {
        transaction: '✅ Transaction saved!',
        bank_account: '✅ Bank account added!',
        credit_card: '✅ Credit card added!',
        asset: '✅ Asset added!',
        loan: '✅ Loan added!',
        budget: '✅ Budget goal saved!',
      };

      switch (intent.intent) {
        case 'transaction': {
          const { type, amount, currency, category, description, date, receiptUrl, sourceName, sourceIsCard, cashback } = intent.data as any;
          const linkedIds = resolveLinkedSource(sourceName, sourceIsCard);
          addTransaction({ type, amount, currency, category, description, date, receiptUrl, ...linkedIds, ...(cashback && { cashback }) });
          if (linkedIds.linkedAccountId) {
            const delta = type === 'expense' ? -amount : amount;
            const account = accounts.find((a) => a.id === linkedIds.linkedAccountId);
            if (account) updateAccount(account.id, { balance: account.balance + delta });
          }
          if (linkedIds.linkedCardId) {
            const delta = type === 'expense' ? amount : -amount;
            const card = cards.find((c) => c.id === linkedIds.linkedCardId);
            if (card) updateCard(card.id, { outstanding: Math.max(0, card.outstanding + delta) });
          }
          break;
        }
        case 'bank_account': addAccount(intent.data); break;
        case 'credit_card': addCard(intent.data); break;
        case 'asset': addAsset(intent.data); break;
        case 'loan': addLoan(intent.data); break;
        case 'budget': {
          const { category, monthlyLimit, currency } = intent.data;
          addGoal(category, monthlyLimit, currency);
          break;
        }
      }

      const successMsg = successMessages[intent.intent] ?? '✅ Saved!';
      analytics.track('entity_confirmed', { intent: intent.intent });
      setMessages((prev) =>
        prev.map((m) => m.id === msg.id ? { ...m, confirmed: true, content: successMsg } : m),
      );
      updatePersistedMessage(msg.id, { confirmed: true, content: successMsg });
      toast.success(successMsg.replace('✅ ', ''));
    },
    [addTransaction, addAccount, addCard, addAsset, addLoan, addGoal, accounts, cards, updateAccount, updateCard, resolveLinkedSource, setMessages, updatePersistedMessage],
  );

  const handleReject = useCallback(
    (msgId: string) => {
      logger.info('[Chat] Entity rejected');
      analytics.track('entity_rejected');
      setMessages((prev) =>
        prev.map((m) => m.id === msgId ? { ...m, confirmed: false, content: '❌ Discarded.', parsedIntent: undefined } : m),
      );
      updatePersistedMessage(msgId, { confirmed: false, content: '❌ Discarded.', parsedIntent: undefined });
    },
    [setMessages, updatePersistedMessage],
  );

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          toast.error('Please log in to upload images');
          return;
        }

        const ext = file.name.split('.').pop() ?? 'jpg';
        const filePath = `${session.user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(filePath, file, { contentType: file.type });

        if (uploadError) {
          logger.warn('[Chat] Storage upload failed, falling back to base64', uploadError.message);
          // Fallback to base64 if storage bucket doesn't exist yet
          const reader = new FileReader();
          reader.onload = () => handleSend(reader.result as string);
          reader.readAsDataURL(file);
          e.target.value = '';
          return;
        }

        const { data: urlData } = supabase.storage
          .from('chat-images')
          .getPublicUrl(filePath);

        handleSend(urlData.publicUrl);
      } catch (err) {
        logger.error('[Chat] Image upload error', err);
        // Fallback to base64
        const reader = new FileReader();
        reader.onload = () => handleSend(reader.result as string);
        reader.readAsDataURL(file);
      }

      e.target.value = '';
    },
    [handleSend],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const clearMessages = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      toast.error('Not authenticated');
      return;
    }
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', session.user.id);
    if (!error) {
      setMessages([]);
      toast.success('Chat cleared');
    }
  }, [setMessages]);

  return {
    messages, input, setInput, isProcessing, isLLMConfigured,
    bottomRef, fileInputRef,
    handleSend, handleConfirm, handleReject,
    handleImageUpload, handleKeyDown, clearMessages,
  };
}
