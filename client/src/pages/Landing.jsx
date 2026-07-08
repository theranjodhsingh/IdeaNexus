import { Link } from 'react-router-dom';
import logoSrc from '../assets/logo/logo.png';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  ClipboardList,
  FileText,
  LogIn,
  Sparkles,
} from 'lucide-react';
import Button from '../components/ui/Button';

const features = [
  {
    icon: Bot,
    title: 'A 7-module interrogation',
    body: 'Nexus walks you through Problem & Solution, Market, Validation, Revenue, Team, Competition, and Key Risk — each a real conversation, not a checklist.',
  },
  {
    icon: ClipboardList,
    title: 'Claims, not vibes',
    body: 'Every concrete number, name, and assumption is extracted as a structured claim you can audit later. Nothing Nexus hears is lost.',
  },
  {
    icon: FileText,
    title: 'A readiness report',
    body: 'When the interview closes, Nexus hands you an investor-style readiness report that says what\'s solid and what still has holes.',
  },
];

export default function Landing() {
  return (
    <div className="nexus-hero-gradient min-h-screen w-full">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center">
          <img src={logoSrc} alt="IdeaNexus" className="h-8 w-auto object-contain" />
        </Link>
        <Link to="/login">
          <Button variant="secondary" size="sm" leftIcon={<LogIn className="h-4 w-4" />}>
            Log in
          </Button>
        </Link>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 pt-16 pb-24 text-center sm:pt-24">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-text-muted)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            AI-led founder diligence
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl"
          >
            Founder diligence that feels like a real investor conversation.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 max-w-2xl text-balance text-base text-[var(--color-text-muted)] sm:text-lg"
          >
            Nexus AI doesn't validate your startup. It interrogates it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link to="/register">
              <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Start for free
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="secondary">
                See how it works
              </Button>
            </a>
          </motion.div>
        </section>

        {/* Features */}
        <section
          id="how-it-works"
          className="mx-auto w-full max-w-6xl px-6 pb-32"
        >
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              How the interview works
            </h2>
            <span className="mt-3 max-w-2xl text-sm text-[var(--color-text-muted)] sm:text-base">
              A real diligence conversation, broken into 7 modules. Nexus
              listens, pushes back, and extracts the evidence as you go.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="nexus-card flex flex-col gap-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {feature.body}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-border)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-[var(--color-text-muted)] sm:flex-row">
          <div className="flex items-center">
            <img src={logoSrc} alt="IdeaNexus" className="h-6 w-auto object-contain" />
          </div>
          <span>© {new Date().getFullYear()} IdeaNexus. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
