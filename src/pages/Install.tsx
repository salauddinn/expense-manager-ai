import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <AppLayout>
      <div className="py-8 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          {isInstalled ? (
            <Check className="h-8 w-8 text-success" />
          ) : (
            <Smartphone className="h-8 w-8 text-primary" />
          )}
        </div>

        <h1 className="text-xl font-bold text-foreground tracking-tight mb-2">
          {isInstalled ? 'App Installed!' : 'Install FinTrack'}
        </h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
          {isInstalled
            ? 'FinTrack is installed on your device. You can find it on your home screen.'
            : 'Install FinTrack on your device for quick access and offline support.'}
        </p>

        {!isInstalled && (
          <>
            {deferredPrompt ? (
              <Button onClick={handleInstall} className="gap-2 rounded-full px-6 shadow-md shadow-primary/20">
                <Download className="h-4 w-4" /> Install App
              </Button>
            ) : isIOS ? (
              <Card className="text-left max-w-sm mx-auto">
                <CardContent className="pt-5 space-y-3">
                  <p className="text-sm font-semibold">Install on iPhone / iPad</p>
                  <ol className="text-sm text-muted-foreground space-y-2">
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">1.</span>
                      Tap the <strong>Share</strong> button in Safari (square with arrow)
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">2.</span>
                      Scroll down and tap <strong>"Add to Home Screen"</strong>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">3.</span>
                      Tap <strong>"Add"</strong> to confirm
                    </li>
                  </ol>
                </CardContent>
              </Card>
            ) : (
              <Card className="text-left max-w-sm mx-auto">
                <CardContent className="pt-5 space-y-3">
                  <p className="text-sm font-semibold">Install from browser</p>
                  <p className="text-sm text-muted-foreground">
                    Open the browser menu (⋮) and tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 gap-3 max-w-sm mx-auto text-left">
          {[
            { title: 'Works Offline', desc: 'Access your data even without internet' },
            { title: 'Fast & Lightweight', desc: 'Loads instantly from your home screen' },
            { title: 'Secure & Private', desc: 'Your data stays on your device' },
          ].map((f) => (
            <Card key={f.title}>
              <CardContent className="py-3 px-4">
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-[11px] text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
