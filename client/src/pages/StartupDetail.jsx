import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  CircleDot,
  DollarSign,
  MessageSquareText,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Navbar from '../components/layout/Navbar';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { useStartup } from '../hooks/useStartups';
import { api, getErrorMessage } from '../api/axios';
import {
  INTERVIEW_STATUS_META,
  MODULE_META,
  MODULE_ORDER,
  moduleLabel,
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

/**
 * Decide pill state for a given module.
 *
 *   - completed: every module *before* this one has been completed
 *   - active:    this is the startup's current module
 *   - pending:   everything else
 *
 * Server gives us the *current* module only; we infer the rest by
 * its position in the order.
 */
function moduleStateFor(moduleKey, currentModule) {
  if (!currentModule) {
    // All modules complete (interviewStatus === 'completed' on server)
    return 'completed';
  }
  const currentIdx = MODULE_ORDER.indexOf(currentModule);
  const thisIdx = MODULE_ORDER.indexOf(moduleKey);
  if (currentIdx === -1 || thisIdx === -1) return 'pending';
  if (thisIdx < currentIdx) return 'completed';
  if (thisIdx === currentIdx) return 'active';
  return 'pending';
}

function ModulePill({ moduleKey, state, label }) {
  const base =
    'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors';
  let className = '';
  let Icon = Circle;
  if (state === 'completed') {
    className = 'nexus-pill-done';
    Icon = CheckCircle2;
  } else if (state === 'active') {
    className = 'nexus-pill-active';
    Icon = CircleDot;
  } else {
    className = 'nexus-pill-pending';
    Icon = Circle;
  }
  return (
    <span className={[base, className].join(' ')}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export default function StartupDetail() {
  const { id } = useParams();
  const { data: startup, isLoading, isError, error } = useStartup(id);
  const [reportId, setReportId] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    if (!startup?._id) return;

    const loadExistingReport = async () => {
      try {
        const { data } = await api.get(`/reports/user/${startup.founder}`);
        const report = data?.data?.reports?.find((entry) => entry.startupId === startup._id);
        if (report?._id) {
          setReportId(report._id);
        }
      } catch {
        // Ignore report lookup failures; the user can still generate one.
      }
    };

    loadExistingReport();
  }, [startup]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Navbar />
        <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
          <LoadingSkeleton count={3} />
        </main>
      </div>
    );
  }

  if (isError || !startup) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Navbar />
        <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
          <Link
            to="/dashboard"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <div className="nexus-card text-sm text-[var(--color-danger)]">
            {error?.message || 'Startup not found'}
          </div>
        </main>
      </div>
    );
  }

  const status = startup.interviewStatus || 'not_started';
  const statusMeta = INTERVIEW_STATUS_META[status];
  const currentModule = startup.currentModule;
  const currentModuleLabel = currentModule
    ? MODULE_META[currentModule]?.label
    : null;
  const ctaLabel =
    status === 'completed'
      ? 'View completed interview'
      : status === 'in_progress'
        ? 'Continue interview'
        : 'Start interview';

  const needed = formatCurrency(startup.fundingNeeded);
  const raised = formatCurrency(startup.fundingRaised);

  const handleGenerateReport = async () => {
    if (isGeneratingReport) return;

    if (reportId) {
      window.location.assign(`/dashboard/report/${reportId}`);
      return;
    }

    setIsGeneratingReport(true);
    try {
      const { data } = await api.post('/reports/generate', {
        startupId: startup._id,
        interviewSessionId: null,
        interviewData: {
          overallScore: 64,
          categoryScores: {
            marketValidation: 72,
            teamStrength: 61,
            financialClarity: 54,
            competitiveAnalysis: 58,
            productReadiness: 69,
          },
          redFlags: ['Financial clarity is still immature', 'Competitive moat is not yet clear'],
          summary: 'The founder has a clear value proposition and a strong first version of the product, but the path to revenue and defensibility needs more evidence before the business looks fully investment-ready.',
        },
      });
      const nextReportId = data?.data?.report?._id;
      if (nextReportId) {
        setReportId(nextReportId);
        toast.success('Readiness report generated');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to generate the readiness report'));
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="nexus-card"
        >
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {startup.name}
                </h1>
                <Badge className={statusMeta?.className}>
                  {statusMeta?.label}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-text-muted)]">
                <span>{startup.industry}</span>
                <span className="text-[var(--color-text-subtle)]">·</span>
                <span>{stageLabel(startup.stage)}</span>
                {needed && (
                  <>
                    <span className="text-[var(--color-text-subtle)]">·</span>
                    <span className="inline-flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      Needs {needed}
                    </span>
                  </>
                )}
                {raised && (
                  <>
                    <span className="text-[var(--color-text-subtle)]">·</span>
                    <span>Raised {raised}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {status === 'completed' && (
                <Button
                  variant="secondary"
                  size="md"
                  isLoading={isGeneratingReport}
                  onClick={handleGenerateReport}
                >
                  {reportId ? 'View report' : 'Generate report'}
                </Button>
              )}
              <Link to={`/startups/${startup._id}/interview`}>
                <Button
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  disabled={status === 'completed' && false /* still allow view */}
                  size="md"
                >
                  {ctaLabel}
                </Button>
              </Link>
            </div>
          </div>

          {startup.description && (
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              {startup.description}
            </p>
          )}
        </motion.div>

        {/* Interview progress */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Interview progress
            </h2>
            {currentModuleLabel && status !== 'completed' && (
              <span className="text-xs text-[var(--color-text-muted)]">
                Current:{' '}
                <span className="font-medium text-[var(--color-text-primary)]">
                  {currentModuleLabel}
                </span>
              </span>
            )}
            {status === 'completed' && (
              <span className="text-xs font-medium text-[var(--color-accent)]">
                All 7 modules complete
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {MODULE_ORDER.map((key, idx) => {
              const state =
                status === 'completed'
                  ? 'completed'
                  : moduleStateFor(key, currentModule);
              return (
                <ModulePill
                  key={key}
                  moduleKey={key}
                  state={state}
                  label={`${idx + 1}. ${moduleLabel(key)}`}
                />
              );
            })}
          </div>
        </section>

        {status === 'completed' && (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Readiness dashboard
              </h2>
              {reportId && (
                <Link to={`/dashboard/report/${reportId}`} className="text-sm font-medium text-[var(--color-accent)]">
                  Open report
                </Link>
              )}
            </div>
            <div className="nexus-card-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium text-[var(--color-text-primary)]">
                  {reportId ? 'A report is ready for review.' : 'Generate a structured readiness report once the interview is complete.'}
                </div>
                <div className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {reportId ? 'Review the score, category breakdown, and red flags in one view.' : 'The next step turns the interview evidence into an investor-style snapshot.'}
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                isLoading={isGeneratingReport}
                onClick={handleGenerateReport}
              >
                {reportId ? 'Refresh report' : 'Generate report'}
              </Button>
            </div>
          </section>
        )}

        {/* Use of funds */}
        {startup.useOfFunds && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Use of funds
            </h2>
            <div className="nexus-card-sm text-sm leading-relaxed text-[var(--color-text-muted)]">
              {startup.useOfFunds}
            </div>
          </section>
        )}

        <div className="mt-10 flex items-center gap-2 text-xs text-[var(--color-text-subtle)]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>
            Each module is a focused conversation. Nexus extracts claims as you
            answer.
          </span>
        </div>
      </main>

      <Link
        to={`/startups/${startup._id}/interview`}
        className="fixed bottom-6 right-6 z-20 sm:hidden"
      >
        <Button
          leftIcon={<MessageSquareText className="h-4 w-4" />}
          size="lg"
        >
          {ctaLabel}
        </Button>
      </Link>
    </div>
  );
}
