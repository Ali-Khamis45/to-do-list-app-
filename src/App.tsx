import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  LineChart, 
  BarChart3, 
  Trophy, 
  Archive, 
  Settings as SettingsIcon, 
  Database, 
  Plus, 
  HelpCircle, 
  MessageSquare, 
  Bell, 
  ChevronDown, 
  Zap, 
  Flame, 
  BookOpen, 
  Dumbbell, 
  Code, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  Check, 
  Smile, 
  Coffee, 
  Apple, 
  Brain, 
  Heart,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Habit, Task, FocusSession, UserProfile } from './types';
import HabitGrid from './components/HabitGrid';
import TaskList from './components/TaskList';
import StatsView from './components/StatsView';
import MilestonesView from './components/MilestonesView';
import SettingsView from './components/SettingsView';
import BackupView from './components/BackupView';
import NewTaskModal from './components/NewTaskModal';

// Helper to calculate relative date keys (YYYY-MM-DD)
const getRelativeDateString = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuA-ZQ5y6LiWbEIGRXssovDPQFB0VO9PMt5sNNhSZEA_A3Dd1EOkPs06ZERlTqDmOECIl4mk7mW6uXjwFLnnaGTAiJTYPN62bJjpoFzwJEcHZZPj3ITmUMCbnI_F0OBL5J792gvjNhEkzioNYAeLQoRYzV0-H9hBTwOQrzN8TdZCGIvE9HUFkrY_zeGYdyhQurkgKTsAVMuFbD3NuDqEE-GYujSiOjw5uNvQKQWPqzMk3R1XiB2iha4N";

const PRODUCTIVITY_TIPS = [
  "تساعدك فترات العمل المركزة (مثال: Pomodoro) على زيادة معدل إكمال العادات بنسبة 40%.",
  "ابدأ بالعادة الأكثر صعوبة في أول 3 ساعات من يومك لضمان عدم تأجيلها.",
  "تقليص حجم العادة إلى مستواها الأدنى (مثال: قراءة صفحة واحدة) يمنع عقلك من التسويف والمقاومة.",
  "ربط العادة الجديدة بروتين يومي قائم بالفعل (مثال: القراءة بعد فنجان القهوة مباشرة) يضمن نجاح الاستمرار.",
  "الاحتفال بالإنجازات البسيطة فور إتمامها يفرز الدوبامين ويثبت السلوك الإيجابي في عقلك الباطن."
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [liveTimeStr, setLiveTimeStr] = useState<string>('');
  const [tipIndex, setTipIndex] = useState<number>(0);

  // App data states
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'مستخدم نكسس',
    tagline: 'Elite Focus',
    avatar: DEFAULT_AVATAR
  });
  const [density, setDensity] = useState<'standard' | 'compact'>('standard');
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  
  // Notification states
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; desc: string; time: string; read: boolean }>>([
    { id: '1', title: 'بداية رائعة للأسبوع!', desc: 'أنهيت عادة الدراسة لمدة 12 يوماً متتالياً! استمر في تحقيق الإنجاز.', time: 'منذ دقيقة', read: false },
    { id: '2', title: 'تنبيه جلسة العمل القادمة', desc: 'لديك اجتماع استراتيجي مجدول في غضون 45 دقيقة.', time: 'منذ 5 دقائق', read: false }
  ]);

  // Seeding initial relative data for a flawless visual experience matching the mockup
  const seedDefaultData = () => {
    const initialHabits: Habit[] = [
      {
        id: '1',
        name: 'Study (الدراسة)',
        icon: 'Brain',
        color: 'text-blue-500',
        colorHex: '#005faa',
        createdAt: getRelativeDateString(30),
        streakGoal: 45,
        logs: {
          [getRelativeDateString(0)]: 'completed',
          [getRelativeDateString(1)]: 'completed',
          [getRelativeDateString(2)]: 'completed',
          [getRelativeDateString(3)]: 'completed',
          [getRelativeDateString(4)]: 'completed',
          [getRelativeDateString(5)]: 'completed',
          [getRelativeDateString(6)]: 'completed',
          [getRelativeDateString(7)]: 'completed',
          [getRelativeDateString(8)]: 'completed',
          [getRelativeDateString(9)]: 'completed',
          [getRelativeDateString(10)]: 'completed',
          [getRelativeDateString(11)]: 'completed',
          [getRelativeDateString(13)]: 'missed',
          [getRelativeDateString(15)]: 'missed',
          [getRelativeDateString(17)]: 'completed',
          [getRelativeDateString(18)]: 'completed',
          [getRelativeDateString(20)]: 'completed'
        }
      },
      {
        id: '2',
        name: 'Gym (التمارين الرياضية)',
        icon: 'Dumbbell',
        color: 'text-red-500',
        colorHex: '#ba1a1a',
        createdAt: getRelativeDateString(20),
        streakGoal: 18,
        logs: {
          [getRelativeDateString(1)]: 'completed',
          [getRelativeDateString(2)]: 'completed',
          [getRelativeDateString(3)]: 'completed',
          [getRelativeDateString(4)]: 'missed',
          [getRelativeDateString(5)]: 'missed',
          [getRelativeDateString(6)]: 'missed',
          [getRelativeDateString(7)]: 'completed',
          [getRelativeDateString(9)]: 'half',
          [getRelativeDateString(10)]: 'completed',
          [getRelativeDateString(11)]: 'completed',
          [getRelativeDateString(13)]: 'half',
          [getRelativeDateString(14)]: 'missed',
          [getRelativeDateString(15)]: 'completed',
          [getRelativeDateString(16)]: 'completed',
          [getRelativeDateString(18)]: 'completed',
          [getRelativeDateString(21)]: 'completed',
          [getRelativeDateString(22)]: 'missed'
        }
      },
      {
        id: '3',
        name: 'Reading (القراءة الثقافية)',
        icon: 'BookOpen',
        color: 'text-indigo-500',
        colorHex: '#7c3aed',
        createdAt: getRelativeDateString(25),
        streakGoal: 21,
        logs: {
          [getRelativeDateString(2)]: 'missed',
          [getRelativeDateString(5)]: 'completed',
          [getRelativeDateString(6)]: 'missed',
          [getRelativeDateString(8)]: 'missed',
          [getRelativeDateString(10)]: 'completed',
          [getRelativeDateString(12)]: 'half',
          [getRelativeDateString(14)]: 'completed',
          [getRelativeDateString(15)]: 'missed',
          [getRelativeDateString(17)]: 'completed',
          [getRelativeDateString(18)]: 'missed',
          [getRelativeDateString(19)]: 'completed',
          [getRelativeDateString(20)]: 'half'
        }
      },
      {
        id: '4',
        name: 'Programming (البرمجة والعمل)',
        icon: 'Code',
        color: 'text-emerald-500',
        colorHex: '#16a34a',
        createdAt: getRelativeDateString(15),
        streakGoal: 30,
        logs: {
          [getRelativeDateString(0)]: 'completed',
          [getRelativeDateString(1)]: 'completed',
          [getRelativeDateString(2)]: 'completed',
          [getRelativeDateString(5)]: 'completed',
          [getRelativeDateString(6)]: 'completed',
          [getRelativeDateString(7)]: 'half',
          [getRelativeDateString(8)]: 'missed',
          [getRelativeDateString(9)]: 'half',
          [getRelativeDateString(10)]: 'completed',
          [getRelativeDateString(12)]: 'completed',
          [getRelativeDateString(13)]: 'half',
          [getRelativeDateString(14)]: 'missed',
          [getRelativeDateString(16)]: 'completed',
          [getRelativeDateString(19)]: 'missed'
        }
      }
    ];

    const initialTasks: Task[] = [
      {
        id: '1',
        title: 'جلسة دراسة متقدمة (Study Session)',
        time: '08:00',
        subtext: 'خوارزميات وهياكل البيانات المتقدمة',
        completed: true,
        date: getRelativeDateString(0)
      },
      {
        id: '2',
        title: 'اجتماع التخطيط الاستراتيجي (Strategy Meeting)',
        time: '10:30',
        subtext: 'يبدأ قريباً في الموعد المحدد',
        completed: false,
        date: getRelativeDateString(0)
      },
      {
        id: '3',
        title: 'تمارين النادي المسائية (Evening Gym)',
        time: '18:00',
        subtext: 'تركيز على الساقين والبطن',
        completed: false,
        date: getRelativeDateString(0)
      },
      {
        id: '4',
        title: 'تطوير واجهة تطبيق نكسس (Frontend Code)',
        time: '14:00',
        subtext: 'إنهاء هيكلة المكونات وعمليات الحفظ',
        completed: true,
        date: getRelativeDateString(1)
      }
    ];

    // Seed some random focus sessions for the intensity heatmap over the last 42 days
    const initialSessions: FocusSession[] = [];
    for (let i = 0; i < 42; i++) {
      const dateStr = getRelativeDateString(i);
      const rand = Math.random();
      if (rand > 0.4) {
        // Log 1 to 3 sessions for active days
        const numSessions = Math.floor(rand * 3) + 1;
        for (let s = 0; s < numSessions; s++) {
          initialSessions.push({
            id: `f-${i}-${s}`,
            date: dateStr,
            intensity: parseFloat((Math.random() * 0.4 + 0.2).toFixed(2)),
            durationMinutes: 30
          });
        }
      }
    }

    setHabits(initialHabits);
    setTasks(initialTasks);
    setFocusSessions(initialSessions);
    setProfile({
      name: 'أحمد طاهر',
      tagline: 'Elite Focus',
      avatar: DEFAULT_AVATAR
    });

    localStorage.setItem('nexus_habits', JSON.stringify(initialHabits));
    localStorage.setItem('nexus_tasks', JSON.stringify(initialTasks));
    localStorage.setItem('nexus_focus', JSON.stringify(initialSessions));
    localStorage.setItem('nexus_profile', JSON.stringify({
      name: 'أحمد طاهر',
      tagline: 'Elite Focus',
      avatar: DEFAULT_AVATAR
    }));
  };

  // Load from LocalStorage or seed defaults
  useEffect(() => {
    const savedHabits = localStorage.getItem('nexus_habits');
    const savedTasks = localStorage.getItem('nexus_tasks');
    const savedFocus = localStorage.getItem('nexus_focus');
    const savedProfile = localStorage.getItem('nexus_profile');
    const savedDensity = localStorage.getItem('nexus_density');

    if (savedHabits && savedTasks && savedFocus) {
      setHabits(JSON.parse(savedHabits));
      setTasks(JSON.parse(savedTasks));
      setFocusSessions(JSON.parse(savedFocus));
      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedDensity) setDensity(savedDensity as 'standard' | 'compact');
    } else {
      seedDefaultData();
    }
  }, []);

  // Update live clock
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      };
      // Localized in Arabic & English
      const dateStr = now.toLocaleDateString('ar-EG', options);
      const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });
      setLiveTimeStr(`${dateStr} • ${timeStr}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper to sync habits to localStorage
  const saveHabitsState = (updated: Habit[]) => {
    setHabits(updated);
    localStorage.setItem('nexus_habits', JSON.stringify(updated));
  };

  // Helper to sync tasks to localStorage
  const saveTasksState = (updated: Task[]) => {
    setTasks(updated);
    localStorage.setItem('nexus_tasks', JSON.stringify(updated));
  };

  // Helper to sync focus sessions to localStorage
  const saveFocusState = (updated: FocusSession[]) => {
    setFocusSessions(updated);
    localStorage.setItem('nexus_focus', JSON.stringify(updated));
  };

  // 1. Grid cell interaction: toggle state cycles through: empty -> completed -> missed -> half -> empty
  const handleToggleCell = (habitId: string, dateString: string) => {
    const updated = habits.map(h => {
      if (h.id === habitId) {
        const current = h.logs[dateString] || null;
        let next: Habit['logs'][string] = null;
        
        if (current === null) next = 'completed';
        else if (current === 'completed') next = 'missed';
        else if (current === 'missed') next = 'half';
        else next = null;

        const updatedLogs = { ...h.logs, [dateString]: next };
        return { ...h, logs: updatedLogs };
      }
      return h;
    });

    saveHabitsState(updated);

    // Also automatically log a small focus session intensity if they completed a habit!
    const updatedCellState = updated.find(h => h.id === habitId)?.logs[dateString];
    if (updatedCellState === 'completed' || updatedCellState === 'half') {
      handleAddFocusSession(dateString, updatedCellState === 'completed' ? 0.35 : 0.2);
    }
  };

  // 2. Add focus sessions to heatmap state
  const handleAddFocusSession = (dateString: string, intensity: number) => {
    const newSession: FocusSession = {
      id: `f-${Date.now()}-${Math.random()}`,
      date: dateString,
      intensity,
      durationMinutes: 30
    };
    saveFocusState([...focusSessions, newSession]);
  };

  // 3. Delete habit
  const handleDeleteHabit = (habitId: string) => {
    const updated = habits.filter(h => h.id !== habitId);
    saveHabitsState(updated);
  };

  // 4. Toggle task completion
  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    saveTasksState(updated);
  };

  // 5. Add custom task
  const handleAddTask = (taskData: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...taskData,
      id: `t-${Date.now()}`,
      completed: false
    };
    saveTasksState([...tasks, newTask]);
  };

  // 6. Add custom habit
  const handleAddHabit = (habitData: Omit<Habit, 'id' | 'logs' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: `h-${Date.now()}`,
      createdAt: getRelativeDateString(0),
      logs: {}
    };
    saveHabitsState([...habits, newHabit]);
  };

  // 7. Delete task
  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    saveTasksState(updated);
  };

  // 8. Update User profile
  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem('nexus_profile', JSON.stringify(updatedProfile));
  };

  // 9. Reset data
  const handleResetData = () => {
    localStorage.removeItem('nexus_habits');
    localStorage.removeItem('nexus_tasks');
    localStorage.removeItem('nexus_focus');
    localStorage.removeItem('nexus_profile');
    seedDefaultData();
  };

  // 10. Density
  const handleToggleDensity = (mode: 'standard' | 'compact') => {
    setDensity(mode);
    localStorage.setItem('nexus_density', mode);
  };

  // 11. Restore whole backup
  const handleRestoreBackup = (data: { habits: Habit[]; tasks: Task[]; focusSessions: FocusSession[] }) => {
    saveHabitsState(data.habits);
    saveTasksState(data.tasks);
    saveFocusState(data.focusSessions);
  };

  // Navigation handlers for month chevrons
  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1));
  };

  // Toggle notification read state
  const handleMarkNotificationRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setFeedbackText('');
    setTimeout(() => {
      setFeedbackSent(false);
      setShowFeedback(false);
    }, 3000);
  };

  return (
    <div className={`flex min-h-screen ${density === 'compact' ? 'text-xs' : 'text-sm'} text-slate-800`}>
      
      {/* 1. Sidebar Panel */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] bg-stone-50/80 backdrop-blur-md flex flex-col py-6 px-4 border-r border-stone-100 z-40 select-none">
        
        {/* Brand Logo Header */}
        <div className="px-4 py-2 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center text-white">
              <div className="w-2.5 h-2.5 bg-white rotate-45"></div>
            </div>
            <div>
              <h2 className="font-bold text-sm text-stone-900 uppercase tracking-tight leading-tight">نكسس إستديو</h2>
              <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider font-mono">Elite Focus</p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1">
          {[
            { id: 'dashboard', label: 'لوحة التحكم (Dashboard)', icon: LayoutDashboard },
            { id: 'tracker', label: 'متتبع العادات (Tracker)', icon: LineChart },
            { id: 'statistics', label: 'الإحصائيات التحليلية', icon: BarChart3 },
            { id: 'achievements', label: 'مستودع الإنجازات', icon: Trophy },
            { id: 'archive', label: 'سجل الأرشيف', icon: Archive },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-right transition-all duration-150 ${
                  isActive
                    ? 'bg-white border border-stone-200/80 text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100/70 hover:text-stone-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-stone-900' : 'text-stone-400'}`} />
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
          
          <div className="my-4 border-t border-stone-100" />
          
          {[
            { id: 'settings', label: 'الإعدادات (Settings)', icon: SettingsIcon },
            { id: 'backup', label: 'النسخ الاحتياطي', icon: Database },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-right transition-all duration-150 ${
                  isActive
                    ? 'bg-white border border-stone-200/80 text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100/70 hover:text-stone-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-stone-900' : 'text-stone-400'}`} />
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Button inside Sidebar */}
        <div className="mt-auto pt-4 space-y-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs active:scale-97 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            إضافة مهمة أو عادة
          </button>
          
          {/* Footer Sub-items */}
          <div className="flex flex-col border-t border-stone-100 pt-2 text-[10px]">
            <button 
              onClick={() => { setShowHelp(true); setShowFeedback(false); }}
              className="flex items-center gap-2.5 px-4 py-1.5 text-stone-400 hover:text-stone-700 font-semibold transition-colors"
            >
              <HelpCircle className="w-4 h-4 shrink-0 text-stone-300" />
              <span>مساعدة وإرشادات (Help)</span>
            </button>
            <button 
              onClick={() => { setShowFeedback(true); setShowHelp(false); }}
              className="flex items-center gap-2.5 px-4 py-1.5 text-stone-400 hover:text-stone-700 font-semibold transition-colors"
            >
              <MessageSquare className="w-4 h-4 shrink-0 text-stone-300" />
              <span>تقديم رأي وملاحظات</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Canvas */}
      <main className="ml-[280px] flex-1 min-h-screen flex flex-col relative z-10 bg-[#fbfbfb]">
        
        {/* TopAppBar bar */}
        <header className="fixed top-0 right-0 left-[280px] h-16 bg-white/70 backdrop-blur-md border-b border-stone-200/50 flex justify-between items-center px-8 z-30 shadow-xs">
          <div className="flex flex-col text-right">
            <h1 className="font-bold text-sm text-stone-900">صباح الخير، {profile.name}</h1>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider font-mono" id="live-datetime">
              {liveTimeStr || 'Monday, July 1, 2026 • 02:00 AM'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            
            {/* Notifications Dropdown Trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-stone-100 transition-colors relative cursor-pointer"
              >
                <Bell className="w-4 h-4 text-stone-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-stone-900 rounded-full" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute left-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-stone-200/60 py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="px-4 py-2 border-b border-stone-100 flex justify-between items-center text-xs">
                    <span className="font-bold text-stone-800">التنبيهات</span>
                    {unreadCount > 0 && (
                      <span className="bg-stone-100 text-stone-900 font-bold text-[9px] px-2 py-0.5 rounded-full font-mono">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-stone-50">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => handleMarkNotificationRead(n.id)}
                        className={`p-3 text-xs text-stone-600 cursor-pointer hover:bg-stone-50 transition-colors flex gap-2.5 items-start ${!n.read ? 'bg-stone-50/50' : ''}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${!n.read ? 'bg-stone-900' : 'bg-transparent'}`} />
                        <div className="flex-1">
                          <p className="font-bold text-stone-900">{n.title}</p>
                          <p className="text-[11px] text-stone-500 mt-0.5">{n.desc}</p>
                          <p className="text-[9px] text-stone-400 mt-1">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-[1px] bg-stone-200" />
            
            {/* User Profile display header */}
            <div 
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-2.5 cursor-pointer hover:bg-stone-100 px-2.5 py-1.5 rounded-xl transition-all"
            >
              <img 
                className="w-7 h-7 rounded-full object-cover border border-stone-200/60 shadow-xs" 
                src={profile.avatar} 
                alt={profile.name}
                referrerPolicy="no-referrer"
              />
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-stone-800 leading-none">{profile.name}</p>
                <p className="text-[9px] text-stone-400 font-medium font-mono">{profile.tagline}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </div>

          </div>
        </header>

        {/* Tab View Routers */}
        <div className="mt-16 p-8 flex-1 overflow-x-hidden">
          
          {activeTab === 'dashboard' && (
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Left/Center Main Column */}
              <div className="flex-1 space-y-6">
                
                {/* Monthly Habit Grid */}
                <HabitGrid 
                  habits={habits}
                  currentDate={currentCalendarDate}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  onToggleCell={handleToggleCell}
                  onDeleteHabit={handleDeleteHabit}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Milestones Card */}
                  <MilestonesView habits={habits} />

                  {/* Pro Tip Card */}
                  <div className="bg-stone-950 rounded-2xl p-6 flex flex-col justify-end text-white relative overflow-hidden group min-h-[220px] shadow-xs">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-40 transition-all duration-700 group-hover:scale-105"
                      style={{ 
                        backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAuu7JaagoFgSB7nqqu9Axm87tFdktOejrcDv04Tt18CvojD2GcK8mODTZur6enz4QQSxdogYgmPLeB3egzkMNn1nnrlZULrXddJ_wEbk0ErU2f6vRuPTSN6kvjTieobExAVPAmD5g6T3HFJfKr0yXoVNkdMcm2lASHVTyqugrIF9VOCcoUd4DQ3BZxWJu9fcHNaGJoandGd40pPoOSaD3zj3O5JIIyK0Z3u83BQ6YQXQYEor_zDBkr')` 
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent z-1" />
                    
                    <div className="relative z-10 space-y-2">
                      <span className="bg-stone-100 text-stone-900 font-bold text-[8px] px-2 py-0.5 rounded uppercase font-mono tracking-wider inline-block">
                        PRO TIP • نصائح نكسس
                      </span>
                      <p className="font-semibold text-xs leading-relaxed text-stone-100">
                        {PRODUCTIVITY_TIPS[tipIndex]}
                      </p>
                      
                      <button
                        onClick={() => setTipIndex((tipIndex + 1) % PRODUCTIVITY_TIPS.length)}
                        className="text-[10px] text-stone-300 font-bold hover:text-stone-100 flex items-center gap-1 mt-2 cursor-pointer transition-colors"
                      >
                        النصيحة التالية <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Sidebar Focus Panel */}
              <StatsView 
                habits={habits}
                tasks={tasks}
                focusSessions={focusSessions}
                onAddFocusSession={handleAddFocusSession}
              />

              <div className="w-full lg:w-[320px] shrink-0">
                <TaskList 
                  tasks={tasks}
                  activeDateString={getRelativeDateString(0)}
                  onToggleTask={handleToggleTask}
                  onAddTask={handleAddTask}
                  onDeleteTask={handleDeleteTask}
                />
              </div>

            </div>
          )}

          {activeTab === 'tracker' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs">
                <h2 className="font-bold text-base text-stone-950 mb-1.5">إدارة العادات بالتفصيل</h2>
                <p className="text-xs text-stone-400 mb-6">احصل على نظرة عميقة على عاداتك المسجلة أو قم بإضافة وتعديل الأهداف بسهولة.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {habits.map((habit) => {
                    const loggedKeys = Object.keys(habit.logs);
                    const compCount = loggedKeys.filter(k => habit.logs[k] === 'completed').length;
                    const halfCount = loggedKeys.filter(k => habit.logs[k] === 'half').length;
                    
                    return (
                      <div key={habit.id} className="p-4 border border-stone-100 rounded-xl space-y-3 bg-stone-50/30 hover:shadow-xs transition-shadow">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-stone-900">{habit.name}</span>
                          <button
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="text-[10px] text-stone-400 font-bold hover:text-stone-900 transition-colors"
                          >
                            حذف العادة
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="bg-white p-2 rounded-lg border border-stone-100">
                            <p className="text-stone-400 font-medium text-[10px]">مكتملة</p>
                            <p className="font-bold text-stone-900 font-mono mt-0.5">{compCount}d</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-stone-100">
                            <p className="text-stone-400 font-medium text-[10px]">نصف كاملة</p>
                            <p className="font-bold text-stone-500 font-mono mt-0.5">{halfCount}d</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-stone-100">
                            <p className="text-stone-400 font-medium text-[10px]">الهدف الحالي</p>
                            <p className="font-bold text-stone-600 font-mono mt-0.5">{habit.streakGoal || 30}d</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="font-bold text-base text-stone-950 mb-1">الرسوم البيانية والتحليلات المتطورة</h2>
                  <p className="text-xs text-stone-400">تقييم شامل لالتزامك اليومي والأسبوعي بمخططات تفاعلية دقيقة.</p>
                </div>

                {/* Simulated Interactive Line Graph of logs completions */}
                <div className="bg-stone-50 p-6 rounded-xl border border-stone-100 space-y-4">
                  <h3 className="text-xs font-bold text-stone-800">مخطط تقدم الالتزام على مدار الأيام الـ10 الأخيرة</h3>
                  
                  {/* SVG Line Graph */}
                  <div className="h-44 w-full relative flex items-end">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 150">
                      {/* Grid Lines */}
                      <line x1="0" y1="30" x2="1000" y2="30" stroke="#e7e5e4" strokeWidth="1" />
                      <line x1="0" y1="75" x2="1000" y2="75" stroke="#e7e5e4" strokeWidth="1" />
                      <line x1="0" y1="120" x2="1000" y2="120" stroke="#e7e5e4" strokeWidth="1" />
                      
                      {/* Graph Line */}
                      <path
                        d="M 50,110 L 150,90 L 250,120 L 350,50 L 450,40 L 550,85 L 650,30 L 750,75 L 850,20 L 950,45"
                        fill="none"
                        stroke="#1c1917"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Accent Area */}
                      <path
                        d="M 50,110 L 150,90 L 250,120 L 350,50 L 450,40 L 550,85 L 650,30 L 750,75 L 850,20 L 950,45 L 950,150 L 50,150 Z"
                        fill="url(#gradient)"
                        opacity="0.05"
                      />

                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#1c1917" />
                          <stop offset="100%" stopColor="#ffffff" />
                        </linearGradient>
                      </defs>

                      {/* Points */}
                      {[
                        { x: 50, y: 110, label: 'D1' },
                        { x: 150, y: 90, label: 'D2' },
                        { x: 250, y: 120, label: 'D3' },
                        { x: 350, y: 50, label: 'D4' },
                        { x: 450, y: 40, label: 'D5' },
                        { x: 550, y: 85, label: 'D6' },
                        { x: 650, y: 30, label: 'D7' },
                        { x: 750, y: 75, label: 'D8' },
                        { x: 850, y: 20, label: 'D9' },
                        { x: 950, y: 45, label: 'D10' },
                      ].map((p, idx) => (
                        <g key={idx}>
                          <circle cx={p.x} cy={p.y} r="4" fill="#1c1917" stroke="#ffffff" strokeWidth="2.5" />
                          <text x={p.x} y="145" textAnchor="middle" className="text-[9px] fill-stone-400 font-bold font-mono">
                            {p.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                  
                  <div className="flex justify-between text-[11px] text-stone-400 pt-2 font-medium">
                    <span>الالتزام الأقصى (100%)</span>
                    <span>متوسط النسبة العامة: 74%</span>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-100 rounded-xl text-xs text-stone-600 flex gap-2.5 items-start">
                  <Sparkles className="w-4 h-4 text-stone-900 shrink-0 mt-0.5" />
                  <p>
                    <strong>ملاحظة التحليلات الذكية:</strong> تشير البيانات إلى أن تركيزك في عادات الرياضة يتضاعف بشكل ملحوظ في الأيام التي تلتزم فيها بجلسات برمجة صباحية مبكرة. ننصح بربطهما معاً دائماً.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs">
                <h2 className="font-bold text-base text-stone-950 mb-1">مستودع الأوسمة والكؤوس</h2>
                <p className="text-xs text-stone-400 mb-6">مكافآت تحفيزية تُفتح تلقائياً عند تحقيق سلاسل التزام ممتازة.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { title: 'بطل البدايات', desc: 'إتمام أول عادة لك بنجاح.', unlocked: true },
                    { title: 'سلسلة الـ7 أيام', desc: 'الالتزام بعادة معينة لمدة 7 أيام متتالية دون انقطاع.', unlocked: true },
                    { title: 'ملك الإنتاجية والتركيز', desc: 'بلوغ 12 يوماً متتالياً في عادة الدراسة.', unlocked: true },
                    { title: 'مقاوم الصعاب والمطبات', desc: 'تحويل 5 أيام فائتة إلى وضع "نصف مكتمل" بدلاً من التفريط الكامل.', unlocked: true },
                    { title: 'نصف العام الذهبي', desc: 'الالتزام بعاداتك لمدة 180 يوماً متراكماً.', unlocked: false },
                    { title: 'سفير العادات المتفوقة', desc: 'تفعيل وتتبع 6 عادات نشطة في نفس الوقت.', unlocked: false },
                  ].map((ach, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 border rounded-xl flex flex-col items-center text-center space-y-3 transition-all ${
                        ach.unlocked 
                          ? 'bg-stone-100/50 border-stone-200 shadow-xs' 
                          : 'bg-stone-50/50 border-stone-100/70 opacity-40'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                        ach.unlocked ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'
                      }`}>
                        <Trophy className="w-5 h-5 fill-current" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-stone-900">{ach.title}</h4>
                        <p className="text-[10px] text-stone-400 mt-1">{ach.desc}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        ach.unlocked ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {ach.unlocked ? 'تم الفتح' : 'مغلق'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'archive' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs">
                <h2 className="font-bold text-base text-stone-900 mb-1">سجل الأرشيف والبيانات المؤرشفة</h2>
                <p className="text-xs text-stone-400 mb-6">مراجعة المهام المنجزة قديماً أو استرجاع عادات قمت بتعطيلها مؤقتاً.</p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-xs text-stone-600 mb-2">المهام المنجزة مؤخراً:</h3>
                    <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 space-y-2.5">
                      {tasks.filter(t => t.completed).map(t => (
                        <div key={t.id} className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-stone-700 line-through">{t.title}</span>
                          <span className="text-[10px] text-stone-400 font-mono">{t.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onResetData={handleResetData}
              density={density}
              onToggleDensity={handleToggleDensity}
            />
          )}

          {activeTab === 'backup' && (
            <BackupView 
              habits={habits}
              tasks={tasks}
              focusSessions={focusSessions}
              onRestoreBackup={handleRestoreBackup}
            />
          )}

        </div>
      </main>

      {/* 3. Help Overlay dialog */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200/60 p-6 animate-in fade-in zoom-in-95 duration-150 text-right">
            <h3 className="font-bold text-sm text-stone-900 mb-3">دليل مساعدة استخدام نكسس</h3>
            <div className="space-y-2.5 text-xs text-stone-600 leading-relaxed">
              <p>📍 <strong>metabolic:</strong> انقر مباشرة على خلايا الجدول المقابلة للأيام وعاداتك لتعديل مستويات التقدم: مكتمل (check)، غير مكتمل (X)، نصف كامل (minus)، أو فارغ.</p>
              <p>📍 <strong>أشرطة التركيز والشدة:</strong> يمكنك تسجيل ساعات وجلسات عمل وتركيز إضافية بمجرد النقر على خلايا خريطة الحرارة.</p>
              <p>📍 <strong>حفظ البيانات والنسخ:</strong> يتم تدوين جميع معلوماتك تلقائياً في المتصفح. يمكنك تصدير الملف كـ JSON عبر لوحة النسخ الاحتياطي بأي وقت كضمان دائم.</p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              فهمت ذلك، إغلاق
            </button>
          </div>
        </div>
      )}

      {/* 4. Feedback Overlay dialog */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200/60 p-6 animate-in fade-in zoom-in-95 duration-150 text-right">
            <h3 className="font-bold text-sm text-stone-900 mb-2">تقديم الملاحظات والآراء</h3>
            <p className="text-xs text-stone-400 mb-4">يسرنا سماع تعليقاتك واقتراحاتك لتطوير لوحة تحكم نكسس باستمرار.</p>
            
            {feedbackSent ? (
              <div className="py-8 text-center text-xs text-stone-600 font-bold flex flex-col items-center gap-2">
                <Check className="w-8 h-8 p-1.5 bg-stone-100 rounded-full stroke-[3]" />
                <span>نشكرك على آرائك القيمة! تم استلام رسالتك وتدوينها.</span>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <textarea
                  required
                  placeholder="أدخل رسالتك أو اقتراحك هنا..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full h-24 px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all text-right"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFeedback(false)}
                    className="flex-1 py-2 border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold text-xs rounded-xl transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
                  >
                    إرسال الآن
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. Create Task/Habit Modal */}
      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTask={handleAddTask}
        onAddHabit={handleAddHabit}
      />

    </div>
  );
}
