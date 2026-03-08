import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { parseMessage } from '@/lib/chatParser';
import { formatCurrency } from '@/lib/currencies';
import { getCategoryInfo } from '@/lib/categories';
import { ChatMessage, Transaction } from '@/types/finance';
import { Send, Check, X, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

export default function Chat() {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('finance_chat_messages', []);
  const [input, setInput] = useState('');
  const { addTransaction } = useTransactions();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (imageUrl?: string) => {
    if (!input.trim() && !imageUrl) return;
    const text = input.trim();
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text || '📷 Receipt uploaded',
      timestamp: new Date().toISOString(),
      imageUrl,
    };

    let assistantMsg: ChatMessage;
    if (imageUrl && !text) {
      assistantMsg = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '📷 Receipt received! Please describe the transaction (e.g., "spent ₹500 on groceries") so I can save it.',
        timestamp: new Date().toISOString(),
      };
    } else {
      const parsed = parseMessage(text);
      assistantMsg = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: parsed.amount
          ? `I detected a **${parsed.type}** of **${formatCurrency(parsed.amount, parsed.currency)}** in category **${getCategoryInfo(parsed.category).label}**. Shall I save this?`
          : "I couldn't detect an amount. Could you try again? Example: \"spent ₹500 on groceries\"",
        timestamp: new Date().toISOString(),
        parsedTransaction: parsed.amount ? {
          type: parsed.type,
          amount: parsed.amount,
          currency: parsed.currency,
          category: parsed.category,
          description: parsed.description,
          date: parsed.date,
          receiptUrl: imageUrl,
        } : undefined,
      };
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      handleSend(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirm = (msg: ChatMessage) => {
    if (!msg.parsedTransaction?.amount) return;
    const t = msg.parsedTransaction as Omit<Transaction, 'id' | 'createdAt'>;
    addTransaction(t);
    setMessages((prev) =>
      prev.map((m) => m.id === msg.id ? { ...m, confirmed: true, content: '✅ Transaction saved!' } : m)
    );
    toast.success('Transaction added!');
  };

  const handleReject = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => m.id === msgId ? { ...m, confirmed: false, content: '❌ Discarded.', parsedTransaction: undefined } : m)
    );
  };

  return (
    <AppLayout>
      <h1 className="mb-4 text-2xl font-bold text-foreground">Add Transaction</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Type something like "spent $50 on groceries" or "received ₹25000 salary"
      </p>

      <div className="space-y-3 mb-4 max-h-[calc(100vh-320px)] overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">💬</p>
            <p className="text-sm">Start typing to add your first transaction!</p>
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
                  {msg.parsedTransaction && msg.confirmed === undefined && (
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
            placeholder="spent ₹500 on groceries..."
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
