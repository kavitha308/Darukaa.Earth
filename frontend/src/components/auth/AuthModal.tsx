import React, { useState } from 'react';
import { LogIn, UserPlus, KeyRound, Mail, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../context/authStore';
import { useMapStore } from '../../context/mapStore';
import { Modal } from '../common/Modal';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, setAuthModal } = useMapStore();
  const { login, register, isLoading, error, clearError } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  React.useEffect(() => {
    setMode(authModalMode);
    clearError();
  }, [authModalMode, isAuthModalOpen, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!fullName.trim()) {
          setFormError('Please enter your full name.');
          return;
        }
        await register(email, password, fullName);
      }
      setAuthModal(false);
    } catch {
      // Error handled by store
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@darukaa.earth');
    setPassword('AdminPassword123!');
    setMode('login');
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={() => setAuthModal(false)}
      title={mode === 'login' ? 'Administrator Login' : 'Register New Account'}
      subtitle="Access geospatial polygon tools, project editing, and analytics"
    >
      <div className="space-y-4">
        {/* Mode Tabs */}
        <div className="flex bg-earth-dark p-1 rounded-xl border border-earth-border">
          <button
            onClick={() => {
              setMode('login');
              clearError();
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'login'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('register');
              clearError();
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'register'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {(error || formError) && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-lg">
            {error || formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-earth-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Dr. Jane Goodall"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-earth-dark border border-earth-border rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-earth-muted absolute left-3 top-2.5" />
              <input
                type="email"
                placeholder="admin@darukaa.earth"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-earth-dark border border-earth-border rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-earth-muted absolute left-3 top-2.5" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-earth-dark border border-earth-border rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                required
                minLength={8}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center space-x-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-lg shadow-md shadow-brand-950 transition"
          >
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>
              {isLoading
                ? 'Processing...'
                : mode === 'login'
                  ? 'Sign In to Dashboard'
                  : 'Create Account'}
            </span>
          </button>
        </form>

        {/* Quick Demo Fill for Reviewers */}
        <div className="pt-2 border-t border-earth-border text-center">
          <button
            type="button"
            onClick={handleFillDemoAdmin}
            className="text-[11px] text-brand-400 hover:text-brand-300 underline font-medium"
          >
            Auto-fill demo admin credentials (admin@darukaa.earth)
          </button>
        </div>
      </div>
    </Modal>
  );
};
