/**
 * Chat Page — Smart financial assistant.
 *
 * Handles natural language input for transactions, accounts, cards,
 * assets, loans, budgets, and financial queries.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useAssets } from '@/hooks/useAssets';
import { useLoans } from '@/hooks/useLoans';
import { useBudgetGoals } from '@/hooks/useBudgetGoals';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { parseMessageFull, ParsedIntent } from '@/lib/chatParser';
import { formatCurrency } from '@/lib/currencies';
import { getCategoryInfo } from '@/lib/categories';
import { Transaction, CategoryType } from '@/types/finance';
import { Send, Check, X, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter,
} from 'date-fns';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  imageUrl?: string;
  parsedIntent?: ParsedIntent;
  confirmed?: boolean;
}

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────

const EXAMPLES = [
  { emoji: '💸', text: '"spent ₹500 on groceries"' },
  { emoji: '🏦', text: '"add SBI savings account 50,000"' },
  { emoji: '💳', text: '"add HDFC credit card limit 2 lakh"' },
  { emoji: '🏠', text: '"add flat worth 50 lakh"' },
  { emoji: '💰', text: '"home loan 30 lakh at 8.5% for 20 years"' },
  { emoji: '🎯', text: '"set budget for food 5000"' },
  { emoji: '📊', text: '"how much did I spend this month?"' },
];

const HELP_TEXT = `I couldn't understand that. Try:
• "spent ₹500 on groceries"
• "add SBI savings account 50000"
• "add HDFC credit card limit 2 lakh outstanding 15k"
• "add flat worth 50 lakh"
• "home loan 30 lakh at 8.5% for 20 years"
• "set budget for food 5000"
• "how much did I spend this month?"`;

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function createMessage(
  role: ChatMessage['role'],
  content: string,
  extras?: Partial<ChatMessage>,
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date().toISOString(),
    ...extras,
  };
}

const PERIOD_LABELS: Record<string, string> = {
  today: 'today',
  this_week: 'this week',
  this_month: 'this month',
  this_year: 'this year',
};

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────

export default function Chat() {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('finance_chat_messages', []);
  const [input, setInput] = useState('');

  // Data hooks
  const { transactions, addTransaction } = useTransactions();
  const { accounts, addAccount } = useBankAccounts();
  const { cards, addCard } = useCreditCards();
  const { assets, addAsset } = useAssets();
  const { loans, addLoan } = useLoans();
  const { addGoal } = useBudgetGoals();

  // Refs
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Query answering ──

  const answerQuery = useCallback(
    (query: { queryType: string; category?: string; period?: string }): string => {
      const now = new Date();
      const periodStart = {
        today: startOfDay(now),
        this_week: startOfWeek(now),
        this_year: startOfYear(now),
        this_month: startOfMonth(now),
      }[query.period ?? 'this_month'] ?? startOfMonth(now);

      const periodLabel = PERIOD_LABELS[query.period ?? 'this_month'] ?? 'this month';

      // Balance / Net Worth query
      if (query.queryType === 'balance') {
        const bankTotal = accounts.reduce((sum, a) => sum + a.balance, 0);
        const cardDebt = cards.reduce((sum, c) => sum + c.outstanding, 0);
        const loanDebt = loans.reduce((sum, l) => sum + l.principal, 0);
        const assetTotal = assets.reduce((sum, a) => sum + a.value, 0);
        const netWorth = bankTotal + assetTotal - cardDebt - loanDebt;

        return [
          '💰 **Your Financial Summary**\n',
          `🏦 Bank Balance: **${formatCurrency(bankTotal, 'INR')}**`,
          `💳 Credit Debt: **${formatCurrency(cardDebt, 'INR')}**`,
          `🏠 Assets: **${formatCurrency(assetTotal, 'INR')}**`,
          `📋 Loans: **${formatCurrency(loanDebt, 'INR')}**`,
          '',
          `**Net Worth: ${formatCurrency(Math.abs(netWorth), 'INR')}** ${netWorth < 0 ? '(negative)' : ''}`,
        ].join('\n');
      }

      // Transaction-based queries
      const filtered = transactions.filter((t) => {
        const date = new Date(t.date);
        const matchesDate = isAfter(date, periodStart);
        const matchesType =
          query.queryType === 'spending' ? t.type === 'expense' :
          query.queryType === 'income' ? t.type === 'income' : true;
        const matchesCategory = query.category ? t.category === query.category : true;
        return matchesDate && matchesType && matchesCategory;
      });

      const total = filtered.reduce((sum, t) => sum + t.amount, 0);
      const catLabel = query.category
        ? ` on **${getCategoryInfo(query.category as CategoryType).label}**`
        : '';

      if (query.queryType === 'spending') {
        return `📊 You spent **${formatCurrency(total, 'INR')}**${catLabel} ${periodLabel} across **${filtered.length}** transactions.`;
      }
      if (query.queryType === 'income') {
        return `📈 You earned **${formatCurrency(total, 'INR')}** ${periodLabel} across **${filtered.length}** transactions.`;
      }

      // Summary
      const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      return [
        `📊 **Summary for ${periodLabel}**\n`,
        `📈 Income: **${formatCurrency(income, 'INR')}**`,
        `📉 Expenses: **${formatCurrency(expense, 'INR')}**`,
        `💰 Net: **${formatCurrency(income - expense, 'INR')}**`,
        `📝 Transactions: **${filtered.length}**`,
      ].join('\n');
    },
    [transactions, accounts, cards, loans, assets],
  );

  // ── Response builder ──

  const buildResponse = useCallback(
    (parsed: ParsedIntent, imageUrl?: string): { content: string; parsedIntent?: ParsedIntent } => {
      switch (parsed.intent) {
        case 'transaction': {
          const d = parsed.data;
          const intentWithReceipt: ParsedIntent = {
            intent: 'transaction',
            data: { ...d, receiptUrl: imageUrl },
          };
          return {
            content: `I detected a **${d.type}** of **${formatCurrency(d.amount, d.currency)}** in category **${getCategoryInfo(d.category).label}**. Shall I save this?`,
            parsedIntent: intentWithReceipt,
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
          return { content: answerQuery(parsed.data) };
        default:
          return { content: HELP_TEXT };
      }
    },
    [answerQuery],
  );

  // ── Handlers ──

  const handleSend = useCallback(
    (imageUrl?: string) => {
      const text = input.trim();
      if (!text && !imageUrl) return;

      const userMsg = createMessage('user', text || '📷 Receipt uploaded', { imageUrl });

      let assistantMsg: ChatMessage;

      if (imageUrl && !text) {
        assistantMsg = createMessage(
          'assistant',
          '📷 Receipt received! Please describe the transaction (e.g., "spent ₹500 on groceries") so I can save it.',
        );
      } else {
        const parsed = parseMessageFull(text);
        const { content, parsedIntent } = buildResponse(parsed, imageUrl);
        const isActionable = parsed.intent !== 'query' && parsed.intent !== 'unknown';

        assistantMsg = createMessage('assistant', content, {
          parsedIntent: isActionable ? parsedIntent : undefined,
          confirmed: isActionable ? undefined : false,
        });
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput('');
    },
    [input, buildResponse, setMessages],
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

      // Execute the action
      switch (intent.intent) {
        case 'transaction': {
          const { type, amount, currency, category, description, date, receiptUrl } = intent.data;
          addTransaction({ type, amount, currency, category, description, date, receiptUrl });
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

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, confirmed: true, content: successMsg } : m,
        ),
      );
      toast.success(successMsg.replace('✅ ', ''));
    },
    [addTransaction, addAccount, addCard, addAsset, addLoan, addGoal, setMessages],
  );

  const handleReject = useCallback(
    (msgId: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, confirmed: false, content: '❌ Discarded.', parsedIntent: undefined }
            : m,
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

  // ── Render helpers ──

  const needsConfirmation = (msg: ChatMessage): boolean =>
    !!msg.parsedIntent && msg.confirmed === undefined && msg.parsedIntent.intent !== 'query';

  return (
    <AppLayout>
      <h1 className="mb-2 text-2xl font-bold text-foreground">Smart Chat</h1>
      <p className="text-xs text-muted-foreground mb-4">
        Add transactions, accounts, cards, assets, loans, budgets — or ask questions!
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
      <div className="fixed bottom-20 left-0 right-0 bg-background/95 backdrop-blur border-t px-4 py-3">
        <div className="mx-auto max-w-lg flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload receipt"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Try: spent ₹500 on groceries..."
            className="flex-1"
          />

          <Button
            onClick={() => handleSend()}
            size="icon"
            disabled={!input.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

// ────────────────────────────────────────────────────────────────
// Sub-Components
// ────────────────────────────────────────────────────────────────

function EmptyState({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="text-center py-8 text-muted-foreground space-y-3">
      <p className="text-lg">💬</p>
      <p className="text-sm font-medium">Try these examples:</p>
      <div className="space-y-1 text-xs">
        {EXAMPLES.map(({ emoji, text }) => (
          <p key={text}>
            {emoji} {text}
          </p>
        ))}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  showActions: boolean;
  onConfirm: () => void;
  onReject: () => void;
}

function MessageBubble({ message, showActions, onConfirm, onReject }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[85%]">
        <Card
          className={
            isUser
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border'
          }
        >
          <CardContent className="py-3 px-4">
            {message.imageUrl && (
              <img
                src={message.imageUrl}
                alt="Receipt"
                className="rounded-md mb-2 max-h-40 object-cover"
              />
            )}

            <p className="text-sm whitespace-pre-wrap">{message.content}</p>

            {showActions && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={onConfirm} className="gap-1">
                  <Check className="h-3 w-3" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={onReject} className="gap-1">
                  <X className="h-3 w-3" /> Discard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
