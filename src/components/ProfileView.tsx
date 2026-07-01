import React, { useState } from 'react';
import { User, NotificationSettings } from '../auth/UserModel';
import { IUserRepository } from '../auth/UserRepository';
import { User as UserIcon, Settings, Check, Bell, Shield, Calendar, Clock, Copy } from 'lucide-react';
import { themeService, AppTheme } from '../theme/ThemeService';

interface ProfileViewProps {
  user: User;
  userRepository: IUserRepository;
  onProfileUpdated: (updatedUser: User) => void;
}

export default function ProfileView({ user, userRepository, onProfileUpdated }: ProfileViewProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [theme, setTheme] = useState(user.themePreference || 'stone');
  
  // Notification settings
  const [enableReminders, setEnableReminders] = useState(user.notificationSettings.enableReminders);
  const [alertSound, setAlertSound] = useState(user.notificationSettings.alertSound);
  const [weeklyDigest, setWeeklyDigest] = useState(user.notificationSettings.weeklyDigest);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSettings: NotificationSettings = {
      enableReminders,
      alertSound,
      weeklyDigest
    };

    const updatedUser: User = {
      ...user,
      fullName: fullName.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
      themePreference: theme as 'light' | 'dark' | 'stone',
      notificationSettings: updatedSettings
    };

    userRepository.saveUser(updatedUser);
    themeService.setTheme(theme as AppTheme, true);
    onProfileUpdated(updatedUser);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200 text-left">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div>
          <h2 className="font-semibold text-sm text-stone-950">Profile & Account Settings</h2>
          <p className="text-[10px] text-stone-400 font-medium">Manage your personal settings and preferences</p>
        </div>
        <div className="p-2 bg-stone-100 text-stone-900 rounded-xl">
          <UserIcon className="w-4 h-4" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Read-only Account Meta Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100 text-xs">
          <div className="space-y-1">
            <span className="text-stone-400 font-medium flex items-center gap-1.5 justify-start">
              <Shield className="w-3.5 h-3.5 text-stone-400" /> User ID
            </span>
            <div className="flex items-center justify-start gap-2 mt-1">
              <span className="font-mono text-[10px] text-stone-700 select-all">{user.id}</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1 rounded hover:bg-stone-200 text-stone-500 transition-colors"
                title="Copy ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-stone-400 font-medium flex items-center gap-1.5 justify-start">
              <Shield className="w-3.5 h-3.5 text-stone-400" /> Email Address
            </span>
            <div className="font-mono text-[11px] text-stone-700 mt-1">{user.email}</div>
          </div>

          <div className="space-y-1">
            <span className="text-stone-400 font-medium flex items-center gap-1.5 justify-start">
              <Calendar className="w-3.5 h-3.5 text-stone-400" /> Registered Since
            </span>
            <div className="text-stone-700 mt-1">{formatDate(user.createdAt)}</div>
          </div>

          <div className="space-y-1">
            <span className="text-stone-400 font-medium flex items-center gap-1.5 justify-start">
              <Clock className="w-3.5 h-3.5 text-stone-400" /> Last Active
            </span>
            <div className="text-stone-700 mt-1">{formatDate(user.lastLogin)}</div>
          </div>
        </div>

        {/* Profile Inputs */}
        <div className="space-y-4">
          <h3 className="font-semibold text-xs text-stone-800 flex items-center gap-2 justify-start border-b border-stone-100 pb-2">
            <Settings className="w-3.5 h-3.5 text-stone-400" />
            <span>Edit Profile Details</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-stone-400 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all text-left"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 mb-1.5">Profile Picture (Avatar URL)</label>
              <div className="flex gap-2.5 items-center">
                <input
                  type="text"
                  placeholder="https://example.com/avatar.png"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all font-mono"
                />
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border border-stone-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Theme Preference Settings */}
        <div className="space-y-3">
          <h3 className="font-semibold text-xs text-stone-800 flex items-center gap-2 justify-start border-b border-stone-100 pb-2">
            <Settings className="w-3.5 h-3.5 text-stone-400" />
            <span>Theme Preference</span>
          </h3>
          <div className="flex justify-between items-center bg-stone-50 p-4 rounded-xl border border-stone-100">
            <div>
              <p className="text-xs font-semibold text-stone-800">Dashboard Theme</p>
              <p className="text-[10px] text-stone-400">Select the visual theme for your layout.</p>
            </div>
            <div className="flex gap-1.5 bg-bg-card border border-border-main p-1 rounded-xl">
              {[
                { name: 'stone', label: 'Classic Stone' },
                { name: 'light', label: 'Light Mode' },
                { name: 'dark', label: 'Dark Mode' }
              ].map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => {
                    setTheme(t.name);
                    themeService.setTheme(t.name as AppTheme, false);
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                    theme === t.name
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-400 hover:text-stone-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Future-Ready Notification Settings Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-xs text-stone-800 flex items-center gap-2 justify-start border-b border-stone-100 pb-2">
            <Bell className="w-3.5 h-3.5 text-stone-400" />
            <span>Notification Settings</span>
          </h3>

          <div className="space-y-2.5">
            <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100 cursor-pointer">
              <input
                type="checkbox"
                checked={enableReminders}
                onChange={(e) => setEnableReminders(e.target.checked)}
                className="w-4 h-4 rounded border-stone-200 text-stone-900 focus:ring-stone-500"
              />
              <div className="text-left">
                <span className="block text-xs font-semibold text-stone-800">Enable Daily Reminders</span>
                <span className="block text-[10px] text-stone-400">Receive automatic reminders to review your unchecked habits.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100 cursor-pointer">
              <input
                type="checkbox"
                checked={alertSound}
                onChange={(e) => setAlertSound(e.target.checked)}
                className="w-4 h-4 rounded border-stone-200 text-stone-900 focus:ring-stone-500"
              />
              <div className="text-left">
                <span className="block text-xs font-semibold text-stone-800">Platform Sound Effects</span>
                <span className="block text-[10px] text-stone-400">Play an audio chime whenever a habit or task is successfully completed.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100 cursor-pointer">
              <input
                type="checkbox"
                checked={weeklyDigest}
                onChange={(e) => setWeeklyDigest(e.target.checked)}
                className="w-4 h-4 rounded border-stone-200 text-stone-900 focus:ring-stone-500"
              />
              <div className="text-left">
                <span className="block text-xs font-semibold text-stone-800">Weekly Smart Digest</span>
                <span className="block text-[10px] text-stone-400">Receive a weekly overview of your performance and streaks by email.</span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4 animate-bounce" /> Profile updated successfully!
            </span>
          ) : <span />}
          <button
            type="submit"
            className="px-5 py-2.5 bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Update Settings
          </button>
        </div>
      </form>
    </div>
  );
}
