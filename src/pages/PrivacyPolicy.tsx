/**
 * Privacy Policy page for FinTrack.
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';

const LAST_UPDATED = 'March 8, 2026';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content: `FinTrack is designed with a **privacy-first** architecture. We do **not** collect, store, or transmit any of your personal or financial data to external servers.

All data — including transactions, bank accounts, credit cards, assets, loans, and budget goals — is stored **exclusively in your browser's local storage** on your device.

If you choose to enable the optional AI chat feature, your messages are sent directly from your browser to the AI provider (OpenAI or Google) using **your own API key**. We never see, intercept, or store these messages.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `Since we do not collect your data, we do not use it for any purpose. Your financial information exists only on your device and is processed entirely client-side.

Specifically:
- **No analytics tracking** of your financial data
- **No advertising** or data monetization
- **No user accounts** or registration required
- **No cookies** for tracking purposes
- **No server-side storage** of any kind`,
  },
  {
    title: '3. Data Storage & Security',
    content: `Your data is stored using your browser's **localStorage API**. This means:

- Data persists on your device until you clear your browser data or explicitly delete it within the app
- Data is **not synced** across devices or browsers
- Data is as secure as your device and browser — we recommend using a device with a screen lock
- If you clear your browser cache/data, **all FinTrack data will be permanently deleted**

We recommend periodically exporting your transactions via the CSV export feature as a backup.`,
  },
  {
    title: '4. Third-Party Services',
    content: `FinTrack optionally integrates with third-party AI providers:

- **OpenAI** (GPT models) — if you provide your own API key
- **Google** (Gemini models) — if you provide your own API key

When using these services, your chat messages are sent directly to the provider's API. Please review their respective privacy policies:
- [OpenAI Privacy Policy](https://openai.com/privacy)
- [Google Privacy Policy](https://policies.google.com/privacy)

Your API keys are stored only in your browser's local storage and are **never transmitted to our servers**.`,
  },
  {
    title: '5. Children\'s Privacy',
    content: `FinTrack does not knowingly collect information from children under 13. The app is intended for general audiences who wish to manage their personal finances.`,
  },
  {
    title: '6. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated "Last Updated" date. Continued use of FinTrack after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: '7. Contact',
    content: `If you have questions about this Privacy Policy, please reach out through the app's support channels. Since FinTrack is a client-side application, the best way to protect your data is to keep your device secure and your browser updated.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Privacy Policy</h1>
              <p className="text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your privacy is critically important to us. FinTrack is built to work entirely on your device — your financial data never leaves your browser.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {SECTIONS.map(({ title, content }) => (
            <section key={title}>
              <h2 className="text-lg font-bold text-foreground mb-3">{title}</h2>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {content.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/).map((part, i) => {
                  const boldMatch = part.match(/^\*\*(.*?)\*\*$/);
                  if (boldMatch) return <strong key={i} className="text-foreground font-semibold">{boldMatch[1]}</strong>;
                  const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
                  if (linkMatch) return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">{linkMatch[1]}</a>;
                  return <span key={i}>{part}</span>;
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
