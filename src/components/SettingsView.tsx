import React, { useState } from 'react';
import { Settings, User, Image, Sliders, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onResetData: () => void;
  density: 'standard' | 'compact';
  onToggleDensity: (mode: 'standard' | 'compact') => void;
}

export default function SettingsView({
  profile,
  onUpdateProfile,
  onResetData,
  density,
  onToggleDensity
}: SettingsViewProps) {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [tagline, setTagline] = useState(profile.tagline);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ name, avatar, tagline });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetClick = () => {
    if (confirmReset) {
      onResetData();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 5000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
        <div className="p-2 bg-stone-100 text-stone-900 rounded-xl">
          <Settings className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-semibold text-sm text-stone-950">الإعدادات</h2>
          <p className="text-[10px] text-stone-400 font-medium">Application Settings</p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="font-semibold text-xs text-stone-700 flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-stone-400" />
          <span>ملف المستخدم (User Profile)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-stone-400 mb-1">الاسم</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-stone-400 mb-1">الوصف الفرعي (Tagline)</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-stone-400 mb-1">رابط صورة الحساب (Avatar URL)</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all font-mono"
            />
            {avatar && (
              <img 
                src={avatar} 
                alt="Profile Preview" 
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-stone-200/60" 
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4 animate-bounce" /> تم الحفظ بنجاح!
            </span>
          ) : <span />}
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            حفظ الملف
          </button>
        </div>
      </form>

      {/* Density Prefs */}
      <div className="border-t border-stone-100 pt-6 space-y-3">
        <h3 className="font-semibold text-xs text-stone-700 flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-stone-400" />
          <span>تفضيلات العرض (Display Preferences)</span>
        </h3>
        <div className="flex justify-between items-center bg-stone-50 p-4 rounded-xl border border-stone-100">
          <div>
            <p className="text-xs font-semibold text-stone-800">كثافة الهوامش والارتفاعات (Layout Density)</p>
            <p className="text-[10px] text-stone-400">اختر طريقة عرض الواجهة المفضلة لديك.</p>
          </div>
          <div className="flex gap-1.5 bg-white border border-stone-200/60 p-1 rounded-xl">
            <button
              onClick={() => onToggleDensity('standard')}
              className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                density === 'standard' 
                  ? 'bg-stone-900 text-white shadow-xs' 
                  : 'text-stone-400 hover:text-stone-900'
              }`}
            >
              طبيعي
            </button>
            <button
              onClick={() => onToggleDensity('compact')}
              className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                density === 'compact' 
                  ? 'bg-stone-900 text-white shadow-xs' 
                  : 'text-stone-400 hover:text-stone-900'
              }`}
            >
              مدمج
            </button>
          </div>
        </div>
      </div>

      {/* Reset State Card */}
      <div className="border-t border-stone-100 pt-6 space-y-3">
        <h3 className="font-semibold text-xs text-stone-700 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-stone-500" />
          <span>منطقة الخطر (Danger Zone)</span>
        </h3>
        <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200/60 flex items-center justify-between">
          <div className="max-w-[70%]">
            <p className="text-xs font-semibold text-stone-900">إعادة ضبط المصنع للبيانات (Reset Dashboard)</p>
            <p className="text-[10px] text-stone-400 font-medium">
              سيؤدي هذا إلى مسح كافة العادات والمهام وجلسات التركيز من المتصفح الخاص بك وإعادتها للقيم الافتراضية.
            </p>
          </div>
          <button
            onClick={handleResetClick}
            className={`px-3 py-1.5 font-semibold text-[10px] rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              confirmReset 
                ? 'bg-stone-900 text-white hover:bg-stone-800 animate-pulse' 
                : 'bg-white border border-stone-200 text-stone-900 hover:bg-stone-50'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            {confirmReset ? 'تأكيد الحذف النهائي؟' : 'إعادة تهيئة البيانات'}
          </button>
        </div>
      </div>

    </div>
  );
}
