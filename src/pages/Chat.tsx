import { useState, useRef, useEffect, useMemo } from 'react';
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
import { ChatMessage, Transaction } from '@/types/finance';
import { Send, Check, X, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';

interface ExtendedChatMessage extends ChatMessage {
  parsedIntent?: ParsedIntent;
}

export default function Chat() {
  const [messages, setMessages] = useLocalStorage<ExtendedChatMessage[]>('finance_chat_messages', []);
  const [input, setInput] = useState('');
  const { transactions, addTransaction } = useTransactions();
  const { accounts, addAccount } = useBankAccounts();
  const { cards, addCard } = useCreditCards();
  const { assets, addAsset } = useAssets();
  const { loans, addLoan } = useLoans();
  const { goals, addGoal } = useBudgetGoals();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildResponseMessage = (parsed: ParsedIntent, imageUrl?: string): { content: string; parsedIntent: ParsedIntent } => {
    switch (parsed.intent) {
      case 'transaction': {
        const d = parsed.data;
        return {
          content: `I detected a **${d.type}** of **${formatCurrency(d.amount, d.currency)}** in category **${getCategoryInfo(d.category).label}**. Shall I save this?`,
          parsedIntent: { ...parsed, data: { ...d, receiptUrl: imageUrl } as any },
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
        return {
          content: `I'll add **${d.name}** with limit **${formatCurrency(d.limit, d.currency)}**${d.outstanding ? ` and outstanding **${formatCurrency(d.outstanding, d.currency)}**` : ''}. Save it?`,
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
      case 'query': {
        const d = parsed.data;
        const answer = answerQuery(d);
        return { content: answer, parsedIntent: parsed };
      }
      default:
        return {
          content: "I couldn't understand that. Try:\n• \"spent ₹500 on groceries\"\n• \"add SBI savings account 50000\"\n• \"add HDFC credit card limit 2 lakh outstanding 15k\"\n• \"add flat worth 50 lakh\"\n• \"home loan 30 lakh at 8.5% for 20 years\"\n• \"set budget for food 5000\"\n• \"how much did I spend this month?\"",
          parsedIntent: parsed,
        };
    }
  };

  const answerQuery = (query: { queryType: string; category?: string; period?: string }): string => {
    const now = new Date();
    let startDate: Date;
    switch (query.period) {
      case 'today': startDate = startOfDay(now); break;
      case 'this_week': startDate = startOfWeek(now); break;
      case 'this_year': startDate = startOfYear(now); break;
      default: startDate = startOfMonth(now);
    }

    const periodLabel = query.period === 'today' ? 'today' : query.period === 'this_week' ? 'this week' : query.period === 'this_year' ? 'this year' : 'this month';

    if (query.queryType === 'balance') {
      const bankTotal = accounts.reduce((s, a) => s + a.balance, 0);
      const cardDebt = cards.reduce((s, c) => s + c.outstanding, 0);
      const loanDebt = loans.reduce((s, l) => s + l.principal, 0);
      const assetTotal = assets.reduce((s, a) => s + a.value, 0);
      const nw = bankTotal + assetTotal - cardDebt - loanDebt;
      return `💰 **Your Financial Summary**\n\n🏦 Bank Balance: **${formatCurrency(bankTotal, 'INR')}**\n💳 Credit Card Debt: **${formatCurrency(cardDebt, 'INR')}**\n🏠 Assets: **${formatCurrency(assetTotal, 'INR')}**\n📋 Loans: **${formatCurrency(loanDebt, 'INR')}**\n\n**Net Worth: ${formatCurrency(Math.abs(nw), 'INR')}** ${nw < 0 ? '(negative)' : ''}`;
    }

    const filtered = transactions.filter((t) => {
      const tDate = new Date(t.date);
      const matchDate = isAfter(tDate, startDate);
      const matchType = query.queryType === 'spending' ? t.type === 'expense' : query.queryType === 'income' ? t.type === 'income' : true;
      const matchCat = query.category ? t.category === query.category : true;
      return matchDate && matchType && matchCat;
    });

    const total = filtered.reduce((s, t) => s + t.amount, 0);
    const catLabel = query.category ? getCategoryInfo(query.category as any).label : '';

    if (query.queryType === 'spending') {
      return `📊 You spent **${formatCurrency(total, 'INR')}** ${catLabel ? `on **${catLabel}** ` : ''}${periodLabel} across **${filtered.length}** transactions.`;
    }
    if (query.queryType === 'income') {
      return `📈 You earned **${formatCurrency(total, 'INR')}** ${periodLabel} across **${filtered.length}** transactions.`;
    }

    const inc = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return `📊 **Summary for ${periodLabel}**\n\n📈 Income: **${formatCurrency(inc, 'INR')}**\n📉 Expenses: **${formatCurrency(exp, 'INR')}**\n💰 Net: **${formatCurrency(inc - exp, 'INR')}**\n📝 Transactions: **${filtered.length}**`;
  };

  const handleSend = (imageUrl?: string) => {
    if (!input.trim() && !imageUrl) return;
    const text = input.trim();
    const userMsg: ExtendedChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text || '📷 Receipt uploaded',
      timestamp: new Date().toISOString(),
      imageUrl,
    };

    let assistantMsg: ExtendedChatMessage;
    if (imageUrl && !text) {
      assistantMsg = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '📷 Receipt received! Please describe the transaction (e.g., "spent ₹500 on groceries") so I can save it.',
        timestamp: new Date().toISOString(),
      };
    } else {
      const parsed = parseMessageFull(text);
      const { content, parsedIntent } = buildResponseMessage(parsed, imageUrl);
      const needsConfirm = parsed.intent !== 'query' && parsed.intent !== 'unknown';
      assistantMsg = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        parsedIntent: needsConfirm ? parsedIntent : undefined,
        // Keep confirmed undefined only if it needs confirmation
        confirmed: parsed.intent === 'query' || parsed.intent === 'unknown' ? false : undefined,
      };
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    const reader = new FileReader();
    reader.onload = () => handleSend(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirm = (msg: ExtendedChatMessage) => {
    const pi = msg.parsedIntent;
    if (!pi) return;

    let successMsg = '✅ Saved!';
    switch (pi.intent) {
      case 'transaction': {
        const d = pi.data;
        addTransaction({ type: d.type, amount: d.amount, currency: d.currency, category: d.category, description: d.description, date: d.date, receiptUrl: (d as any).receiptUrl });
        successMsg = '✅ Transaction saved!';
        break;
      }
      case 'bank_account': {
        addAccount(pi.data);
        successMsg = '✅ Bank account added!';
        break;
      }
      case 'credit_card': {
        addCard(pi.data);
        successMsg = '✅ Credit card added!';
        break;
      }
      case 'asset': {
        addAsset(pi.data);
        successMsg = '✅ Asset added!';
        break;
      }
      case 'loan': {
        addLoan(pi.data);
        successMsg = '✅ Loan added!';
        break;
      }
      case 'budget': {
        const d = pi.data;
        addGoal(d.category, d.monthlyLimit, d.currency);
        successMsg = '✅ Budget goal saved!';
        break;
      }
    }

    setMessages((prev) =>
      prev.map((m) => m.id === msg.id ? { ...m, confirmed: true, content: successMsg } : m)
    );
    toast.success(successMsg.replace('✅ ', ''));
  };

  const handleReject = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => m.id === msgId ? { ...m, confirmed: false, content: '❌ Discarded.', parsedIntent: undefined } : m)
    );
  };

  const needsConfirmation = (msg: ExtendedChatMessage) =>
    msg.parsedIntent && msg.confirmed === undefined && msg.parsedIntent.intent !== 'query';

  return (
    <AppLayout>
      <h1 className="mb-2 text-2xl font-bold text-foreground">Smart Chat</h1>
      <p className="text-xs text-muted-foreground mb-4">
        Add transactions, accounts, cards, assets, loans, budgets — or ask questions!
      </p>

      <div className="space-y-3 mb-4 max-h-[calc(100vh-320px)] overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground space-y-3">
            <p className="text-lg">💬</p>
            <p className="text-sm font-medium">Try these examples:</p>
            <div className="space-y-1 text-xs">
              <p>💸 "spent ₹500 on groceries"</p>
              <p>🏦 "add SBI savings account 50,000"</p>
              <p>💳 "add HDFC credit card limit 2 lakh"</p>
              <p>🏠 "add flat worth 50 lakh"</p>
              <p>💰 "home loan 30 lakh at 8.5% for 20 years"</p>
              <p>🎯 "set budget for food 5000"</p>
              <p>📊 "how much did I spend this month?"</p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%]">
              <Card className={msg.role === 'user'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border'
              }>
                <CardContent className="py-3 px-4">
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Receipt" className="rounded-md mb-2 max-h-40 object-cover" />
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {needsConfirmation(msg) && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={() => handleConfirm(msg)} className="gap-1">
                        <Check className="h-3 w-3" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(msg.id)} className="gap-1">
                        <X className="h-3 w-3" /> Discard
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              <p className="text-[10px] text-muted-foreground mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageUpload}
      />

      <div className="fixed bottom-20 left-0 right-0 bg-background/95 backdrop-blur border-t px-4 py-3">
        <div className="mx-auto max-w-lg flex gap-2">
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Try: spent ₹500 on groceries..."
            className="flex-1"
          />
          <Button onClick={() => handleSend()} size="icon" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
