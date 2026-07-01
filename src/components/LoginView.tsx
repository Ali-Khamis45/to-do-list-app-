import React, { useState } from 'react';
import { IAuthenticationService } from '../auth/AuthenticationService';
import { User } from '../auth/UserModel';
import { Eye, EyeOff, Lock, Mail, Check, LogIn, ShieldAlert } from 'lucide-react';

interface LoginViewProps {
  authService: IAuthenticationService;
  onLoginSuccess: (user: User) => void;
  onToggleRegister: () => void;
}

export default function LoginView({ authService, onLoginSuccess, onToggleRegister }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotPasswordMsg(false);
    setLoading(true);

    try {
      const response = await authService.login(email, password, rememberMe);
      if (response.success && response.user) {
        onLoginSuccess(response.user);
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

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setForgotPasswordMsg(true);
    setTimeout(() => setForgotPasswordMsg(false), 5000);
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200/60 p-8 shadow-md text-left animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col items-center text-center mb-8">
        {/* App Logo Emblem */}
        <div className="w-12 h-12 rounded-xl bg-stone-950 text-white flex items-center justify-center font-bold font-mono text-xl shadow-md mb-3">
          T
        </div>
        <h2 className="font-bold text-lg text-stone-950">To Do List • Sign In</h2>
        <p className="text-xs text-stone-400 mt-1.5 font-medium">The clean and elegant space for your tasks and daily habits</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800 font-semibold flex items-start gap-2 animate-pulse">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {forgotPasswordMsg && (
        <div className="mb-5 p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-medium flex items-start gap-2">
          <span>🔔 Password recovery is future-ready (Cloud Sync Reset)!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[11px] font-bold text-stone-500">Password</label>
            <a 
              href="#forgot" 
              onClick={handleForgotPassword}
              className="text-[10px] text-stone-400 hover:text-stone-900 transition-colors font-medium"
            >
              Forgot Password?
            </a>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

        {/* Remember me & Auto Login */}
        <div className="flex items-center justify-between py-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-stone-200 text-stone-900 focus:ring-stone-500"
            />
            <span className="text-[11px] text-stone-500 font-medium">Remember me on this device</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-stone-100 text-center">
        <p className="text-[11px] text-stone-400">
          Don't have an account?{' '}
          <button
            onClick={onToggleRegister}
            className="font-bold text-stone-900 hover:underline transition-all cursor-pointer"
          >
            Create a new account
          </button>
        </p>
      </div>
    </div>
  );
}
