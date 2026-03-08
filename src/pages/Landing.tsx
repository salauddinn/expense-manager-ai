/**
 * Landing Page — Beautiful marketing page for FinTrack app.
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  MessageSquare, PieChart, Target, Shield, Smartphone, Zap,
  ArrowRight, Sparkles, TrendingUp, CreditCard, Wallet, BarChart3,
  ChevronRight, Star,
} from 'lucide-react';

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Chat to Track',
    description: 'Just type "spent ₹500 on groceries" and we handle the rest. No forms, no friction.',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    icon: PieChart,
    title: 'Smart Insights',
    description: 'Beautiful charts break down your spending by category, month, and trend.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Target,
    title: 'Budget Goals',
    description: 'Set spending limits per category and get alerts before you overshoot.',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    icon: Shield,
    title: '100% Private',
    description: 'All data stays on your device. No servers, no accounts, no data mining.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Bring your own API key for GPT/Gemini to unlock natural language understanding.',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    icon: Smartphone,
    title: 'Works Offline',
    description: 'Install as a PWA and use it anywhere — even without internet.',
    gradient: 'from-cyan-500 to-blue-600',
  },
];

const STATS = [
  { value: '7+', label: 'Intent Types', icon: Zap },
  { value: '16', label: 'Categories', icon: BarChart3 },
  { value: '8', label: 'Currencies', icon: CreditCard },
  { value: '∞', label: 'Privacy', icon: Shield },
];

const CAPABILITIES = [
  { icon: '💸', text: 'Track expenses & income via chat' },
  { icon: '🏦', text: 'Manage bank accounts & credit cards' },
  { icon: '🏠', text: 'Track assets — property, gold, stocks' },
  { icon: '💰', text: 'Loan EMI calculator with amortization' },
  { icon: '🎯', text: 'Financial goals with progress tracking' },
  { icon: '📊', text: 'Export transactions as CSV' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/30">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="text-xs font-extrabold text-primary-foreground">F</span>
            </div>
            <span className="text-lg font-extrabold tracking-tight text-foreground">FinTrack</span>
          </div>
          <Link to="/dashboard">
            <Button size="sm" className="rounded-full px-5 gap-1.5 shadow-lg shadow-primary/20">
              Open App <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background decoration */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] rounded-full bg-success/6 blur-[80px] pointer-events-none" />
        <div className="absolute top-60 right-1/4 w-[250px] h-[250px] rounded-full bg-warning/6 blur-[80px] pointer-events-none" />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">AI-Powered Finance Tracker</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
            Your money,{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-primary to-success bg-clip-text text-transparent">
                understood
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M2 6C50 2 150 2 198 6" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
              </svg>
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Track expenses by simply chatting. No spreadsheets, no complex forms.
            Just say <span className="font-semibold text-foreground">"spent ₹500 on groceries"</span> and FinTrack does the rest.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button size="lg" className="rounded-full px-8 h-12 text-base gap-2 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all">
                Get Started — It's Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/chat">
              <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base gap-2">
                <MessageSquare className="h-4 w-4" /> Try Chat
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="relative px-6 pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="bg-card border border-border/60 rounded-2xl p-5 text-center hover:border-primary/30 transition-colors">
                <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-extrabold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-4">
              How it works
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Three simple steps. No signup required.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Open Chat', desc: 'Navigate to the chat tab — your financial command center.', color: 'text-primary' },
              { step: '02', title: 'Type Naturally', desc: '"Earned 50k salary", "spent 200 on uber", "add SBI account 1 lakh"', color: 'text-success' },
              { step: '03', title: 'Confirm & Done', desc: 'Review the parsed data, tap Save, and see your dashboard update instantly.', color: 'text-warning' },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="relative bg-card border border-border/60 rounded-2xl p-6 hover:border-primary/30 transition-all group">
                <span className={`text-5xl font-black ${color} opacity-15 absolute top-4 right-5`}>{step}</span>
                <div className="relative">
                  <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-4">
              Everything you need
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Powerful features wrapped in a simple, beautiful interface.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, description, gradient }) => (
              <div
                key={title}
                className="group bg-card border border-border/60 rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Capabilities List ── */}
      <section className="px-6 py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <div className="grid sm:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-4">
                Built for{' '}
                <span className="bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
                  real life
                </span>
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Whether you're tracking daily chai expenses or managing a home loan, FinTrack handles it all with a single chat interface.
              </p>
              <div className="space-y-3">
                {CAPABILITIES.map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm font-medium text-foreground">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock phone */}
            <div className="flex justify-center">
              <div className="relative w-64 h-[480px] bg-card rounded-[2.5rem] border-2 border-border/80 shadow-2xl shadow-primary/10 overflow-hidden">
                {/* Status bar */}
                <div className="flex items-center justify-center pt-3 pb-2">
                  <div className="w-20 h-5 rounded-full bg-foreground/10" />
                </div>
                {/* Chat preview */}
                <div className="px-4 space-y-3 pt-2">
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-3.5 py-2 text-xs max-w-[80%]">
                      spent 500 on groceries from hdfc
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-3.5 py-2 text-xs max-w-[85%] text-foreground">
                      I detected an <strong>expense</strong> of <strong>₹500.00</strong> in <strong>Groceries</strong> from <strong>HDFC</strong>. Save it?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="flex gap-1.5">
                      <div className="bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-[10px] font-semibold">✓ Save</div>
                      <div className="bg-muted text-muted-foreground rounded-full px-3 py-1.5 text-[10px] font-semibold">✕ Discard</div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-3.5 py-2 text-xs max-w-[80%]">
                      how much did I spend this month?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-3.5 py-2 text-xs max-w-[85%] text-foreground">
                      📊 You spent <strong>₹12,500.00</strong> this month across <strong>8</strong> transactions.
                    </div>
                  </div>
                </div>
                {/* Bottom input */}
                <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border/40 px-3 py-3">
                  <div className="flex gap-2">
                    <div className="flex-1 bg-muted/50 rounded-full h-8 px-3 flex items-center">
                      <span className="text-[10px] text-muted-foreground">Try: spent ₹200 on coffee...</span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <ArrowRight className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials / Trust ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-12">
            Why people love FinTrack
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { quote: 'Finally a finance app that doesn\'t feel like filing taxes. Just chat and done!', name: 'Priya S.', role: 'Freelancer' },
              { quote: 'I track every chai and auto expense now. The chat interface is addictive.', name: 'Rahul M.', role: 'Student' },
              { quote: 'Privacy-first and works offline. Exactly what I was looking for.', name: 'Anita K.', role: 'Product Manager' },
            ].map(({ quote, name, role }) => (
              <div key={name} className="bg-card border border-border/60 rounded-2xl p-6 text-left hover:border-primary/30 transition-colors">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{quote}"</p>
                <div>
                  <p className="text-sm font-bold text-foreground">{name}</p>
                  <p className="text-[11px] text-muted-foreground">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="relative bg-card border border-border/60 rounded-3xl p-10 sm:p-14 text-center overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-success/10 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Wallet className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-4">
                Start tracking today
              </h2>
              <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-8">
                No signup. No credit card. Just open the app and start chatting with your finances.
              </p>
              <Link to="/dashboard">
                <Button size="lg" className="rounded-full px-10 h-13 text-base gap-2 shadow-xl shadow-primary/25">
                  Launch FinTrack <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-[9px] font-extrabold text-primary-foreground">F</span>
            </div>
            <span className="text-sm font-bold text-foreground">FinTrack</span>
            <span className="text-xs text-muted-foreground">· Personal Finance, Simplified</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms & Conditions</Link>
          </div>
        </div>
        <div className="mx-auto max-w-6xl mt-4 pt-4 border-t border-border/20">
          <p className="text-xs text-muted-foreground text-center">
            Built with ❤️ · 100% client-side · Your data never leaves your device
          </p>
        </div>
      </footer>
    </div>
  );
}
