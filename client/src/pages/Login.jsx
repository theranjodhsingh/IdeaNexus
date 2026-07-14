import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { api, getErrorMessage } from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import logoSrc from '../assets/logo/logo.png';

export default function Login() {
  const { applyAuth, fetchMe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const next = {};
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
      const { data } = await api.post('/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      applyAuth(data?.data);
      try {
        await fetchMe();
      } catch {
        // non-fatal — token is good even if /me blips
      }
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link to="/" className="flex items-center">
            <img src={logoSrc} alt="IdeaNexus" className="h-16 w-auto object-contain" />
          </Link>
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Log in to continue your diligence interview.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="nexus-card flex flex-col gap-4"
          noValidate
        >
          <Input
            label="Email"
            type="email"
            placeholder="you@startup.com"
            value={form.email}
            onChange={onChange('email')}
            error={errors.email}
            autoComplete="email"
            autoFocus
          />
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={form.password}
            onChange={onChange('password')}
            error={errors.password}
            autoComplete="current-password"
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

          <Button
            type="submit"
            size="md"
            isLoading={isLoading}
            className="mt-1"
            leftIcon={<LogIn className="h-4 w-4" />}
          >
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-[var(--color-text-primary)] underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
