/**
 * Chat Page — Smart financial assistant.
 *
 * Uses LLM (OpenAI/Gemini) when API key is configured,
 * falls back to rule-based parser otherwise.
 */


import { useState, useRef, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTransactions } from '@/hooks/useTransactions';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useAssets } from '@/hooks/useAssets';
import { useLoans } from '@/hooks/useLoans';
import { useBudgetGoals } from '@/hooks/useBudgetGoals';
import { useLLMSettings } from '@/hooks/useLLMSettings';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { parseMessageFull, ParsedIntent } from '@/lib/chatParser';
import { callLLM, mapLLMResultToIntent } from '@/lib/llmService';
import { formatCurrency } from '@/lib/currencies';
import { getCategoryInfo } from '@/lib/categories';
import { answerQuery } from '@/lib/queryEngine';
import {
  ChatMessage, createMessage, needsConfirmation,
  HELP_TEXT, EmptyState, MessageBubble,
} from '@/components/ChatComponents';
import { Send, ImagePlus, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { logger } from '@/lib/logger';
import { analytics } from '@/lib/analytics';
import { toast } from 'sonner';

export default function Chat() {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('finance_chat_messages', []);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Data hooks
  const { transactions, addTransaction } = useTransactions();
  const { accounts, addAccount, updateAccount } = useBankAccounts();
  const { cards, addCard, updateCard } = useCreditCards();
  const { assets, addAsset } = useAssets();
  const { loans, addLoan } = useLoans();
  const { addGoal } = useBudgetGoals();
  const { settings: llmSettings, isConfigured: isLLMConfigured } = useLLMSettings();

  // Refs
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Helpers ──

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

  // ── Build response from parsed intent (rule-based) ──

  const buildResponse = useCallback(
    (parsed: ParsedIntent, imageUrl?: string): { content: string; parsedIntent?: ParsedIntent } => {
      switch (parsed.intent) {
        case 'transaction': {
          const d = parsed.data;
          const sourceText = d.sourceName ? ` from **${d.sourceName}**` : '';
          return {
            content: `I detected a **${d.type}** of **${formatCurrency(d.amount, d.currency)}** in category **${getCategoryInfo(d.category).label}**${sourceText}. Shall I save this?`,
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
          const outstandingText = d.outstanding
            ? ` and outstanding **${formatCurrency(d.outstanding, d.currency)}**`
            : '';
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

  // ── Process with LLM ──

  const processWithLLM = useCallback(
    async (text: string, loadingMsgId: string, imageUrl?: string) => {
      try {
        const result = await callLLM(llmSettings.provider, llmSettings.apiKey, llmSettings.model, text);
        const mapped = mapLLMResultToIntent(result);

        if (mapped.intent === 'query') {
          const content = result.message || answerQuery(mapped.data as any, financialData);
          setMessages((prev) =>
            prev.map((m) => m.id === loadingMsgId ? { ...m, content, isLoading: false, confirmed: false } : m),
          );
          return;
        }

        if (mapped.intent === 'unknown') {
          setMessages((prev) =>
            prev.map((m) => m.id === loadingMsgId ? { ...m, content: result.message || HELP_TEXT, isLoading: false, confirmed: false } : m),
          );
          return;
        }

        const parsedIntent = mapped as ParsedIntent;
        if (parsedIntent.intent === 'transaction' && imageUrl) {
          (parsedIntent.data as any).receiptUrl = imageUrl;
        }

        setMessages((prev) =>
          prev.map((m) => m.id === loadingMsgId ? { ...m, content: result.message, isLoading: false, parsedIntent, confirmed: undefined } : m),
        );
      } catch (error) {
        logger.error('LLM call failed', error instanceof Error ? error.message : error);

        // Fallback to rule-based parser
        const parsed = parseMessageFull(text);
        const { content, parsedIntent } = buildResponse(parsed, imageUrl);
        const isActionable = parsed.intent !== 'query' && parsed.intent !== 'unknown';

        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMsgId
              ? {
                  ...m,
                  content: `⚠️ AI unavailable, using smart parser:\n\n${content}`,
                  isLoading: false,
                  parsedIntent: isActionable ? parsedIntent : undefined,
                  confirmed: isActionable ? undefined : false,
                }
              : m,
          ),
        );
        toast.error('AI call failed, used rule-based parser instead');
      } finally {
        setIsProcessing(false);
      }
    },
    [llmSettings, financialData, buildResponse, setMessages],
  );

  // ── Send message ──

  const handleSend = useCallback(
    (imageUrl?: string) => {
      const text = input.trim();
      if (!text && !imageUrl) return;

      logger.info('[Chat] Message sent', { hasText: !!text, hasImage: !!imageUrl, mode: isLLMConfigured ? 'llm' : 'rule' });
      analytics.track('chat_message_sent', { mode: isLLMConfigured ? 'llm' : 'rule', hasImage: !!imageUrl });
      const userMsg = createMessage('user', text || '📷 Receipt uploaded', { imageUrl });

      if (imageUrl && !text) {
        const assistantMsg = createMessage(
          'assistant',
          '📷 Receipt received! Please describe the transaction (e.g., "spent ₹500 on groceries") so I can save it.',
        );
        setMessages((prev) => [...prev, userMsg, assistantMsg]);
        setInput('');
        return;
      }

      if (isLLMConfigured) {
        const loadingMsg = createMessage('assistant', 'Thinking...', { isLoading: true });
        setMessages((prev) => [...prev, userMsg, loadingMsg]);
        setInput('');
        setIsProcessing(true);
        processWithLLM(text, loadingMsg.id, imageUrl);
        return;
      }

      // Rule-based path
      const parsed = parseMessageFull(text);
      const { content, parsedIntent } = buildResponse(parsed, imageUrl);
      const isActionable = parsed.intent !== 'query' && parsed.intent !== 'unknown';

      const assistantMsg = createMessage('assistant', content, {
        parsedIntent: isActionable ? parsedIntent : undefined,
        confirmed: isActionable ? undefined : false,
      });

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput('');
    },
    [input, isLLMConfigured, buildResponse, processWithLLM, setMessages],
  );

  // ── Confirm / Reject ──

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
          const { type, amount, currency, category, description, date, receiptUrl, sourceName, sourceIsCard } = intent.data as any;
          const linkedIds = resolveLinkedSource(sourceName, sourceIsCard);
          addTransaction({ type, amount, currency, category, description, date, receiptUrl, ...linkedIds });

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
        case 'bank_account':
          addAccount(intent.data);
          break;
        case 'credit_card':
          addCard(intent.data);
          break;
        case 'asset':
          addAsset(intent.data);
          break;
        case 'loan':
          addLoan(intent.data);
          break;
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
      toast.success(successMsg.replace('✅ ', ''));
    },
    [addTransaction, addAccount, addCard, addAsset, addLoan, addGoal, accounts, cards, updateAccount, updateCard, resolveLinkedSource, setMessages],
  );

  const handleReject = useCallback(
    (msgId: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, confirmed: false, content: '❌ Discarded.', parsedIntent: undefined } : m,
        ),
      );
    },
    [setMessages],
  );

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => handleSend(reader.result as string);
      reader.readAsDataURL(file);
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

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Chat</h1>
          {isLLMConfigured && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
              <Sparkles className="h-3 w-3" /> AI
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setMessages([]); toast.success('Chat cleared'); }}
            className="text-muted-foreground hover:text-destructive gap-1.5 rounded-full text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mb-4">
        {isLLMConfigured
          ? 'AI-powered — understands complex sentences naturally.'
          : 'Add your API key in settings to enable AI mode.'}
      </p>

      {/* Message list */}
      <div className="space-y-3 mb-4 max-h-[calc(100vh-320px)] overflow-y-auto">
        <EmptyState visible={messages.length === 0} />

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            showActions={needsConfirmation(msg)}
            onConfirm={() => handleConfirm(msg)}
            onReject={() => handleReject(msg.id)}
          />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Input bar */}
      <div className="fixed bottom-14 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/40 px-5 py-3">
        <div className="mx-auto max-w-2xl flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-xl h-11 w-11"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload receipt"
            disabled={isProcessing}
          >
            <ImagePlus className="h-4 w-4" />
          </Button>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLLMConfigured ? 'Ask anything about your finances...' : 'Try: spent ₹500 on groceries...'}
            className="flex-1 rounded-full px-5 h-11 bg-muted/50"
            disabled={isProcessing}
          />

          <Button
            onClick={() => handleSend()}
            size="icon"
            disabled={!input.trim() || isProcessing}
            aria-label="Send message"
            className="rounded-full h-11 w-11 shadow-md shadow-primary/20"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
