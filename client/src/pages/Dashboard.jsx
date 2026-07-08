import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Plus,
  Rocket,
  Sparkles,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Navbar from '../components/layout/Navbar';
import { useStartups } from '../hooks/useStartups';
import {
  INTERVIEW_STATUS_META,
  MODULE_META,
  STAGE_OPTIONS,
  stageLabel,
} from '../constants/modules';

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function StartupCard({ startup }) {
  const status = startup.interviewStatus || 'not_started';
  const statusMeta = INTERVIEW_STATUS_META[status];
  const stage = STAGE_OPTIONS.find((s) => s.value === startup.stage)?.label;
  const currentModuleLabel = startup.currentModule
    ? MODULE_META[startup.currentModule]?.label
    : null;
  const needed = formatCurrency(startup.fundingNeeded);

  return (
    <Link
      to={`/startups/${startup._id}`}
      className="nexus-card group flex flex-col gap-4 transition-colors hover:border-[var(--color-border-strong)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight">
              {startup.name}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {startup.industry}
              {stage && (
                <>
                  <span className="mx-1.5 text-[var(--color-text-subtle)]">
                    ·
                  </span>
                  {stage}
                </>
              )}
            </p>
          </div>
        </div>
        <Badge className={statusMeta?.className}>
          {statusMeta?.label}
        </Badge>
      </div>

      {startup.description && (
        <p className="line-clamp-2 text-sm text-[var(--color-text-muted)]">
          {startup.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-muted)]">
        <div className="flex items-center gap-3">
          {needed && <span>Needs {needed}</span>}
          {currentModuleLabel && status === 'in_progress' && (
            <span className="hidden sm:inline">
              <span className="text-[var(--color-text-subtle)]">·</span>{' '}
              {currentModuleLabel}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 font-medium text-[var(--color-text-primary)] opacity-0 transition-opacity group-hover:opacity-100">
          Open
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function EmptyState({ onCreate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="nexus-card flex flex-col items-center justify-center gap-4 px-6 py-16 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
        <Rocket className="h-5 w-5" />
      </div>
      <div className="max-w-sm">
        <h3 className="text-base font-semibold">No startups yet</h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Create your first startup to begin the interview process.
        </p>
      </div>
      <Button
        onClick={onCreate}
        leftIcon={<Plus className="h-4 w-4" />}
      >
        Create startup
      </Button>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: startups, isLoading, isError, error } = useStartups();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Your startups
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Pick a startup to continue the diligence interview.
            </p>
          </div>
          <Button
            onClick={() => navigate('/startups/new')}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New startup
          </Button>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={3} />
        ) : isError ? (
          <div className="nexus-card text-sm text-[var(--color-danger)]">
            {error?.message || 'Failed to load startups'}
          </div>
        ) : !startups || startups.length === 0 ? (
          <EmptyState onCreate={() => navigate('/startups/new')} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {startups.map((startup, idx) => (
              <motion.div
                key={startup._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
              >
                <StartupCard startup={startup} />
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-[var(--color-text-subtle)]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Nexus learns from every answer you give.</span>
        </div>
      </main>
    </div>
  );
}
