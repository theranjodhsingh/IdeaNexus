import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Download, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Button from '../components/ui/Button';
import { api, getErrorMessage } from '../api/axios';

const CATEGORY_META = [
  { key: 'marketValidation', label: 'Market validation' },
  { key: 'teamStrength', label: 'Team strength' },
  { key: 'financialClarity', label: 'Financial clarity' },
  { key: 'competitiveAnalysis', label: 'Competitive analysis' },
  { key: 'productReadiness', label: 'Product readiness' },
];

function ScoreMeter({ score }) {
  const safeScore = Math.max(0, Math.min(100, score || 0));
  return (
    <div className="relative h-36 w-36 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
      <div
        className="absolute inset-3 rounded-full border-[10px] border-transparent"
        style={{
          borderTopColor: safeScore >= 70 ? 'var(--color-accent)' : safeScore >= 50 ? 'var(--color-amber)' : 'var(--color-danger)',
          borderRightColor: safeScore >= 70 ? 'var(--color-accent)' : safeScore >= 50 ? 'var(--color-amber)' : 'var(--color-danger)',
          transform: `rotate(${safeScore / 100 * 360}deg)`,
        }}
      />
      <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--color-bg)] text-center">
        <div>
          <div className="text-4xl font-semibold text-[var(--color-text-primary)]">{safeScore}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Overall</div>
        </div>
      </div>
    </div>
  );
}

export default function ReadinessReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/reports/${id}`);
        setReport(data?.data?.report || null);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Unable to load readiness report'));
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, navigate]);

  const summaryTone = useMemo(() => {
    if (!report) return 'developing';
    if (report.overallScore >= 75) return 'promising';
    if (report.overallScore >= 55) return 'developing';
    return 'needs attention';
  }, [report]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <LoadingSkeleton count={4} />
        </main>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <div className="nexus-card flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
              <Sparkles className="h-3.5 w-3.5" />
              Readiness report
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Investment readiness snapshot
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
              This report turns the interview evidence into a structured assessment of how investment-ready the idea currently looks.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => toast('PDF export is planned for the next iteration', { icon: '📄' })}
            >
              Export PDF
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="nexus-card flex flex-col items-center gap-5 py-8">
            <ScoreMeter score={report.overallScore} />
            <div className="text-center">
              <div className="text-lg font-semibold text-[var(--color-text-primary)]">{report.overallScore}/100</div>
              <div className="mt-1 text-sm text-[var(--color-text-muted)]">
                Positioned as a {summaryTone} opportunity.
              </div>
            </div>
          </section>

          <section className="nexus-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Category scores</h2>
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Five lenses</span>
            </div>
            <div className="space-y-4">
              {CATEGORY_META.map((item) => {
                const value = report.categoryScores?.[item.key] ?? 0;
                const tone = value >= 70 ? 'var(--color-accent)' : value >= 50 ? 'var(--color-amber)' : 'var(--color-danger)';
                return (
                  <div key={item.key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text-primary)]">{item.label}</span>
                      <span className="font-medium text-[var(--color-text-muted)]">{value}/100</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[var(--color-surface-2)]">
                      <div
                        className="h-2.5 rounded-full"
                        style={{ width: `${value}%`, backgroundColor: tone }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="nexus-card">
            <h2 className="text-lg font-semibold">Narrative summary</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--color-text-muted)]">
              {report.summary || 'No summary available yet.'}
            </p>
          </section>

          <section className="nexus-card">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[var(--color-danger)]" />
              <h2 className="text-lg font-semibold">Red flags</h2>
            </div>
            {report.redFlags?.length ? (
              <ul className="space-y-3">
                {report.redFlags.map((flag) => (
                  <li key={flag} className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)] px-3 py-3 text-sm text-[var(--color-text-primary)]">
                    {flag}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-text-muted)]">
                No major issues surfaced yet.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
