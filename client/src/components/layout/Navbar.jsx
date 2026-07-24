import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import logoSrc from '../../assets/logo/logo.png';

export default function Navbar() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/dashboard" className="flex items-center">
          <img src={logoSrc} alt="IdeaNexus" className="h-12 w-auto object-contain" />
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <Link to="/profile" className="flex items-center gap-2 rounded-full nexus-focus" aria-label="Open profile">
              {user.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="" className="h-8 w-8 rounded-full border border-[var(--color-border-strong)] object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-xs font-semibold text-[var(--color-accent)]">
                  {user.name?.trim()?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
              <span className="hidden text-sm text-[var(--color-text-muted)] sm:inline">{user.name}</span>
            </Link>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
