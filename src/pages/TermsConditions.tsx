/**
 * Terms & Conditions page for FinTrack.
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';

const LAST_UPDATED = 'March 8, 2026';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using FinTrack ("the App"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you should not use the App.

FinTrack is a **client-side personal finance tracking application** that runs entirely in your web browser. No account creation or registration is required.`,
  },
  {
    title: '2. Description of Service',
    content: `FinTrack provides the following features:

- **Transaction tracking** via natural language chat interface
- **Bank account, credit card, and asset management**
- **Budget goal setting** with spending alerts
- **Financial goal tracking** with contribution management
- **Loan EMI calculator** with amortization schedules
- **Spending insights** with charts and category breakdowns
- **CSV export** of transaction data
- **Optional AI integration** using your own API keys

The App is provided **"as is"** and **"as available"** without warranties of any kind.`,
  },
  {
    title: '3. User Responsibilities',
    content: `By using FinTrack, you agree to:

- Use the App only for **lawful personal finance management** purposes
- Keep your device and browser **secure**, as all data is stored locally
- **Not rely solely** on FinTrack for critical financial decisions — always consult a qualified financial advisor
- Take responsibility for **backing up your data** via the CSV export feature
- Provide your own **valid API keys** if you choose to use the AI chat feature
- Comply with the terms of service of any third-party AI providers you connect`,
  },
  {
    title: '4. Data & Privacy',
    content: `All your financial data is stored **exclusively in your browser's local storage**. We do not collect, transmit, or store any user data on our servers.

Please review our [Privacy Policy](/privacy) for complete details on how your data is handled.

**Important**: Clearing your browser data will **permanently delete** all FinTrack data. We strongly recommend regular CSV exports as backups.`,
  },
  {
    title: '5. Intellectual Property',
    content: `The App, including its design, code, graphics, and user interface, is protected by intellectual property laws. You may not:

- Copy, modify, or distribute the App's source code for commercial purposes without permission
- Remove or alter any proprietary notices or labels
- Use the App's branding or trademarks without written consent
- Reverse engineer the App beyond what is permitted by applicable law`,
  },
  {
    title: '6. Limitation of Liability',
    content: `To the maximum extent permitted by applicable law:

- FinTrack and its creators shall **not be liable** for any indirect, incidental, special, consequential, or punitive damages
- We are **not responsible** for any financial losses, data loss, or inaccuracies in calculations
- The loan calculator and financial projections are for **informational purposes only** and should not be considered financial advice
- We make **no guarantees** about the accuracy of AI-generated responses when using the optional AI feature
- Total liability shall not exceed the amount you paid for the App (which is zero, as the App is free)`,
  },
  {
    title: '7. Third-Party Services',
    content: `If you choose to use the AI-powered chat feature, you connect directly to third-party services (OpenAI or Google). These connections are:

- Made using **your own API keys**
- Subject to the **third party's own terms of service**
- **Not mediated, monitored, or controlled** by FinTrack

We are not responsible for the availability, accuracy, or policies of these third-party services.`,
  },
  {
    title: '8. Modifications to Terms',
    content: `We reserve the right to modify these Terms and Conditions at any time. Changes will be posted on this page with an updated "Last Updated" date.

Your continued use of FinTrack after any modifications constitutes your acceptance of the revised terms.`,
  },
  {
    title: '9. Termination',
    content: `You may stop using FinTrack at any time by simply closing the App. To remove all data, clear your browser's local storage for this site.

We reserve the right to discontinue the App or any of its features at any time without prior notice.`,
  },
  {
    title: '10. Governing Law',
    content: `These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these terms or your use of the App shall be resolved through appropriate legal channels in the jurisdiction where the service provider is located.`,
  },
];

export default function TermsConditions() {
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
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Terms & Conditions</h1>
              <p className="text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Please read these terms carefully before using FinTrack. By using the App, you agree to these terms.
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
                  if (linkMatch) {
                    const isExternal = linkMatch[2].startsWith('http');
                    if (isExternal) return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">{linkMatch[1]}</a>;
                    return <Link key={i} to={linkMatch[2]} className="text-primary underline hover:text-primary/80">{linkMatch[1]}</Link>;
                  }
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
