/**
 * Chat message sub-components — EmptyState and MessageBubble.
 *
 * Extracted from Chat.tsx for readability.
 */

import { Button } from '@/components/ui/button';
import { Check, X, Sparkles, Loader2 } from 'lucide-react';
import { ParsedIntent } from '@/lib/chatParser';

// ── Types ──

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  imageUrl?: string;
  parsedIntent?: ParsedIntent;
  confirmed?: boolean;
  isLoading?: boolean;
}

// ── Constants ──

export const EXAMPLES = [
  { emoji: '💸', text: '"spent ₹500 on groceries"' },
  { emoji: '🏦', text: '"add SBI savings account 50,000"' },
  { emoji: '💳', text: '"add HDFC credit card limit 2 lakh"' },
  { emoji: '🏠', text: '"add flat worth 50 lakh"' },
  { emoji: '💰', text: '"home loan 30 lakh at 8.5% for 20 years"' },
  { emoji: '🎯', text: '"set budget for food 5000"' },
  { emoji: '📊', text: '"how much did I spend this month?"' },
];

export const HELP_TEXT = `I couldn't understand that. Try:
• "spent ₹500 on groceries"
• "add SBI savings account 50000"
• "add HDFC credit card limit 2 lakh outstanding 15k"
• "add flat worth 50 lakh"
• "home loan 30 lakh at 8.5% for 20 years"
• "set budget for food 5000"
• "how much did I spend this month?"`;

// ── Helpers ──

export function createMessage(
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

export function needsConfirmation(msg: ChatMessage): boolean {
  return !!msg.parsedIntent && msg.confirmed === undefined && msg.parsedIntent.intent !== 'query';
}

// ── Components ──

export function EmptyState({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="text-center py-12 text-muted-foreground space-y-5">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground">Try these examples</p>
      <div className="flex flex-wrap justify-center gap-2">
        {EXAMPLES.map(({ emoji, text }) => (
          <span
            key={text}
            className="inline-flex items-center gap-1.5 text-xs bg-card border border-border px-3.5 py-2 rounded-full hover:bg-muted transition-colors cursor-default"
          >
            {emoji} {text}
          </span>
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

export function MessageBubble({ message, showActions, onConfirm, onReject }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%]">
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'bg-card border border-border shadow-sm'
          }`}
        >
          {message.imageUrl && (
            <img
              src={message.imageUrl}
              alt="Receipt"
              className="rounded-xl mb-2 max-h-40 object-cover"
            />
          )}

          {message.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          )}

          {showActions && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={onConfirm} className="gap-1 rounded-full shadow-sm">
                <Check className="h-3 w-3" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={onReject} className="gap-1 rounded-full">
                <X className="h-3 w-3" /> Discard
              </Button>
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground/60 mt-1.5 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
