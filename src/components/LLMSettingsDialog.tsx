/**
 * LLM Settings Dialog — Configure API key and provider for AI-powered chat.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { useLLMSettings, LLMProvider, PROVIDER_MODELS } from '@/hooks/useLLMSettings';
import { Settings, Sparkles, Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function LLMSettingsDialog() {
  const { settings, isConfigured, updateSettings, clearApiKey } = useLLMSettings();
  const [open, setOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [tempKey, setTempKey] = useState(settings.apiKey);

  const handleProviderChange = (provider: LLMProvider) => {
    const defaultModel = PROVIDER_MODELS[provider][0].value;
    updateSettings({ provider, model: defaultModel });
  };

  const handleSave = () => {
    updateSettings({ apiKey: tempKey.trim() });
    toast.success(tempKey.trim() ? 'API key saved!' : 'API key removed');
    setOpen(false);
  };

  const handleClear = () => {
    setTempKey('');
    clearApiKey();
    toast.success('API key removed');
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setTempKey(settings.apiKey);
      setShowKey(false);
    }
  };

  const models = PROVIDER_MODELS[settings.provider];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 relative"
          aria-label="AI Settings"
        >
          <Settings className="h-4 w-4" />
          {isConfigured && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Settings
          </DialogTitle>
          <DialogDescription>
            Add your own API key to enable AI-powered chat. Your key is stored only in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Provider */}
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={settings.provider} onValueChange={(v) => handleProviderChange(v as LLMProvider)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="google">Google Gemini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={settings.model} onValueChange={(v) => updateSettings({ model: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder={
                    settings.provider === 'openai'
                      ? 'sk-...'
                      : 'AIza...'
                  }
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10"
                  onClick={() => setShowKey(!showKey)}
                  type="button"
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
              {tempKey && (
                <Button variant="ghost" size="icon" onClick={handleClear} className="shrink-0">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              🔒 Stored locally in your browser. Never sent to our servers.
            </p>
          </div>

          {/* Where to get key */}
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Where to get an API key:</p>
            {settings.provider === 'openai' ? (
              <p>
                Go to{' '}
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  platform.openai.com/api-keys
                </a>
              </p>
            ) : (
              <p>
                Go to{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  aistudio.google.com/apikey
                </a>
              </p>
            )}
          </div>

          <Button onClick={handleSave} className="w-full">
            {tempKey.trim() ? 'Save API Key' : 'Save (AI Disabled)'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
