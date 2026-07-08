import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { api, getErrorMessage } from '../api/axios';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const { applyAuth, fetchMe } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'founder',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) {
      next.name = 'Name is required';
    } else if (form.name.trim().length < 2) {
      next.name = 'Name must be at least 2 characters';
    }
    if (!form.email.trim()) {
      next.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email';
    }
    if (!form.password) {
      next.password = 'Password is required';
    } else if (form.password.length < 6) {
      next.password = 'Password must be at least 6 characters';
    }
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = "Passwords don't match";
    }
    if (!['founder', 'investor'].includes(form.role)) {
      next.role = 'Pick a role';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      });
      applyAuth(data?.data);
      try {
        await fetchMe();
      } catch {
        // non-fatal
      }
      toast.success('Account created');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Registration failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-accent)] text-base font-bold text-white">
            N
          </div>
          <h1 className="text-xl font-semibold">Create your account</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Start a diligence interview in under 2 minutes.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="nexus-card flex flex-col gap-4"
          noValidate
        >
          <Input
            label="Name"
            type="text"
            placeholder="Alex Founder"
            value={form.name}
            onChange={onChange('name')}
            error={errors.name}
            autoComplete="name"
            autoFocus
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@startup.com"
            value={form.email}
            onChange={onChange('email')}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 6 characters"
            value={form.password}
            onChange={onChange('password')}
            error={errors.password}
            autoComplete="new-password"
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          />
          <Input
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={onChange('confirmPassword')}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'founder', label: 'Founder', desc: 'Build & interview' },
                { value: 'investor', label: 'Investor', desc: 'Coming soon' },
              ].map((option) => {
                const isActive = form.role === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: option.value }))}
                    className={[
                      'rounded-[var(--radius-md)] border px-3 py-3 text-left transition-colors',
                      isActive
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border-strong)]',
                    ].join(' ')}
                  >
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {option.desc}
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.role && (
              <p className="text-xs text-[var(--color-danger)]">{errors.role}</p>
            )}
          </div>

          <Button
            type="submit"
            size="md"
            isLoading={isLoading}
            className="mt-1"
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-[var(--color-text-primary)] underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
