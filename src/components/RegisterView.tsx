import React, { useState } from 'react';
import { IAuthenticationService } from '../auth/AuthenticationService';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, Check, ShieldAlert } from 'lucide-react';

interface RegisterViewProps {
  authService: IAuthenticationService;
  onRegisterSuccess: () => void;
  onToggleLogin: () => void;
}

export default function RegisterView({ authService, onRegisterSuccess, onToggleLogin }: RegisterViewProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Form validation
    if (fullName.trim().length < 2) {
      setError('The name must be at least 2 characters long.');
      return;
    }
    if (password.length < 6) {
      setError('The password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Error: The passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(fullName, email, password);
      if (response.success) {
        setSuccess(response.message);
        setTimeout(() => {
          onRegisterSuccess();
        }, 1500);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('An error occurred while connecting to the server. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200/60 p-8 shadow-md text-left animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col items-center text-center mb-8">
        {/* App Logo Emblem */}
        <div className="w-12 h-12 rounded-xl bg-stone-950 text-white flex items-center justify-center font-bold font-mono text-xl shadow-md mb-3">
          T
        </div>
        <h2 className="font-bold text-lg text-stone-950">To Do List • Register</h2>
        <p className="text-xs text-stone-400 mt-1.5 font-medium font-sans">Join the workspace to manage your tasks and daily habits</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800 font-semibold flex items-start gap-2 animate-pulse">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-semibold flex items-start gap-2">
          <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 animate-bounce" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-stone-500 mb-1.5">Full Name</label>
          <div className="relative">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full pl-10 pr-3 py-2.5 text-xs border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all text-left"
            />
            <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-stone-500 mb-1.5">Email Address</label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-10 pr-3 py-2.5 text-xs border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all font-mono text-left"
            />
            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-stone-500 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (6+ characters)"
              className="w-full pl-10 pr-10 py-2.5 text-xs border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all text-left font-mono"
            />
            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-stone-500 mb-1.5">Confirm Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-3 py-2.5 text-xs border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all text-left font-mono"
            />
            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-stone-100 text-center">
        <p className="text-[11px] text-stone-400">
          Already have an account?{' '}
          <button
            onClick={onToggleLogin}
            className="font-bold text-stone-900 hover:underline transition-all cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
