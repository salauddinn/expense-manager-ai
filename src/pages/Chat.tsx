/**
 * Chat Page — Smart financial assistant.
 * Business logic extracted to useChatActions hook.
 */
import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChatActions } from '@/hooks/useChatActions';
import { needsConfirmation, EmptyState, MessageBubble } from '@/components/ChatComponents';
import { Send, ImagePlus, Sparkles, Loader2, Trash2 } from 'lucide-react';

export default function Chat() {
  const {
    messages, input, setInput, isProcessing, isLLMConfigured,
    bottomRef, fileInputRef,
    handleSend, handleConfirm, handleReject,
    handleImageUpload, handleKeyDown, clearMessages,
  } = useChatActions();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, bottomRef]);

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
            onClick={clearMessages}
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
