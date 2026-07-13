import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronLeft,
  User as UserIcon,
  LogOut,
  Target
} from 'lucide-react';
import { Habit, Task, FocusSession, UserProfile, HabitStatus, TaskStatus } from './types';
import { Goal } from './goals/types';
import { Idea, IdeaLink } from './brain/types';
import { forecastGoalMetrics } from './goals/forecast';
import SmartGoalPlanner from './components/SmartGoalPlanner';
import AIBrain from './components/AIBrain';
import HabitGrid from './components/HabitGrid';
import TaskList from './components/TaskList';
import StatsView from './components/StatsView';
import MilestonesView from './components/MilestonesView';
import SettingsView from './components/SettingsView';
import BackupView from './components/BackupView';
import NewTaskModal from './components/NewTaskModal';

// Clean Architecture Authentication & Repository Layers
import { PasswordHasher } from './auth/PasswordHasher';
import { UserRepository } from './auth/UserRepository';
import { SessionManager } from './auth/SessionManager';
import { AuthenticationService } from './auth/AuthenticationService';
import { User } from './auth/UserModel';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import ProfileView from './components/ProfileView';
import { themeService } from './theme/ThemeService';
import { useTheme } from './theme/useTheme';

// Global Singleton instances for Dependency Injection
const passwordHasher = new PasswordHasher();
const userRepository = new UserRepository();
const sessionManager = new SessionManager();
const authService = new AuthenticationService(userRepository, passwordHasher, sessionManager);


// Helper to calculate relative date keys (YYYY-MM-DD)
const getRelativeDateString = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuA-ZQ5y6LiWbEIGRXssovDPQFB0VO9PMt5sNNhSZEA_A3Dd1EOkPs06ZERlTqDmOECIl4mk7mW6uXjwFLnnaGTAiJTYPN62bJjpoFzwJEcHZZPj3ITmUMCbnI_F0OBL5J792gvjNhEkzioNYAeLQoRYzV0-H9hBTwOQrzN8TdZCGIvE9HUFkrY_zeGYdyhQurkgKTsAVMuFbD3NuDqEE-GYujSiOjw5uNvQKQWPqzMk3R1XiB2iha4N";

const PRODUCTIVITY_TIPS = [
  "Focused work intervals (e.g. Pomodoro) can increase your habit completion rate by 40%.",
  "Start with your most difficult habit in the first 3 hours of your day to prevent procrastination.",
  "Reducing a habit to its smallest step (e.g. reading 1 page) prevents mental friction.",
  "Linking a new habit to an existing routine (e.g. reading right after morning coffee) ensures consistency.",
  "Celebrating minor wins instantly releases dopamine, reinforcing the behavior in your subconscious."
];

export default function App() {
  const theme = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [liveTimeStr, setLiveTimeStr] = useState<string>('');
  const [tipIndex, setTipIndex] = useState<number>(0);

  // App data states
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ideaLinks, setIdeaLinks] = useState<IdeaLink[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'To Do List User',
    tagline: 'Elite Focus',
    avatar: DEFAULT_AVATAR
  });
  const [density, setDensity] = useState<'standard' | 'compact'>('standard');
  const [rolloverMode, setRolloverMode] = useState<'carryOver' | 'startEmpty'>(() => {
    const saved = localStorage.getItem('nexus_rollover_mode');
    return (saved === 'startEmpty' ? 'startEmpty' : 'carryOver');
  });

  const handleToggleRolloverMode = (mode: 'carryOver' | 'startEmpty') => {
    setRolloverMode(mode);
    localStorage.setItem('nexus_rollover_mode', mode);
  };
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  
  // Notification states
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; desc: string; time: string; read: boolean }>>([
    { id: '1', title: 'Great start to the week!', desc: 'You completed your study habit for 12 consecutive days! Keep up the momentum.', time: '1m ago', read: false },
    { id: '2', title: 'Upcoming Focus Session', desc: 'You have a strategic roadmap meeting scheduled in 45 minutes.', time: '5m ago', read: false }
  ]);

  // Load user-specific isolated data
  const loadUserData = (userId: string) => {
    const rawHabits = userRepository.getHabitsByUserId(userId);
    const rawProgress = userRepository.getDailyProgressByUserId(userId);
    const rawTasks = userRepository.getTasksByUserId(userId);
    const rawDailyTaskProgress = userRepository.getDailyTaskProgressByUserId(userId);
    const rawSessions = userRepository.getFocusSessionsByUserId(userId);
    const userObj = userRepository.getUserById(userId);

    // Map progress to habits logs
    const mappedHabits: Habit[] = rawHabits.map(h => {
      const logs: Record<string, HabitStatus> = {};
      rawProgress
        .filter(p => p.habitId === h.id)
        .forEach(p => {
          logs[p.date] = p.status;
        });
      return {
        id: h.id,
        name: h.name,
        icon: h.icon,
        color: h.color,
        colorHex: h.colorHex,
        createdAt: h.createdAt,
        streakGoal: h.streakGoal,
        logs
      };
    });

    // Map tasks
    const mappedTasks: Task[] = rawTasks.map(t => {
      const logs: Record<string, TaskStatus> = {};
      rawDailyTaskProgress
        .filter(p => p.taskId === t.id)
        .forEach(p => {
          logs[p.date] = p.status;
        });
      
      const todayStr = new Date().toISOString().split('T')[0];
      const completedToday = logs[todayStr] === 'completed';

      return {
        id: t.id,
        title: t.title,
        time: t.time,
        subtext: t.subtext,
        completed: completedToday,
        date: t.date,
        description: t.description,
        category: t.category,
        priority: t.priority,
        reminderDate: t.reminderDate,
        reminderTime: t.reminderTime,
        repeatType: t.repeatType,
        notes: t.notes,
        createdAt: t.createdAt || t.date || todayStr,
        projectId: t.projectId,
        ideaId: t.ideaId,
        logs
      };
    });

    // Map focus sessions
    const mappedSessions: FocusSession[] = rawSessions.map(s => ({
      id: s.id,
      date: s.date,
      intensity: s.intensity,
      durationMinutes: s.durationMinutes
    }));

    const rawGoals = userRepository.getGoalsByUserId(userId);
    const rawIdeas = userRepository.getIdeasByUserId(userId);
    const rawLinks = userRepository.getIdeaLinksByUserId(userId);

    // Set states
    setHabits(mappedHabits);
    setTasks(mappedTasks);
    setGoals(rawGoals);
    setIdeas(rawIdeas);
    setIdeaLinks(rawLinks);
    setFocusSessions(mappedSessions);

    if (userObj) {
      setProfile({
        name: userObj.fullName,
        tagline: 'Elite To Do List Member',
        avatar: userObj.avatarUrl || DEFAULT_AVATAR
      });
    }
  };

  // Check existing session on startup
  useEffect(() => {
    const activeUser = authService.getLoggedInUser();
    themeService.initialize(userRepository, activeUser);
    if (activeUser) {
      setCurrentUser(activeUser);
      loadUserData(activeUser.id);
    }
    const savedDensity = localStorage.getItem('nexus_density');
    if (savedDensity) setDensity(savedDensity as 'standard' | 'compact');
  }, []);

  // Check new month rollover
  useEffect(() => {
    if (!currentUser || tasks.length === 0) return;

    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const lastCheckedMonth = localStorage.getItem(`nexus_last_checked_month_${currentUser.id}`);

    if (lastCheckedMonth && lastCheckedMonth !== currentMonthKey) {
      if (rolloverMode === 'startEmpty') {
        tasks.forEach(t => {
          userRepository.deleteTask(currentUser.id, t.id);
        });
        setTasks([]);
      }
    }

    localStorage.setItem(`nexus_last_checked_month_${currentUser.id}`, currentMonthKey);
  }, [currentUser, rolloverMode, tasks]);

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
      // Localized in English only
      const dateStr = now.toLocaleDateString('en-US', options);
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

  // Dynamically generate virtual tasks from active goals & sub-goals recursively
  const mergedTasks = useMemo(() => {
    if (!currentUser) return tasks;
    const todayStr = new Date().toISOString().split('T')[0];
    const goalTasks: Task[] = [];

    const getActiveGoalTasks = (g: Goal): Task[] => {
      const list: Task[] = [];
      if (g.status !== 'active') return list;

      // Process subgoals
      if (g.subGoals && g.subGoals.length > 0) {
        g.subGoals.forEach(sg => {
          list.push(...getActiveGoalTasks(sg));
        });
      }

      const metrics = forecastGoalMetrics(g, todayStr);
      const targetToday = metrics.requiredPace > 0 
        ? metrics.requiredPace 
        : (g.targetValue / Math.max(1, metrics.daysTotal));

      if (g.goalType === 'numeric' || g.goalType === 'habit') {
        const logToday = g.logs.find(l => l.date === todayStr);
        const completed = !!logToday && logToday.value > 0;
        
        // Time estimation conversion
        const minutesEstimate = Math.round(targetToday * g.estimatedMinutesPerUnit);
        const title = minutesEstimate > 0
          ? `Spend ${minutesEstimate} mins on: ${g.title}`
          : `Log progress: ${g.title} (${targetToday < 1 ? targetToday.toFixed(2) : Math.round(targetToday)} ${g.unit})`;

        list.push({
          id: `gt-${g.id}`,
          title,
          time: '09:00',
          subtext: `Goal Action Item • Target: ${targetToday < 1 ? targetToday.toFixed(2) : Math.round(targetToday)} ${g.unit}`,
          completed,
          date: todayStr,
          category: g.category,
          priority: g.priority === 'critical' ? 'high' : g.priority,
          createdAt: todayStr,
          logs: {}
        });
      } else if (g.goalType === 'milestone') {
        // Uncompleted milestones as tasks
        const uncompleted = g.milestones.filter(m => !m.completed);
        uncompleted.forEach(m => {
          list.push({
            id: `gt-milestone-${g.id}-${m.id}`,
            title: `Milestone: ${m.title} (${g.title})`,
            time: '12:00',
            subtext: `Goal Milestones Checklist`,
            completed: false,
            date: todayStr,
            category: g.category,
            priority: g.priority === 'critical' ? 'high' : g.priority,
            createdAt: todayStr,
            logs: {}
          });
        });

        // Completed milestones today
        const completedToday = g.milestones.filter(m => m.completed && m.completedDate === todayStr);
        completedToday.forEach(m => {
          list.push({
            id: `gt-milestone-${g.id}-${m.id}`,
            title: `Milestone: ${m.title} (${g.title})`,
            time: '12:00',
            subtext: `Goal Milestones Checklist`,
            completed: true,
            date: todayStr,
            category: g.category,
            priority: g.priority === 'critical' ? 'high' : g.priority,
            createdAt: todayStr,
            logs: {}
          });
        });
      }
      return list;
    };

    goals.forEach(goal => {
      goalTasks.push(...getActiveGoalTasks(goal));
    });

    return [...tasks, ...goalTasks];
  }, [tasks, goals, currentUser]);

  // Handler for ticking virtual goal tasks
  const handleToggleGoalTask = (taskId: string, dateStr: string) => {
    if (!currentUser) return;
    const isMilestone = taskId.startsWith('gt-milestone-');

    const updateGoalInTree = (gList: Goal[], targetId: string, updater: (g: Goal) => Goal): Goal[] => {
      return gList.map(g => {
        if (g.id === targetId) {
          return updater(g);
        }
        if (g.subGoals && g.subGoals.length > 0) {
          return {
            ...g,
            subGoals: updateGoalInTree(g.subGoals, targetId, updater)
          };
        }
        return g;
      });
    };

    const findGoal = (gList: Goal[], id: string): Goal | null => {
      for (const g of gList) {
        if (g.id === id) return g;
        if (g.subGoals && g.subGoals.length > 0) {
          const res = findGoal(g.subGoals, id);
          if (res) return res;
        }
      }
      return null;
    };

    if (isMilestone) {
      const parts = taskId.split('-');
      const goalId = parts[2];
      const milestoneId = parts[3];

      const targetGoal = findGoal(goals, goalId);
      if (!targetGoal) return;

      const updatedMilestones = targetGoal.milestones.map(m => {
        if (m.id === milestoneId) {
          const nextCompleted = !m.completed;
          return {
            ...m,
            completed: nextCompleted,
            completedDate: nextCompleted ? dateStr : undefined
          };
        }
        return m;
      });

      const nextCompleted = updatedMilestones.find(m => m.id === milestoneId)?.completed;
      const milestoneObj = targetGoal.milestones.find(m => m.id === milestoneId);
      const eventType = nextCompleted ? 'milestone_completed' : 'milestone_uncompleted';
      const eventDesc = nextCompleted 
        ? `Completed milestone: ${milestoneObj?.title}`
        : `Uncompleted milestone: ${milestoneObj?.title}`;

      const newEvent = {
        id: `evt-${Date.now()}`,
        goalId,
        eventType: eventType as any,
        timestamp: new Date().toISOString(),
        description: eventDesc
      };

      let updatedLogs = [...targetGoal.logs];
      if (targetGoal.goalType === 'milestone') {
        if (nextCompleted) {
          updatedLogs.push({ date: dateStr, value: 1, note: `Completed: ${milestoneObj?.title}` });
        } else {
          const logIdx = updatedLogs.findIndex(l => l.date === dateStr && l.value === 1);
          if (logIdx >= 0) updatedLogs.splice(logIdx, 1);
        }
      }

      const nextGoals = updateGoalInTree(goals, goalId, (g) => ({
        ...g,
        milestones: updatedMilestones,
        logs: updatedLogs,
        currentValue: g.currentValue + (nextCompleted ? 1 : -1),
        history: [...g.history, newEvent]
      }));

      const findRootGoal = (gList: Goal[], id: string): Goal | null => {
        for (const g of gList) {
          if (g.id === id) return g;
          if (g.subGoals && g.subGoals.length > 0) {
            const res = findGoal(g.subGoals, id);
            if (res) return g;
          }
        }
        return null;
      };

      const rootGoal = findRootGoal(goals, goalId);
      if (rootGoal) {
        const updatedRoot = nextGoals.find(g => g.id === rootGoal.id);
        if (updatedRoot) userRepository.saveGoal(currentUser.id, updatedRoot);
      }
      setGoals(nextGoals);
    } else {
      const goalId = taskId.replace('gt-', '');
      const targetGoal = findGoal(goals, goalId);
      if (!targetGoal) return;

      const metrics = forecastGoalMetrics(targetGoal, dateStr);
      const targetToday = metrics.requiredPace > 0 
        ? metrics.requiredPace 
        : (targetGoal.targetValue / Math.max(1, metrics.daysTotal));

      const logToday = targetGoal.logs.find(l => l.date === dateStr);
      let updatedLogs = [...targetGoal.logs];
      let valueDiff = 0;

      if (logToday) {
        updatedLogs = updatedLogs.filter(l => l.date !== dateStr);
        valueDiff = -logToday.value;
      } else {
        const logVal = targetToday < 1 ? parseFloat(targetToday.toFixed(2)) : Math.round(targetToday);
        updatedLogs.push({
          date: dateStr,
          value: logVal,
          note: 'Completed via daily task list'
        });
        valueDiff = logVal;
      }

      const isCompleted = !logToday;
      const newEvent = {
        id: `evt-${Date.now()}`,
        goalId,
        eventType: (isCompleted ? 'log_added' : 'log_removed') as any,
        timestamp: new Date().toISOString(),
        description: isCompleted 
          ? `Logged ${valueDiff} ${targetGoal.unit} progress`
          : `Removed progress log`
      };

      const nextGoals = updateGoalInTree(goals, goalId, (g) => ({
        ...g,
        logs: updatedLogs,
        currentValue: parseFloat((g.currentValue + valueDiff).toFixed(2)),
        history: [...g.history, newEvent]
      }));

      const findRootGoal = (gList: Goal[], id: string): Goal | null => {
        for (const g of gList) {
          if (g.id === id) return g;
          if (g.subGoals && g.subGoals.length > 0) {
            const res = findGoal(g.subGoals, id);
            if (res) return g;
          }
        }
        return null;
      };

      const rootGoal = findRootGoal(goals, goalId);
      if (rootGoal) {
        const updatedRoot = nextGoals.find(g => g.id === rootGoal.id);
        if (updatedRoot) userRepository.saveGoal(currentUser.id, updatedRoot);
      }
      setGoals(nextGoals);
    }
  };

  // 1. Grid cell interaction: toggle state cycles through: empty -> completed -> missed -> half -> empty
  const handleToggleCell = (habitId: string, dateString: string) => {
    if (!currentUser) return;
    const updated = habits.map(h => {
      if (h.id === habitId) {
        const current = h.logs[dateString] || null;
        let next: Habit['logs'][string] = null;
        
        if (current === null) next = 'completed';
        else if (current === 'completed') next = 'missed';
        else if (current === 'missed') next = 'half';
        else next = null;

        const updatedLogs = { ...h.logs, [dateString]: next };

        // Save progress to database
        userRepository.saveDailyProgress(currentUser.id, {
          id: `p-${habitId}-${dateString}-${currentUser.id}`,
          userId: currentUser.id,
          habitId,
          date: dateString,
          status: next
        });

        return { ...h, logs: updatedLogs };
      }
      return h;
    });

    setHabits(updated);

    // Also automatically log a small focus session intensity if they completed a habit!
    const updatedCellState = updated.find(h => h.id === habitId)?.logs[dateString];
    if (updatedCellState === 'completed' || updatedCellState === 'half') {
      handleAddFocusSession(dateString, updatedCellState === 'completed' ? 0.35 : 0.2);
    }
  };

  // 2. Add focus sessions to heatmap state
  const handleAddFocusSession = (dateString: string, intensity: number) => {
    if (!currentUser) return;
    const newSessionId = `f-${Date.now()}-${Math.random()}`;
    const newSession: FocusSession = {
      id: newSessionId,
      date: dateString,
      intensity,
      durationMinutes: 30
    };
    
    // Save to database
    userRepository.saveFocusSession(currentUser.id, {
      id: newSessionId,
      userId: currentUser.id,
      date: dateString,
      intensity,
      durationMinutes: 30
    });

    setFocusSessions([...focusSessions, newSession]);
  };

  // 3. Delete habit
  const handleDeleteHabit = (habitId: string) => {
    if (!currentUser) return;
    userRepository.deleteHabit(currentUser.id, habitId);
    setHabits(habits.filter(h => h.id !== habitId));
  };

  // 4. Toggle task completion
  const handleToggleTask = (taskId: string) => {
    if (!currentUser) return;
    const todayStr = new Date().toISOString().split('T')[0];

    if (taskId.startsWith('gt-')) {
      handleToggleGoalTask(taskId, todayStr);
      return;
    }

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const current = t.logs[todayStr] || null;
        const next = current === 'completed' ? null : 'completed';

        const updatedLogs = { ...t.logs, [todayStr]: next };

        // Save progress to database
        userRepository.saveDailyTaskProgress(currentUser.id, {
          id: `tp-${taskId}-${todayStr}-${currentUser.id}`,
          userId: currentUser.id,
          taskId,
          date: todayStr,
          status: next
        });

        // Save task root completed status
        userRepository.saveTask(currentUser.id, {
          id: t.id,
          userId: currentUser.id,
          title: t.title,
          time: t.time,
          subtext: t.subtext,
          completed: next === 'completed',
          date: t.date,
          description: t.description,
          category: t.category,
          priority: t.priority,
          reminderDate: t.reminderDate,
          reminderTime: t.reminderTime,
          repeatType: t.repeatType,
          notes: t.notes,
          createdAt: t.createdAt || todayStr
        });

        return { ...t, logs: updatedLogs, completed: next === 'completed' };
      }
      return t;
    });
    setTasks(updated);
  };

  // 4b. Toggle task completion for a specific cell (Date) in the Month grid
  const handleToggleTaskCell = (taskId: string, dateString: string) => {
    if (!currentUser) return;
    
    if (taskId.startsWith('gt-')) {
      handleToggleGoalTask(taskId, dateString);
      return;
    }

    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const current = t.logs[dateString] || null;
        let next: TaskStatus = null;
        
        if (current === null) next = 'completed';
        else if (current === 'completed') next = 'missed';
        else if (current === 'missed') next = 'half';
        else next = null;

        const updatedLogs = { ...t.logs, [dateString]: next };

        // Save progress to database (DailyTaskProgress)
        userRepository.saveDailyTaskProgress(currentUser.id, {
          id: `tp-${taskId}-${dateString}-${currentUser.id}`,
          userId: currentUser.id,
          taskId,
          date: dateString,
          status: next
        });

        const todayStr = new Date().toISOString().split('T')[0];
        const completedToday = dateString === todayStr ? (next === 'completed') : t.completed;

        // Also update task root if we toggled today
        if (dateString === todayStr) {
          userRepository.saveTask(currentUser.id, {
            id: t.id,
            userId: currentUser.id,
            title: t.title,
            time: t.time,
            subtext: t.subtext,
            completed: completedToday,
            date: t.date,
            description: t.description,
            category: t.category,
            priority: t.priority,
            reminderDate: t.reminderDate,
            reminderTime: t.reminderTime,
            repeatType: t.repeatType,
            notes: t.notes,
            createdAt: t.createdAt || todayStr
          });
        }

        return { ...t, logs: updatedLogs, completed: completedToday };
      }
      return t;
    });

    setTasks(updated);

    // Also automatically log a small focus session intensity if they completed a task!
    const updatedCellState = updated.find(t => t.id === taskId)?.logs[dateString];
    if (updatedCellState === 'completed' || updatedCellState === 'half') {
      handleAddFocusSession(dateString, updatedCellState === 'completed' ? 0.35 : 0.2);
    }
  };

  // 5. Add custom task
  const handleAddTask = (taskData: {
    title: string;
    time: string;
    subtext: string;
    date: string;
    description?: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    reminderDate?: string;
    reminderTime?: string;
    repeatType?: string;
    notes?: string;
  }) => {
    if (!currentUser) return;
    const newId = `t-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const newTask: Task = {
      ...taskData,
      id: newId,
      completed: false,
      createdAt: todayStr,
      logs: {}
    };
    
    // Save to database
    userRepository.saveTask(currentUser.id, {
      id: newId,
      userId: currentUser.id,
      title: taskData.title,
      time: taskData.time,
      subtext: taskData.subtext,
      completed: false,
      date: taskData.date,
      description: taskData.description,
      category: taskData.category,
      priority: taskData.priority,
      reminderDate: taskData.reminderDate,
      reminderTime: taskData.reminderTime,
      repeatType: taskData.repeatType,
      notes: taskData.notes,
      createdAt: todayStr
    });

    setTasks([...tasks, newTask]);
  };

  // 6. Add custom habit
  const handleAddHabit = (habitData: Omit<Habit, 'id' | 'logs' | 'createdAt'>) => {
    if (!currentUser) return;
    const newId = `h-${Date.now()}`;
    const createdAt = getRelativeDateString(0);
    const newHabit: Habit = {
      ...habitData,
      id: newId,
      createdAt,
      logs: {}
    };
    
    // Save to database
    userRepository.saveHabit(currentUser.id, {
      id: newId,
      userId: currentUser.id,
      name: habitData.name,
      icon: habitData.icon,
      color: habitData.color,
      colorHex: habitData.colorHex,
      streakGoal: habitData.streakGoal || 30,
      createdAt
    });

    setHabits([...habits, newHabit]);
  };

  // 7. Delete task
  const handleDeleteTask = (taskId: string) => {
    if (!currentUser) return;
    if (taskId.startsWith('gt-')) return; // Virtual goal tasks cannot be deleted
    userRepository.deleteTask(currentUser.id, taskId);
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  // AI Brain Handlers
  const handleSaveIdea = (idea: Idea) => {
    if (!currentUser) return;
    userRepository.saveIdea(currentUser.id, idea);
    setIdeas(userRepository.getIdeasByUserId(currentUser.id));
  };

  const handleDeleteIdea = (ideaId: string) => {
    if (!currentUser) return;
    userRepository.deleteIdea(currentUser.id, ideaId);
    setIdeas(userRepository.getIdeasByUserId(currentUser.id));
    setIdeaLinks(userRepository.getIdeaLinksByUserId(currentUser.id));
  };

  const handleSaveIdeaLink = (link: IdeaLink) => {
    if (!currentUser) return;
    userRepository.saveIdeaLink(currentUser.id, link);
    setIdeaLinks(userRepository.getIdeaLinksByUserId(currentUser.id));
  };

  const handleDeleteIdeaLink = (linkId: string) => {
    if (!currentUser) return;
    userRepository.deleteIdeaLink(currentUser.id, linkId);
    setIdeaLinks(userRepository.getIdeaLinksByUserId(currentUser.id));
  };

  const handleAddDirectTask = (task: Task) => {
    if (!currentUser) return;
    userRepository.saveTask(currentUser.id, {
      id: task.id,
      userId: currentUser.id,
      title: task.title,
      time: task.time,
      subtext: task.subtext,
      completed: task.completed,
      date: task.date,
      description: task.description,
      category: task.category,
      priority: task.priority,
      notes: task.notes,
      createdAt: task.createdAt,
      projectId: task.projectId,
      ideaId: task.ideaId
    });
    setTasks(prev => [...prev, { ...task, logs: {} }]);
  };

  const handleAddProjectGoal = (goal: Goal) => {
    if (!currentUser) return;
    userRepository.saveGoal(currentUser.id, goal);
    setGoals(userRepository.getGoalsByUserId(currentUser.id));
  };

  // 8. Update User profile
  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    if (!currentUser) return;
    setProfile(updatedProfile);
    
    // Also update the User record in database
    const userObj = userRepository.getUserById(currentUser.id);
    if (userObj) {
      userRepository.saveUser({
        ...userObj,
        fullName: updatedProfile.name,
        avatarUrl: updatedProfile.avatar
      });
    }
  };

  // 9. Reset data
  const handleResetData = () => {
    if (!currentUser) return;
    userRepository.resetAllUserData(currentUser.id);
    loadUserData(currentUser.id);
  };

  // 10. Density
  const handleToggleDensity = (mode: 'standard' | 'compact') => {
    setDensity(mode);
    localStorage.setItem('nexus_density', mode);
  };

  // 11. Restore whole backup
  const handleRestoreBackup = (data: { habits: Habit[]; tasks: Task[]; focusSessions: FocusSession[] }) => {
    if (!currentUser) return;
    
    // Clean first
    userRepository.clearFocusSessions(currentUser.id);
    
    // Save each habit and logs
    data.habits.forEach(h => {
      userRepository.saveHabit(currentUser.id, {
        id: h.id,
        userId: currentUser.id,
        name: h.name,
        icon: h.icon,
        color: h.color,
        colorHex: h.colorHex,
        streakGoal: h.streakGoal || 30,
        createdAt: h.createdAt
      });

      userRepository.clearDailyProgress(currentUser.id, h.id);
      Object.entries(h.logs).forEach(([date, status]) => {
        userRepository.saveDailyProgress(currentUser.id, {
          id: `p-${h.id}-${date}-${currentUser.id}`,
          userId: currentUser.id,
          habitId: h.id,
          date,
          status
        });
      });
    });

    // Save each task
    data.tasks.forEach(t => {
      userRepository.saveTask(currentUser.id, {
        id: t.id,
        userId: currentUser.id,
        title: t.title,
        time: t.time,
        subtext: t.subtext,
        completed: t.completed,
        date: t.date,
        createdAt: new Date().toISOString()
      });
    });

    // Save each focus session
    data.focusSessions.forEach(s => {
      userRepository.saveFocusSession(currentUser.id, {
        id: s.id,
        userId: currentUser.id,
        date: s.date,
        intensity: s.intensity,
        durationMinutes: s.durationMinutes
      });
    });

    // Reload
    loadUserData(currentUser.id);
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

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setHabits([]);
    setTasks([]);
    setGoals([]);
    setFocusSessions([]);
    setActiveTab('dashboard');
    themeService.initialize(userRepository, null);
  };

  // Render login/register views if not authenticated
  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
        {isRegistering ? (
          <RegisterView 
            authService={authService}
            onRegisterSuccess={() => setIsRegistering(false)}
            onToggleLogin={() => setIsRegistering(false)}
          />
        ) : (
          <LoginView 
            authService={authService}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              loadUserData(user.id);
              themeService.initialize(userRepository, user);
            }}
            onToggleRegister={() => setIsRegistering(true)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${density === 'compact' ? 'text-xs' : 'text-sm'} bg-bg-app text-text-primary transition-colors duration-200`}>
      
      {/* 1. Sidebar Panel */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] bg-bg-sidebar backdrop-blur-md flex flex-col py-6 px-4 border-r border-border-main z-40 select-none transition-colors duration-200">
        
        {/* Brand Logo Header */}
        <div className="px-4 py-2 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center text-white">
              <div className="w-2.5 h-2.5 bg-white rotate-45"></div>
            </div>
            <div>
              <h2 className="font-bold text-sm text-stone-900 uppercase tracking-tight leading-tight">To Do List</h2>
              <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider font-mono">Elite Focus</p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'goals', label: 'Smart Goals', icon: Target },
            { id: 'brain', label: 'AI Brain', icon: Brain },
            { id: 'tracker', label: 'To Do Grid', icon: LineChart },
            { id: 'statistics', label: 'Analytics & Stats', icon: BarChart3 },
            { id: 'achievements', label: 'Achievements', icon: Trophy },
            { id: 'archive', label: 'Archive Log', icon: Archive },
            { id: 'profile', label: 'Profile Settings', icon: UserIcon },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all duration-150 ${
                  isActive
                    ? 'bg-bg-card border border-border-main text-text-primary shadow-xs'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-text-primary' : 'text-text-muted'}`} />
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
          
          <div className="my-4 border-t border-border-main" />
          
          {[
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
            { id: 'backup', label: 'Database Backup', icon: Database },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all duration-150 ${
                  isActive
                    ? 'bg-bg-card border border-border-main text-text-primary shadow-xs'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-text-primary' : 'text-text-muted'}`} />
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-150 mt-1 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0 text-red-500" />
            <span className="flex-1">Sign Out</span>
          </button>
        </nav>

        {/* Action Button inside Sidebar */}
        <div className="mt-auto pt-4 space-y-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-bg-btn hover:opacity-90 text-text-btn font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs active:scale-97 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add Habit / Task
          </button>
          
          {/* Footer Sub-items */}
          <div className="flex flex-col border-t border-stone-100 pt-2 text-[10px]">
            <button 
              onClick={() => { setShowHelp(true); setShowFeedback(false); }}
              className="flex items-center gap-2.5 px-4 py-1.5 text-stone-400 hover:text-stone-700 font-semibold transition-colors"
            >
              <HelpCircle className="w-4 h-4 shrink-0 text-stone-300" />
              <span>Help & Guide</span>
            </button>
            <button 
              onClick={() => { setShowFeedback(true); setShowHelp(false); }}
              className="flex items-center gap-2.5 px-4 py-1.5 text-stone-400 hover:text-stone-700 font-semibold transition-colors"
            >
              <MessageSquare className="w-4 h-4 shrink-0 text-stone-300" />
              <span>Send Feedback</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Canvas */}
      <main className="ml-[280px] flex-1 min-h-screen flex flex-col relative z-10 bg-bg-app transition-colors duration-200">
        
        {/* TopAppBar bar */}
        <header className="fixed top-0 right-0 left-[280px] h-16 bg-bg-card/75 backdrop-blur-md border-b border-border-main flex justify-between items-center px-8 z-30 shadow-xs transition-colors duration-200">
          <div className="flex flex-col text-left">
            <h1 className="font-bold text-sm text-text-primary">Good morning, {profile.name}</h1>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider font-mono" id="live-datetime">
              {liveTimeStr || 'Monday, July 1, 2026 • 02:00 AM'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            
            {/* Notifications Dropdown Trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-bg-hover transition-colors relative cursor-pointer"
              >
                <Bell className="w-4 h-4 text-text-secondary" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent-main rounded-full" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute left-0 mt-3 w-80 bg-bg-card rounded-xl shadow-xl border border-border-main py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="px-4 py-2 border-b border-border-main flex justify-between items-center text-xs">
                    <span className="font-bold text-text-primary">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-bg-hover text-text-primary font-bold text-[9px] px-2 py-0.5 rounded-full font-mono">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-border-main">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => handleMarkNotificationRead(n.id)}
                        className={`p-3 text-xs text-text-secondary cursor-pointer hover:bg-bg-hover transition-colors flex gap-2.5 items-start ${!n.read ? 'bg-bg-hover/50' : ''}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${!n.read ? 'bg-accent-main' : 'bg-transparent'}`} />
                        <div className="flex-1">
                          <p className="font-bold text-text-primary">{n.title}</p>
                          <p className="text-[11px] text-text-secondary mt-0.5">{n.desc}</p>
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
              <div className="text-left hidden sm:block">
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
                  tasks={mergedTasks}
                  currentDate={currentCalendarDate}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  onToggleCell={handleToggleCell}
                  onToggleTaskCell={handleToggleTaskCell}
                  onDeleteHabit={handleDeleteHabit}
                  onDeleteTask={handleDeleteTask}
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
                        PRO TIP • TO DO LIST
                      </span>
                      <p className="font-semibold text-xs leading-relaxed text-stone-100">
                        {PRODUCTIVITY_TIPS[tipIndex]}
                      </p>
                      
                      <button
                        onClick={() => setTipIndex((tipIndex + 1) % PRODUCTIVITY_TIPS.length)}
                        className="text-[10px] text-stone-300 font-bold hover:text-stone-100 flex items-center gap-1 mt-2 cursor-pointer transition-colors"
                      >
                        Next Tip <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Sidebar Focus Panel */}
              <StatsView 
                habits={habits}
                tasks={mergedTasks}
                focusSessions={focusSessions}
                onAddFocusSession={handleAddFocusSession}
              />

              <div className="w-full lg:w-[320px] shrink-0">
                <TaskList 
                  tasks={mergedTasks}
                  activeDateString={getRelativeDateString(0)}
                  onToggleTask={handleToggleTask}
                  onAddTask={handleAddTask}
                  onDeleteTask={handleDeleteTask}
                />
              </div>

            </div>
          )}

          {activeTab === 'brain' && (
            <AIBrain 
              userId={currentUser.id}
              ideas={ideas}
              ideaLinks={ideaLinks}
              tasks={tasks}
              goals={goals}
              onSaveIdea={handleSaveIdea}
              onDeleteIdea={handleDeleteIdea}
              onSaveIdeaLink={handleSaveIdeaLink}
              onDeleteIdeaLink={handleDeleteIdeaLink}
              onAddTask={handleAddDirectTask}
              onAddGoal={handleAddProjectGoal}
              onRefreshData={() => loadUserData(currentUser.id)}
            />
          )}

          {activeTab === 'tracker' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs">
                <h2 className="font-bold text-base text-stone-950 mb-1.5">Detailed Habit Management</h2>
                <p className="text-xs text-stone-400 mb-6">Gain a deeper look into your tracked habits, adjust goals, or delete entries seamlessly.</p>
                
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
                            Delete Habit
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="bg-white p-2 rounded-lg border border-stone-100">
                            <p className="text-stone-400 font-medium text-[10px]">Completed</p>
                            <p className="font-bold text-stone-900 font-mono mt-0.5">{compCount}d</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-stone-100">
                            <p className="text-stone-400 font-medium text-[10px]">Half Completed</p>
                            <p className="font-bold text-stone-500 font-mono mt-0.5">{halfCount}d</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-stone-100">
                            <p className="text-stone-400 font-medium text-[10px]">Current Goal</p>
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
                  <h2 className="font-bold text-base text-stone-950 mb-1">Analytics & Advanced Charts</h2>
                  <p className="text-xs text-stone-400">Comprehensive review of your daily and weekly habits commitment with precise charts.</p>
                </div>

                {/* Simulated Interactive Line Graph of logs completions */}
                <div className="bg-stone-50 p-6 rounded-xl border border-stone-100 space-y-4">
                  <h3 className="text-xs font-bold text-stone-800">Habit Completion Rate over the Last 10 Days</h3>
                  
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
                    <span>Max Commitment (100%)</span>
                    <span>Average Completion Rate: 74%</span>
                  </div>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-100 rounded-xl text-xs text-stone-600 flex gap-2.5 items-start">
                  <Sparkles className="w-4 h-4 text-stone-900 shrink-0 mt-0.5" />
                  <p>
                    <strong>Smart Analytics Insight:</strong> Your data suggests a strong positive correlation between early morning study habits and evening gym consistency. Try stacking these habits together.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs">
                <h2 className="font-bold text-base text-stone-950 mb-1">Trophies & Achievements Vault</h2>
                <p className="text-xs text-stone-400 mb-6">Milestone rewards unlocked automatically when you reach outstanding streaks.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { title: 'First Steps', desc: 'Successfully complete your first habit entry.', unlocked: true },
                    { title: '7-Day Streak', desc: 'Maintain any habit for 7 consecutive days.', unlocked: true },
                    { title: 'Productivity King', desc: 'Reach a 12-day study habit streak.', unlocked: true },
                    { title: 'Consistency Builder', desc: 'Logged 5 habits with partial completion instead of skipping.', unlocked: true },
                    { title: 'Half-Year Milestone', desc: 'Maintain habits for an aggregate of 180 active days.', unlocked: false },
                    { title: 'Multi-Habit Pioneer', desc: 'Track and manage 6 active habits simultaneously.', unlocked: false },
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
                        {ach.unlocked ? 'Unlocked' : 'Locked'}
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
                <h2 className="font-bold text-base text-stone-900 mb-1">Archive & Log Book</h2>
                <p className="text-xs text-stone-400 mb-6">Review previously completed tasks or retrieve archived habits.</p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-xs text-stone-600 mb-2">Recently Completed Tasks:</h3>
                    <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 space-y-2.5">
                      {mergedTasks.filter(t => t.completed).map(t => (
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

          {activeTab === 'goals' && currentUser && (
            <SmartGoalPlanner 
              currentUser={currentUser}
              goals={goals}
              setGoals={setGoals}
              userRepository={userRepository}
            />
          )}

          {activeTab === 'profile' && currentUser && (
            <ProfileView 
              user={currentUser}
              userRepository={userRepository}
              onProfileUpdated={(updatedUser) => {
                setCurrentUser(updatedUser);
                setProfile({
                  name: updatedUser.fullName,
                  tagline: 'Elite To Do List Member',
                  avatar: updatedUser.avatarUrl || DEFAULT_AVATAR
                });
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onResetData={handleResetData}
              density={density}
              onToggleDensity={handleToggleDensity}
              rolloverMode={rolloverMode}
              onToggleRolloverMode={handleToggleRolloverMode}
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
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200/60 p-6 animate-in fade-in zoom-in-95 duration-150 text-left">
            <h3 className="font-bold text-sm text-stone-900 mb-3">To Do List Guide & Help</h3>
            <div className="space-y-2.5 text-xs text-stone-600 leading-relaxed">
              <p>📍 <strong>Interactive Habit Cell:</strong> Click directly on grid cells to log daily habit progress: Completed (checkmark), Missed (X), Half-completed (minus), or Empty (clear).</p>
              <p>📍 <strong>Focus Sessions & Intensity:</strong> Log deep study sessions or workouts by clicking directly on the intensity heatmap cells.</p>
              <p>📍 <strong>Data Backup & Synchronization:</strong> All your data is automatically synchronized locally. You can export or import JSON backups at any time via the Backup panel.</p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Got it, Close
            </button>
          </div>
        </div>
      )}

      {/* 4. Feedback Overlay dialog */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200/60 p-6 animate-in fade-in zoom-in-95 duration-150 text-left">
            <h3 className="font-bold text-sm text-stone-900 mb-2">Feedback & Suggestions</h3>
            <p className="text-xs text-stone-400 mb-4">We would love to hear your thoughts, feedback, or feature requests to make To Do List even better.</p>
            
            {feedbackSent ? (
              <div className="py-8 text-center text-xs text-stone-600 font-bold flex flex-col items-center gap-2">
                <Check className="w-8 h-8 p-1.5 bg-stone-100 rounded-full stroke-[3]" />
                <span>Thank you for your valuable feedback! We have recorded your submission.</span>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <textarea
                  required
                  placeholder="Type your message or feature request here..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full h-24 px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all text-left"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFeedback(false)}
                    className="flex-1 py-2 border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold text-xs rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
                  >
                    Submit Feedback
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
