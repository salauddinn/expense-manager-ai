/**
 * Chat business logic — orchestrates message flow, LLM calls, and entity confirmation.
 * Message persistence is delegated to useChatMessages.
 */
import { useState, useRef, useCallback } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useAssets } from '@/hooks/useAssets';
import { useLoans } from '@/hooks/useLoans';
import { useBudgetGoals } from '@/hooks/useBudgetGoals';
import { useLLMSettings } from '@/hooks/useLLMSettings';
import { useChatMessages } from '@/hooks/useChatMessages';
import { parseMessageFull, ParsedIntent } from '@/lib/chatParser';
import { callLLM, mapLLMResultToIntent } from '@/lib/llmService';
import { answerQuery } from '@/lib/queryEngine';
import { buildIntentResponse } from '@/lib/chatFormatter';
import { ChatMessage, createMessage, HELP_TEXT } from '@/components/ChatComponents';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { analytics } from '@/lib/analytics';
import {
  CHAT_LOADING_PLACEHOLDER,
  CHAT_RECEIPT_UPLOAD_MESSAGE,
  CHAT_IMAGE_ONLY_LABEL,
} from '@/lib/constants';
import { toast } from 'sonner';

export function useChatActions() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { messages, persistMessage, updatePersistedMessage, setMessages, clearMessages: clearPersistedMessages } = useChatMessages();

  const { transactions, addTransaction } = useTransactions();
  const { accounts, addAccount, updateAccount } = useBankAccounts();
  const { cards, addCard, updateCard } = useCreditCards();
  const { assets, addAsset } = useAssets();
  const { loans, addLoan } = useLoans();
  const { addGoal } = useBudgetGoals();
  const { settings: llmSettings, isConfigured: isLLMConfigured } = useLLMSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const financialData = { transactions, accounts, cards, loans, assets };

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

  const resolveLoadingMessage = useCallback(
    async (
      loadingId: string,
      content: string,
      opts?: { parsedIntent?: ParsedIntent; confirmed?: boolean },
    ) => {
      const update = { content, isLoading: false, ...opts };
      setMessages((prev) =>
        prev.map((m) => m.id === loadingId ? { ...m, ...update } : m),
      );
      await updatePersistedMessage(loadingId, update);
    },
    [setMessages, updatePersistedMessage],
  );

  const processWithLLM = useCallback(
    async (text: string, loadingMsg: ChatMessage, imageUrl?: string) => {
      try {
        const result = await callLLM(llmSettings.provider, llmSettings.apiKey, llmSettings.model, text);
        const mapped = mapLLMResultToIntent(result);

        if (mapped.intent === 'query') {
          const content = result.message || answerQuery(mapped.data, financialData);
          await resolveLoadingMessage(loadingMsg.id, content, { confirmed: false });
          return;
        }

        if (mapped.intent === 'unknown') {
          const content = result.message || HELP_TEXT;
          await resolveLoadingMessage(loadingMsg.id, content, { confirmed: false });
          return;
        }

        const parsedIntent = mapped as ParsedIntent;
        if (parsedIntent.intent === 'transaction' && imageUrl) {
          parsedIntent.data.receiptUrl = imageUrl;
        }

        await resolveLoadingMessage(loadingMsg.id, result.message, { parsedIntent });
      } catch (error) {
        logger.error('LLM call failed', error instanceof Error ? error.message : error);
        const parsed = parseMessageFull(text);
        const { content, parsedIntent } = buildIntentResponse(parsed, financialData, imageUrl);
        const isActionable = parsed.intent !== 'query' && parsed.intent !== 'unknown';
        const finalContent = `⚠️ AI unavailable, using smart parser:\n\n${content}`;

        await resolveLoadingMessage(loadingMsg.id, finalContent, {
          parsedIntent: isActionable ? parsedIntent : undefined,
          confirmed: isActionable ? undefined : false,
        });
        toast.error('AI call failed, used rule-based parser instead');
      } finally {
        setIsProcessing(false);
      }
    },
    [llmSettings, financialData, resolveLoadingMessage],
  );

  const handleSend = useCallback(
    (imageUrl?: string) => {
      const text = input.trim();
      if (!text && !imageUrl) return;

      logger.info('[Chat] Message sent', { hasText: !!text, hasImage: !!imageUrl, mode: isLLMConfigured ? 'llm' : 'rule' });
      analytics.track('chat_message_sent', { mode: isLLMConfigured ? 'llm' : 'rule', hasImage: !!imageUrl });
      const userMsg = createMessage('user', text || CHAT_IMAGE_ONLY_LABEL, { imageUrl });

      if (imageUrl && !text) {
        const assistantMsg = createMessage('assistant', CHAT_RECEIPT_UPLOAD_MESSAGE);
        setMessages((prev) => [...prev, userMsg, assistantMsg]);
        persistMessage(userMsg);
        persistMessage(assistantMsg);
        setInput('');
        return;
      }

      if (isLLMConfigured) {
        const loadingMsg = createMessage('assistant', CHAT_LOADING_PLACEHOLDER, { isLoading: true });
        setMessages((prev) => [...prev, userMsg, loadingMsg]);
        persistMessage(userMsg);
        persistMessage(loadingMsg);
        setInput('');
        setIsProcessing(true);
        processWithLLM(text, loadingMsg, imageUrl);
        return;
      }

      const parsed = parseMessageFull(text);
      const { content, parsedIntent } = buildIntentResponse(parsed, financialData, imageUrl);
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
    [input, isLLMConfigured, processWithLLM, setMessages, persistMessage, financialData],
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
          const { type, amount, currency, category, description, date, receiptUrl, sourceName, sourceIsCard, cashback } = intent.data;
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
    const success = await clearPersistedMessages();
    if (success) {
      toast.success('Chat cleared');
    } else {
      toast.error('Not authenticated');
    }
  }, [clearPersistedMessages]);

  return {
    messages, input, setInput, isProcessing, isLLMConfigured,
    fileInputRef,
    handleSend, handleConfirm, handleReject,
    handleImageUpload, handleKeyDown, clearMessages,
  };
}
