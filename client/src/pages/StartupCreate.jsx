import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Navbar from '../components/layout/Navbar';
import { useCreateStartup } from '../hooks/useStartups';
import { getErrorMessage } from '../api/axios';
import { STAGE_OPTIONS } from '../constants/modules';

const DESCRIPTION_LIMIT = 300;

export default function StartupCreate() {
  const navigate = useNavigate();
  const createStartup = useCreateStartup();
  const [form, setForm] = useState({
    name: '',
    description: '',
    industry: '',
    stage: 'idea',
    fundingNeeded: '',
    fundingRaised: '0',
    useOfFunds: '',
  });
  const [errors, setErrors] = useState({});

  const onChange = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.industry.trim()) next.industry = 'Industry is required';
    if (!form.stage) next.stage = 'Stage is required';
    if (form.description && form.description.length > DESCRIPTION_LIMIT) {
      next.description = `Description must be ${DESCRIPTION_LIMIT} chars or fewer`;
    }
    if (form.fundingNeeded && Number.isNaN(Number(form.fundingNeeded))) {
      next.fundingNeeded = 'Funding needed must be a number';
    }
    if (form.fundingRaised && Number.isNaN(Number(form.fundingRaised))) {
      next.fundingRaised = 'Funding raised must be a number';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      industry: form.industry.trim(),
      stage: form.stage,
    };
    if (form.description.trim()) payload.description = form.description.trim();
    if (form.fundingNeeded !== '') payload.fundingNeeded = Number(form.fundingNeeded) || 0;
    if (form.fundingRaised !== '') payload.fundingRaised = Number(form.fundingRaised) || 0;
    if (form.useOfFunds.trim()) payload.useOfFunds = form.useOfFunds.trim();

    try {
      const startup = await createStartup.mutateAsync(payload);
      toast.success('Startup created');
      navigate(`/startups/${startup._id}`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create startup'));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            New startup
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Give Nexus enough context to ask the right opening questions.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="nexus-card flex flex-col gap-5"
          noValidate
        >
          <Input
            label="Name"
            placeholder="e.g. Signal Studio"
            value={form.name}
            onChange={onChange('name')}
            error={errors.name}
            autoFocus
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Industry"
              placeholder="SaaS, FinTech, Health…"
              value={form.industry}
              onChange={onChange('industry')}
              error={errors.industry}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                Stage
              </label>
              <select
                value={form.stage}
                onChange={onChange('stage')}
                className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                {STAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.stage && (
                <p className="text-xs text-[var(--color-danger)]">
                  {errors.stage}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="description"
                className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
              >
                Description
              </label>
              <span
                className={[
                  'text-xs',
                  form.description.length > DESCRIPTION_LIMIT
                    ? 'text-[var(--color-danger)]'
                    : 'text-[var(--color-text-subtle)]',
                ].join(' ')}
              >
                {form.description.length}/{DESCRIPTION_LIMIT}
              </span>
            </div>
            <textarea
              id="description"
              value={form.description}
              onChange={onChange('description')}
              rows={3}
              maxLength={DESCRIPTION_LIMIT}
              placeholder="One paragraph on what you're building and for whom."
              className="nexus-textarea rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            {errors.description && (
              <p className="text-xs text-[var(--color-danger)]">
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Funding needed (USD)"
              type="number"
              min="0"
              placeholder="0"
              value={form.fundingNeeded}
              onChange={onChange('fundingNeeded')}
              error={errors.fundingNeeded}
            />
            <Input
              label="Funding raised (USD)"
              type="number"
              min="0"
              placeholder="0"
              value={form.fundingRaised}
              onChange={onChange('fundingRaised')}
              error={errors.fundingRaised}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="useOfFunds"
              className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]"
            >
              Use of funds
            </label>
            <textarea
              id="useOfFunds"
              value={form.useOfFunds}
              onChange={onChange('useOfFunds')}
              rows={3}
              placeholder="How will you spend the money?"
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-[var(--color-border)] pt-4">
            <Link to="/dashboard">
              <Button variant="ghost" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              isLoading={createStartup.isPending}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create startup
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
