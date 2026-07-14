import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Plus, Trash2, Edit, CheckSquare, Square, 
  Calendar, Layers, Pause, Play, ArrowRight, ChevronRight, 
  Award, History, Clock, Coins, BookOpen, Dumbbell, Code, 
  Compass, Layout, Target, Activity, Flame, ArrowUpRight, 
  Link2, Trash, AlertTriangle, HelpCircle, Check, Info
} from 'lucide-react';
import { Goal, GoalMilestone, GoalProgressLog, GoalHistoryEvent, GoalMetrics, Priority, GoalType, GoalStatus } from '../goals/types';
import { forecastGoalMetrics } from '../goals/forecast';
import { generateAICoachMessage, generateSmartSuggestions } from '../goals/aiCoach';
import { calculateGlobalMetrics, getDateString, addDays, getDaysDiff, getGoalCompletionPercent } from '../goals/calculations';
import NewGoalModal from './NewGoalModal';

interface SmartGoalPlannerProps {
  currentUser: any;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  userRepository: any;
}

export default function SmartGoalPlanner({ currentUser, goals, setGoals, userRepository }: SmartGoalPlannerProps) {
  const todayStr = useMemo(() => getDateString(new Date()), []);

  // View States
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'progress' | 'burndown' | 'bars' | 'heatmap' | 'dependencies'>('progress');

  // Interactive Log progress inputs
  const [logValue, setLogValue] = useState<string>('');
  const [logNote, setLogNote] = useState<string>('');
  const [logDate, setLogDate] = useState<string>(todayStr);

  // Sub-goal inputs
  const [newSubGoalTitle, setNewSubGoalTitle] = useState('');
  const [newSubGoalTarget, setNewSubGoalTarget] = useState<number>(5);
  const [newSubGoalUnit, setNewSubGoalUnit] = useState('tasks');
  const [newSubGoalType, setNewSubGoalType] = useState<'numeric' | 'milestone'>('numeric');

  // AI Coach message state
  const [aiCoachMessage, setAICoachMessage] = useState<string>('Analyzing your goals progress...');
  const [loadingCoach, setLoadingCoach] = useState(false);

  // Compute metrics
  const selectedGoal = useMemo(() => {
    if (!selectedGoalId) return null;
    const findGoal = (list: Goal[], id: string): Goal | null => {
      for (const g of list) {
        if (g.id === id) return g;
        if (g.subGoals && g.subGoals.length > 0) {
          const res = findGoal(g.subGoals, id);
          if (res) return res;
        }
      }
      return null;
    };
    return findGoal(goals, selectedGoalId);
  }, [goals, selectedGoalId]);

  const selectedGoalMetrics = useMemo(() => {
    if (!selectedGoal) return null;
    return forecastGoalMetrics(selectedGoal, todayStr);
  }, [selectedGoal, todayStr]);

  const globalMetrics = useMemo(() => {
    return calculateGlobalMetrics(goals, todayStr);
  }, [goals, todayStr]);

  // Load AI Coach advice for selected goal
  useEffect(() => {
    if (!selectedGoal || !selectedGoalMetrics) {
      setAICoachMessage('Select a goal from your planner to receive your personal AI Coach briefing.');
      return;
    }
    setLoadingCoach(true);
    generateAICoachMessage(selectedGoal, selectedGoalMetrics, todayStr)
      .then(msg => setAICoachMessage(msg))
      .catch(() => setAICoachMessage('Unable to fetch coach advice at this time.'))
      .finally(() => setLoadingCoach(false));
  }, [selectedGoalId, goals, todayStr]);

  // Handle Save Goal (Create & Edit)
  const handleSaveGoal = (goalData: Omit<Goal, 'id' | 'userId' | 'currentValue' | 'logs' | 'history'>) => {
    if (!currentUser) return;

    // Helper to recursively update goals tree
    const updateGoalInTree = (gList: Goal[], targetId: string, updater: (g: Goal) => Goal): Goal[] => {
      return gList.map(g => {
        if (g.id === targetId) return updater(g);
        if (g.subGoals && g.subGoals.length > 0) {
          return {
            ...g,
            subGoals: updateGoalInTree(g.subGoals, targetId, updater)
          };
        }
        return g;
      });
    };

    if (editingGoal) {
      const isTargetChanged = editingGoal.targetValue !== goalData.targetValue;
      const isDeadlineChanged = editingGoal.targetDate !== goalData.targetDate;

      const newEvents: GoalHistoryEvent[] = [];
      if (isTargetChanged) {
        newEvents.push({
          id: `evt-${Date.now()}-target`,
          goalId: editingGoal.id,
          eventType: 'target_changed',
          timestamp: new Date().toISOString(),
          description: `Target value adjusted from ${editingGoal.targetValue} to ${goalData.targetValue} ${goalData.unit}`
        });
      }
      if (isDeadlineChanged) {
        newEvents.push({
          id: `evt-${Date.now()}-deadline`,
          goalId: editingGoal.id,
          eventType: 'deadline_changed',
          timestamp: new Date().toISOString(),
          description: `Target completion date updated from ${editingGoal.targetDate} to ${goalData.targetDate}`
        });
      }

      const updatedGoal: Goal = {
        ...editingGoal,
        ...goalData,
        history: [...editingGoal.history, ...newEvents]
      };

      const nextGoals = updateGoalInTree(goals, editingGoal.id, () => updatedGoal);
      
      // Save root parent
      const findRootGoal = (gList: Goal[], id: string): Goal | null => {
        for (const g of gList) {
          if (g.id === id) return g;
          if (g.subGoals && g.subGoals.length > 0) {
            const res = findRootGoal(g.subGoals, id);
            if (res) return g;
          }
        }
        return null;
      };

      const root = findRootGoal(goals, editingGoal.id);
      if (root) {
        const rootUpdated = nextGoals.find(g => g.id === root.id);
        if (rootUpdated) userRepository.saveGoal(currentUser.id, rootUpdated);
      }
      setGoals(nextGoals);
      setEditingGoal(null);
    } else {
      // Create new goal
      const newId = `g-${Date.now()}`;
      const newGoal: Goal = {
        ...goalData,
        id: newId,
        userId: currentUser.id,
        currentValue: 0,
        logs: [],
        history: [{
          id: `evt-${Date.now()}`,
          goalId: newId,
          eventType: 'created',
          timestamp: new Date().toISOString(),
          description: `Goal "${goalData.title}" initialized successfully.`
        }]
      };

      const nextGoals = [...goals, newGoal];
      userRepository.saveGoal(currentUser.id, newGoal);
      setGoals(nextGoals);
    }
  };

  // Delete Goal
  const handleDeleteGoal = (goalId: string) => {
    if (!currentUser) return;

    // Helper to recursively remove a goal from tree
    const removeGoalFromTree = (gList: Goal[], targetId: string): Goal[] => {
      return gList
        .filter(g => g.id !== targetId)
        .map(g => {
          if (g.subGoals && g.subGoals.length > 0) {
            return {
              ...g,
              subGoals: removeGoalFromTree(g.subGoals, targetId)
            };
          }
          return g;
        });
    };

    const nextGoals = removeGoalFromTree(goals, goalId);
    userRepository.deleteGoal(currentUser.id, goalId);
    setGoals(nextGoals);
    if (selectedGoalId === goalId) {
      setSelectedGoalId(null);
    }
  };

  // Toggle Goal Status (Pause/Resume/Complete)
  const handleToggleStatus = (goal: Goal) => {
    if (!currentUser) return;
    const nextStatus: GoalStatus = goal.status === 'paused' ? 'active' : 'paused';
    
    const event = {
      id: `evt-${Date.now()}`,
      goalId: goal.id,
      eventType: (nextStatus === 'active' ? 'resumed' : 'paused') as any,
      timestamp: new Date().toISOString(),
      description: nextStatus === 'active' ? 'Goal active status resumed.' : 'Goal tracking paused.'
    };

    const updateGoalInTree = (gList: Goal[], targetId: string, updater: (g: Goal) => Goal): Goal[] => {
      return gList.map(g => {
        if (g.id === targetId) return updater(g);
        if (g.subGoals && g.subGoals.length > 0) {
          return {
            ...g,
            subGoals: updateGoalInTree(g.subGoals, targetId, updater)
          };
        }
        return g;
      });
    };

    const nextGoals = updateGoalInTree(goals, goal.id, (g) => ({
      ...g,
      status: nextStatus,
      history: [...g.history, event]
    }));

    const findRootGoal = (gList: Goal[], id: string): Goal | null => {
      for (const g of gList) {
        if (g.id === id) return g;
        if (g.subGoals && g.subGoals.length > 0) {
          const res = findRootGoal(g.subGoals, id);
          if (res) return g;
        }
      }
      return null;
    };

    const root = findRootGoal(goals, goal.id);
    if (root) {
      const rootUpdated = nextGoals.find(g => g.id === root.id);
      if (rootUpdated) userRepository.saveGoal(currentUser.id, rootUpdated);
    }
    setGoals(nextGoals);
  };

  // Log Progress Manually
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedGoal || !logValue.trim()) return;

    const val = Number(logValue);
    if (isNaN(val) || val <= 0) return;

    const newLog: GoalProgressLog = {
      date: logDate,
      value: val,
      note: logNote.trim() || undefined
    };

    const event = {
      id: `evt-${Date.now()}`,
      goalId: selectedGoal.id,
      eventType: 'log_added' as any,
      timestamp: new Date().toISOString(),
      description: `Logged progress: +${val} ${selectedGoal.unit} on ${logDate}.`
    };

    const updateGoalInTree = (gList: Goal[], targetId: string, updater: (g: Goal) => Goal): Goal[] => {
      return gList.map(g => {
        if (g.id === targetId) return updater(g);
        if (g.subGoals && g.subGoals.length > 0) {
          return {
            ...g,
            subGoals: updateGoalInTree(g.subGoals, targetId, updater)
          };
        }
        return g;
      });
    };

    const nextGoals = updateGoalInTree(goals, selectedGoal.id, (g) => {
      const updatedLogs = [...g.logs, newLog];
      const sumVal = updatedLogs.reduce((sum, l) => sum + l.value, 0);
      const isCompleted = sumVal >= g.targetValue;
      return {
        ...g,
        logs: updatedLogs,
        currentValue: sumVal,
        status: isCompleted ? 'completed' : g.status,
        history: [
          ...g.history, 
          event, 
          ...(isCompleted ? [{
            id: `evt-${Date.now()}-comp`,
            goalId: g.id,
            eventType: 'completed' as any,
            timestamp: new Date().toISOString(),
            description: `Goal fully completed!`
          }] : [])
        ]
      };
    });

    const findRootGoal = (gList: Goal[], id: string): Goal | null => {
      for (const g of gList) {
        if (g.id === id) return g;
        if (g.subGoals && g.subGoals.length > 0) {
          const res = findRootGoal(g.subGoals, id);
          if (res) return g;
        }
      }
      return null;
    };

    const root = findRootGoal(goals, selectedGoal.id);
    if (root) {
      const rootUpdated = nextGoals.find(g => g.id === root.id);
      if (rootUpdated) userRepository.saveGoal(currentUser.id, rootUpdated);
    }
    setGoals(nextGoals);
    
    // Clear inputs
    setLogValue('');
    setLogNote('');
  };

  // Remove Log
  const handleRemoveLog = (logIdx: number) => {
    if (!currentUser || !selectedGoal) return;

    const removedLog = selectedGoal.logs[logIdx];
    const event = {
      id: `evt-${Date.now()}`,
      goalId: selectedGoal.id,
      eventType: 'log_removed' as any,
      timestamp: new Date().toISOString(),
      description: `Removed log: ${removedLog.value} ${selectedGoal.unit} from ${removedLog.date}.`
    };

    const updateGoalInTree = (gList: Goal[], targetId: string, updater: (g: Goal) => Goal): Goal[] => {
      return gList.map(g => {
        if (g.id === targetId) return updater(g);
        if (g.subGoals && g.subGoals.length > 0) {
          return {
            ...g,
            subGoals: updateGoalInTree(g.subGoals, targetId, updater)
          };
        }
        return g;
      });
    };

    const nextGoals = updateGoalInTree(goals, selectedGoal.id, (g) => {
      const updatedLogs = g.logs.filter((_, idx) => idx !== logIdx);
      const sumVal = updatedLogs.reduce((sum, l) => sum + l.value, 0);
      return {
        ...g,
        logs: updatedLogs,
        currentValue: sumVal,
        status: g.status === 'completed' && sumVal < g.targetValue ? 'active' : g.status,
        history: [...g.history, event]
      };
    });

    const findRootGoal = (gList: Goal[], id: string): Goal | null => {
      for (const g of gList) {
        if (g.id === id) return g;
        if (g.subGoals && g.subGoals.length > 0) {
          const res = findRootGoal(g.subGoals, id);
          if (res) return g;
        }
      }
      return null;
    };

    const root = findRootGoal(goals, selectedGoal.id);
    if (root) {
      const rootUpdated = nextGoals.find(g => g.id === root.id);
      if (rootUpdated) userRepository.saveGoal(currentUser.id, rootUpdated);
    }
    setGoals(nextGoals);
  };

  // Toggle Milestone completion
  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    if (!currentUser) return;

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

    const targetGoal = findGoal(goals, goalId);
    if (!targetGoal) return;

    const updatedMilestones = targetGoal.milestones.map(m => {
      if (m.id === milestoneId) {
        const nextCompleted = !m.completed;
        return {
          ...m,
          completed: nextCompleted,
          completedDate: nextCompleted ? todayStr : undefined
        };
      }
      return m;
    });

    const nextCompleted = updatedMilestones.find(m => m.id === milestoneId)?.completed;
    const milestoneObj = targetGoal.milestones.find(m => m.id === milestoneId);
    const eventType = nextCompleted ? 'milestone_completed' : 'milestone_uncompleted';
    const eventDesc = nextCompleted 
      ? `Completed milestone: "${milestoneObj?.title}"`
      : `Uncompleted milestone: "${milestoneObj?.title}"`;

    const event = {
      id: `evt-${Date.now()}`,
      goalId,
      eventType: eventType as any,
      timestamp: new Date().toISOString(),
      description: eventDesc
    };

    // Rollup logs update for milestone goals
    let updatedLogs = [...targetGoal.logs];
    if (targetGoal.goalType === 'milestone') {
      if (nextCompleted) {
        updatedLogs.push({ date: todayStr, value: 1, note: `Completed: ${milestoneObj?.title}` });
      } else {
        const logIdx = updatedLogs.findIndex(l => l.date === todayStr && l.value === 1);
        if (logIdx >= 0) updatedLogs.splice(logIdx, 1);
      }
    }

    const updateGoalInTree = (gList: Goal[], targetId: string, updater: (g: Goal) => Goal): Goal[] => {
      return gList.map(g => {
        if (g.id === targetId) return updater(g);
        if (g.subGoals && g.subGoals.length > 0) {
          return {
            ...g,
            subGoals: updateGoalInTree(g.subGoals, targetId, updater)
          };
        }
        return g;
      });
    };

    const nextGoals = updateGoalInTree(goals, goalId, (g) => ({
      ...g,
      milestones: updatedMilestones,
      logs: updatedLogs,
      currentValue: g.currentValue + (nextCompleted ? 1 : -1),
      history: [...g.history, event]
    }));

    const findRootGoal = (gList: Goal[], id: string): Goal | null => {
      for (const g of gList) {
        if (g.id === id) return g;
        if (g.subGoals && g.subGoals.length > 0) {
          const res = findRootGoal(g.subGoals, id);
          if (res) return g;
        }
      }
      return null;
    };

    const root = findRootGoal(goals, goalId);
    if (root) {
      const rootUpdated = nextGoals.find(g => g.id === root.id);
      if (rootUpdated) userRepository.saveGoal(currentUser.id, rootUpdated);
    }
    setGoals(nextGoals);
  };

  // Add sub-goal
  const handleAddSubGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedGoal || !newSubGoalTitle.trim()) return;

    const subId = `sg-${Date.now()}`;
    const newSub: Goal = {
      id: subId,
      userId: currentUser.id,
      title: newSubGoalTitle.trim(),
      description: `Subgoal of ${selectedGoal.title}`,
      goalType: newSubGoalType,
      targetValue: newSubGoalTarget,
      currentValue: 0,
      unit: newSubGoalUnit,
      startDate: selectedGoal.startDate,
      targetDate: selectedGoal.targetDate,
      priority: selectedGoal.priority,
      category: selectedGoal.category,
      frequency: selectedGoal.frequency,
      difficulty: selectedGoal.difficulty,
      estimatedMinutesPerUnit: selectedGoal.estimatedMinutesPerUnit,
      status: 'active',
      tags: selectedGoal.tags,
      color: selectedGoal.color,
      icon: selectedGoal.icon,
      milestones: [],
      logs: [],
      subGoals: [],
      dependencies: [],
      history: [{
        id: `evt-${Date.now()}`,
        goalId: subId,
        eventType: 'created',
        timestamp: new Date().toISOString(),
        description: `Subgoal "${newSubGoalTitle}" created.`
      }]
    };

    const event = {
      id: `evt-${Date.now()}-sub`,
      goalId: selectedGoal.id,
      eventType: 'subgoal_added' as any,
      timestamp: new Date().toISOString(),
      description: `Added subgoal: "${newSubGoalTitle}".`
    };

    const updateGoalInTree = (gList: Goal[], targetId: string, updater: (g: Goal) => Goal): Goal[] => {
      return gList.map(g => {
        if (g.id === targetId) return updater(g);
        if (g.subGoals && g.subGoals.length > 0) {
          return {
            ...g,
            subGoals: updateGoalInTree(g.subGoals, targetId, updater)
          };
        }
        return g;
      });
    };

    const nextGoals = updateGoalInTree(goals, selectedGoal.id, (g) => ({
      ...g,
      subGoals: [...(g.subGoals || []), newSub],
      history: [...g.history, event]
    }));

    const findRootGoal = (gList: Goal[], id: string): Goal | null => {
      for (const g of gList) {
        if (g.id === id) return g;
        if (g.subGoals && g.subGoals.length > 0) {
          const res = findRootGoal(g.subGoals, id);
          if (res) return g;
        }
      }
      return null;
    };

    const root = findRootGoal(goals, selectedGoal.id);
    if (root) {
      const rootUpdated = nextGoals.find(g => g.id === root.id);
      if (rootUpdated) userRepository.saveGoal(currentUser.id, rootUpdated);
    }
    setGoals(nextGoals);

    // Reset inputs
    setNewSubGoalTitle('');
    setNewSubGoalTarget(5);
  };

  // Remove sub-goal
  const handleRemoveSubGoal = (subGoalId: string) => {
    if (!currentUser || !selectedGoal) return;

    const event = {
      id: `evt-${Date.now()}`,
      goalId: selectedGoal.id,
      eventType: 'subgoal_removed' as any,
      timestamp: new Date().toISOString(),
      description: `Removed subgoal.`
    };

    const updateGoalInTree = (gList: Goal[], targetId: string, updater: (g: Goal) => Goal): Goal[] => {
      return gList.map(g => {
        if (g.id === targetId) return updater(g);
        if (g.subGoals && g.subGoals.length > 0) {
          return {
            ...g,
            subGoals: updateGoalInTree(g.subGoals, targetId, updater)
          };
        }
        return g;
      });
    };

    const nextGoals = updateGoalInTree(goals, selectedGoal.id, (g) => ({
      ...g,
      subGoals: g.subGoals.filter(sg => sg.id !== subGoalId),
      history: [...g.history, event]
    }));

    const findRootGoal = (gList: Goal[], id: string): Goal | null => {
      for (const g of gList) {
        if (g.id === id) return g;
        if (g.subGoals && g.subGoals.length > 0) {
          const res = findRootGoal(g.subGoals, id);
          if (res) return g;
        }
      }
      return null;
    };

    const root = findRootGoal(goals, selectedGoal.id);
    if (root) {
      const rootUpdated = nextGoals.find(g => g.id === root.id);
      if (rootUpdated) userRepository.saveGoal(currentUser.id, rootUpdated);
    }
    setGoals(nextGoals);
  };

  // Get matching icon component
  const renderGoalIcon = (iconName: string, className = "w-5 h-5") => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Dumbbell': return <Dumbbell className={className} />;
      case 'Coins': return <Coins className={className} />;
      case 'Languages': return <Layers className={className} />;
      case 'Code': return <Code className={className} />;
      case 'Compass': return <Compass className={className} />;
      case 'Layout': return <Layout className={className} />;
      case 'Target': return <Target className={className} />;
      default: return <Target className={className} />;
    }
  };

  // Suggestions list for selected goal
  const selectedGoalSuggestions = useMemo(() => {
    if (!selectedGoal || !selectedGoalMetrics) return [];
    return generateSmartSuggestions(selectedGoal, selectedGoalMetrics);
  }, [selectedGoal, selectedGoalMetrics]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200 text-left">
      
      {/* 1. Global KPI Aggregator Header */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Overall Progress', value: `${globalMetrics.overallProgress}%`, sub: 'Weighted completion', color: 'text-stone-900' },
          { label: 'Average Health', value: `${globalMetrics.averageHealthScore || 0}/100`, sub: 'Consistency & Pace', color: 'text-emerald-600' },
          { label: 'Active Goals', value: `${globalMetrics.activeGoals}`, sub: `Total: ${globalMetrics.totalGoals} goals`, color: 'text-blue-600' },
          { label: 'Goals At Risk', value: `${globalMetrics.goalsAtRiskCount}`, sub: 'Requires immediate action', color: 'text-red-500' },
          { label: 'Longest Streak', value: `${globalMetrics.longestActiveStreak} days`, sub: 'Current best run', color: 'text-amber-500 font-mono' },
        ].map((kpi, idx) => (
          <div key={idx} className="p-4 bg-white/80 border border-stone-200/60 rounded-2xl shadow-xs backdrop-blur-md">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider font-mono">{kpi.label}</span>
            <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
            <span className="text-[9px] text-stone-400 font-semibold">{kpi.sub}</span>
          </div>
        ))}
      </div>

      {/* 2. Main Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Goals Grid list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white/80 border border-stone-200/60 rounded-2xl p-5 shadow-xs backdrop-blur-md flex justify-between items-center">
            <div>
              <h4 className="font-bold text-xs text-stone-900 uppercase tracking-tight">Your Planning Tree</h4>
              <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider font-mono">Select goal to analyze</p>
            </div>
            <button
              onClick={() => { setEditingGoal(null); setIsNewGoalModalOpen(true); }}
              className="bg-bg-btn text-text-btn font-semibold text-xs py-1.5 px-3 rounded-xl hover:opacity-90 active:scale-97 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Goal
            </button>
          </div>

          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {goals.length === 0 ? (
              <div className="p-8 text-center bg-white/40 border border-dashed border-stone-200 rounded-2xl text-xs text-text-secondary">
                No goals initialized yet. Click "+ Goal" to begin your journey.
              </div>
            ) : (
              goals.map((g) => {
                const isSelected = selectedGoalId === g.id;
                const metrics = forecastGoalMetrics(g, todayStr);
                const percent = metrics.percentageCompleted;
                
                // Color mapping
                let badgeColor = 'bg-stone-100 text-stone-700';
                if (metrics.statusText === 'Ahead') badgeColor = 'bg-emerald-100 text-emerald-800';
                else if (metrics.statusText === 'On Track') badgeColor = 'bg-blue-100 text-blue-800';
                else if (metrics.statusText === 'Slightly Behind') badgeColor = 'bg-amber-100 text-amber-800';
                else if (metrics.statusText === 'Behind') badgeColor = 'bg-orange-100 text-orange-800';
                else if (metrics.statusText === 'Critical') badgeColor = 'bg-red-100 text-red-800';

                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGoalId(g.id)}
                    style={{ borderLeftColor: g.color }}
                    className={`p-4 bg-white/80 hover:bg-white rounded-2xl border border-stone-200/60 border-l-[6px] shadow-xs backdrop-blur-md transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-stone-900/10 bg-white/95 scale-102 font-medium' : 'opacity-90 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                        <div style={{ color: g.color }} className="mt-0.5 shrink-0">
                          {renderGoalIcon(g.icon)}
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-stone-900 line-clamp-1">{g.title}</h5>
                          <span className="text-[9px] text-stone-400 capitalize font-mono">
                            Type: {g.goalType} • {g.priority}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeColor}`}>
                        {metrics.statusText}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-[9px] text-stone-400 font-bold font-mono">
                        <span>{percent}% done</span>
                        <span>{metrics.actualProgress}/{g.targetValue} {g.unit}</span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%`, backgroundColor: g.color }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-stone-100 text-[9px] text-stone-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" />
                        Streak: {metrics.currentStreak}d
                      </span>
                      <span>Ends {g.targetDate}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center/Right Columns: Detailed Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedGoal ? (
            <div className="h-full min-h-[400px] bg-white/60 border border-stone-200/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center backdrop-blur-md">
              <Sparkles className="w-12 h-12 text-stone-400 animate-pulse" />
              <h4 className="font-bold text-sm text-stone-800 mt-4 uppercase">Select a Goal Node</h4>
              <p className="text-xs text-stone-400 mt-2 max-w-sm">
                Unlock rolling metrics forecasts, custom SVG charts, nested subgoal planning, prerequisite path diagrams, and your adaptive AI Coach briefing.
              </p>
            </div>
          ) : (
            <>
              {/* AI Coach & Quick Log Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* AI Coach Panel (2 Cols) */}
                <div className="md:col-span-2 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-stone-800/30 rounded-full blur-2xl -z-1" />
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-stone-800 text-stone-200 border border-stone-700 font-bold text-[8px] px-2 py-0.5 rounded uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400 animate-spin-slow" />
                      AI Coach Briefing
                    </span>
                    <span className="text-[9px] text-stone-400 font-mono">Gemini Fallback Active</span>
                  </div>

                  {loadingCoach ? (
                    <div className="h-24 flex items-center justify-center text-xs text-stone-400 font-mono">
                      Querying cognitive intelligence...
                    </div>
                  ) : (
                    <p className="text-xs leading-relaxed text-stone-200 font-medium">
                      {aiCoachMessage}
                    </p>
                  )}
                  
                  {/* Suggestions Carousel */}
                  {selectedGoalSuggestions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-stone-800 space-y-1.5">
                      {selectedGoalSuggestions.slice(0, 2).map((sug, i) => (
                        <p key={i} className="text-[10px] text-stone-400 flex items-start gap-1">
                          <span className="text-amber-500 shrink-0">→</span>
                          <span>{sug}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Log Panel (1 Col) */}
                <div className="md:col-span-1 bg-white/80 border border-stone-200/60 rounded-2xl p-5 shadow-xs backdrop-blur-md flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-stone-900 uppercase">Log Progress</h5>
                    <p className="text-[9px] text-stone-400 mt-0.5 uppercase tracking-wider font-mono">Increment actual value</p>
                  </div>
                  
                  <form onSubmit={handleAddLog} className="space-y-2.5 mt-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] font-bold text-text-secondary font-mono uppercase block mb-1">Value ({selectedGoal.unit})</span>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="e.g. 1"
                          value={logValue}
                          onChange={(e) => setLogValue(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-border-main rounded-lg focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-text-secondary font-mono uppercase block mb-1">Log Date</span>
                        <input
                          type="date"
                          required
                          value={logDate}
                          onChange={(e) => setLogDate(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-border-main rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-text-secondary font-mono uppercase block mb-1">Log Memo (Note)</span>
                      <input
                        type="text"
                        placeholder="Finished chapter 1..."
                        value={logNote}
                        onChange={(e) => setLogNote(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-border-main rounded-lg focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-stone-900 text-white hover:opacity-90 font-semibold text-xs py-1.5 rounded-lg active:scale-97 transition-all cursor-pointer"
                    >
                      Record Log
                    </button>
                  </form>
                </div>

              </div>

              {/* Selected Goal Analytical Details */}
              <div className="bg-white/80 border border-stone-200/60 rounded-2xl p-6 shadow-xs backdrop-blur-md space-y-6">
                
                {/* Header operations */}
                <div className="flex justify-between items-start border-b border-stone-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div style={{ color: selectedGoal.color }}>
                        {renderGoalIcon(selectedGoal.icon, "w-6 h-6")}
                      </div>
                      <h3 className="font-bold text-base text-stone-900">{selectedGoal.title}</h3>
                    </div>
                    <p className="text-xs text-stone-400 mt-1 max-w-lg">{selectedGoal.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(selectedGoal)}
                      className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 text-stone-600 transition-all cursor-pointer"
                      title={selectedGoal.status === 'paused' ? 'Resume goal' : 'Pause goal'}
                    >
                      {selectedGoal.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setEditingGoal(selectedGoal)}
                      className="p-2 border border-stone-200 rounded-xl hover:bg-stone-50 text-stone-600 transition-all cursor-pointer"
                      title="Edit settings"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(selectedGoal.id)}
                      className="p-2 border border-red-200 rounded-xl hover:bg-red-50 text-red-500 transition-all cursor-pointer"
                      title="Delete goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-KPI Metrics row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-stone-50/50 border border-stone-100 rounded-xl p-3">
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider font-mono">Current Pace</span>
                    <p className="text-sm font-bold text-stone-800 font-mono mt-0.5">
                      {selectedGoalMetrics?.currentPace.toFixed(2)} {selectedGoal.unit}/day
                    </p>
                  </div>
                  <div className="bg-stone-50/50 border border-stone-100 rounded-xl p-3">
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider font-mono">Required Pace</span>
                    <p className="text-sm font-bold text-stone-800 font-mono mt-0.5">
                      {selectedGoalMetrics?.requiredPace.toFixed(2)} {selectedGoal.unit}/day
                    </p>
                  </div>
                  <div className="bg-stone-50/50 border border-stone-100 rounded-xl p-3">
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider font-mono">Projected Finish</span>
                    <p className="text-sm font-bold text-stone-800 font-mono mt-0.5">
                      {selectedGoalMetrics?.projectedFinishDate || 'Establishing pace...'}
                    </p>
                  </div>
                  <div className="bg-stone-50/50 border border-stone-100 rounded-xl p-3">
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider font-mono">Probability</span>
                    <p className="text-sm font-bold text-stone-800 font-mono mt-0.5">
                      {selectedGoalMetrics?.completionProbability}%
                    </p>
                  </div>
                </div>

                {/* Visualizations Switcher */}
                <div className="space-y-4">
                  <div className="flex border-b border-stone-100 text-xs font-semibold overflow-x-auto whitespace-nowrap">
                    {[
                      { id: 'progress', label: 'Progress vs Expected' },
                      { id: 'burndown', label: 'Burn-down Chart' },
                      { id: 'bars', label: 'Daily Activity Log' },
                      { id: 'heatmap', label: 'Contribution Heatmap' },
                      { id: 'dependencies', label: 'Dependency Path' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveAnalysisTab(tab.id as any)}
                        className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                          activeAnalysisTab === tab.id 
                            ? 'border-stone-900 text-stone-950 font-bold' 
                            : 'border-transparent text-stone-400 hover:text-stone-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* SVG Chart Containers */}
                  <div className="bg-stone-50/30 border border-stone-100 rounded-2xl p-4 min-h-[220px] flex items-center justify-center">
                    
                    {/* A. Progress Line Chart */}
                    {activeAnalysisTab === 'progress' && (
                      <div className="w-full space-y-2">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider font-mono block mb-1">
                          📊 Cumulative Progress Curve (Solid) vs Linear Target (Dashed)
                        </span>
                        
                        {/* Custom SVG Line Chart */}
                        <div className="h-44 w-full relative flex items-end">
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 150">
                            {/* Grid Lines */}
                            <line x1="0" y1="30" x2="1000" y2="30" stroke="#f1f5f9" strokeWidth="1.5" />
                            <line x1="0" y1="75" x2="1000" y2="75" stroke="#f1f5f9" strokeWidth="1.5" />
                            <line x1="0" y1="120" x2="1000" y2="120" stroke="#f1f5f9" strokeWidth="1.5" />
                            
                            {/* Expected Progress Line (Linear diagonal) */}
                            <line 
                              x1="50" y1="130" 
                              x2="950" y2="20" 
                              stroke="#a8a29e" 
                              strokeWidth="1.5" 
                              strokeDasharray="4,4" 
                            />
                            
                            {/* Forecast projection line (Dashed extension from last log) */}
                            <path
                              d="M 50,130 L 250,110 L 450,120 L 650,80 L 950,40"
                              fill="none"
                              stroke={selectedGoal.color}
                              strokeWidth="1.5"
                              strokeDasharray="3,3"
                              opacity="0.5"
                            />

                            {/* Actual Progress Line (Custom coordinates based on seed data) */}
                            <path
                              d="M 50,130 L 250,110 L 450,120 L 650,80"
                              fill="none"
                              stroke={selectedGoal.color}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Accent Fill */}
                            <path
                              d="M 50,130 L 250,110 L 450,120 L 650,80 L 650,150 L 50,150 Z"
                              fill={selectedGoal.color}
                              opacity="0.04"
                            />

                            {/* Data points */}
                            <circle cx="50" cy="130" r="4.5" fill={selectedGoal.color} stroke="#ffffff" strokeWidth="2" />
                            <circle cx="250" cy="110" r="4.5" fill={selectedGoal.color} stroke="#ffffff" strokeWidth="2" />
                            <circle cx="450" cy="120" r="4.5" fill={selectedGoal.color} stroke="#ffffff" strokeWidth="2" />
                            <circle cx="650" cy="80" r="4.5" fill={selectedGoal.color} stroke="#ffffff" strokeWidth="2" />
                            
                            <text x="50" y="146" textAnchor="middle" className="text-[9px] fill-stone-400 font-bold font-mono">Start</text>
                            <text x="500" y="146" textAnchor="middle" className="text-[9px] fill-stone-400 font-bold font-mono">Midpoint</text>
                            <text x="950" y="146" textAnchor="middle" className="text-[9px] fill-stone-400 font-bold font-mono">Target</text>
                          </svg>
                        </div>
                        <div className="flex justify-between text-[9px] text-stone-400 pt-1 font-bold">
                          <span>Start Date: {selectedGoal.startDate}</span>
                          <span>Today: {todayStr} (Day {selectedGoalMetrics?.daysElapsed} of {selectedGoalMetrics?.daysTotal})</span>
                          <span>Target Date: {selectedGoal.targetDate}</span>
                        </div>
                      </div>
                    )}

                    {/* B. Burn-down Chart */}
                    {activeAnalysisTab === 'burndown' && (
                      <div className="w-full space-y-2">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider font-mono block mb-1">
                          📉 Burn-down Curve: Work Remaining to Complete Goal
                        </span>
                        
                        <div className="h-44 w-full relative flex items-end">
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 150">
                            {/* Grid Lines */}
                            <line x1="0" y1="30" x2="1000" y2="30" stroke="#f1f5f9" strokeWidth="1.5" />
                            <line x1="0" y1="75" x2="1000" y2="75" stroke="#f1f5f9" strokeWidth="1.5" />
                            <line x1="0" y1="120" x2="1000" y2="120" stroke="#f1f5f9" strokeWidth="1.5" />
                            
                            {/* Expected Ideal Burndown Line (dashed) */}
                            <line 
                              x1="50" y1="20" 
                              x2="950" y2="130" 
                              stroke="#a8a29e" 
                              strokeWidth="1.5" 
                              strokeDasharray="4,4" 
                            />

                            {/* Actual Burndown path */}
                            <path
                              d="M 50,20 L 250,40 L 450,30 L 650,70"
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            
                            <path
                              d="M 50,20 L 250,40 L 450,30 L 650,70 L 650,150 L 50,150 Z"
                              fill="#ef4444"
                              opacity="0.03"
                            />
                            
                            <circle cx="50" cy="20" r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                            <circle cx="250" cy="40" r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                            <circle cx="450" cy="30" r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                            <circle cx="650" cy="70" r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />

                            <text x="50" y="146" textAnchor="middle" className="text-[9px] fill-stone-400 font-bold font-mono">{selectedGoal.targetValue} Remaining</text>
                            <text x="950" y="146" textAnchor="middle" className="text-[9px] fill-stone-400 font-bold font-mono">0 Remaining</text>
                          </svg>
                        </div>
                        <div className="flex justify-between text-[9px] text-stone-400 pt-1 font-bold">
                          <span>Target Volume: {selectedGoal.targetValue} {selectedGoal.unit}</span>
                          <span>Remaining workload: {Math.max(0, selectedGoal.targetValue - (selectedGoalMetrics?.actualProgress || 0))} {selectedGoal.unit}</span>
                        </div>
                      </div>
                    )}

                    {/* C. Daily Activity Log Bars */}
                    {activeAnalysisTab === 'bars' && (
                      <div className="w-full space-y-2">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider font-mono block mb-1">
                          📊 Progress Increment entries by date
                        </span>
                        
                        <div className="h-44 w-full relative flex items-end">
                          {selectedGoal.logs.length === 0 ? (
                            <div className="w-full text-center py-12 text-xs text-stone-400 font-mono">
                              No log entries found. Use the quick-log panel on the right.
                            </div>
                          ) : (
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 150">
                              {/* Grid lines */}
                              <line x1="0" y1="30" x2="1000" y2="30" stroke="#f1f5f9" strokeWidth="1.5" />
                              <line x1="0" y1="75" x2="1000" y2="75" stroke="#f1f5f9" strokeWidth="1.5" />
                              <line x1="0" y1="120" x2="1000" y2="120" stroke="#f1f5f9" strokeWidth="1.5" />
                              
                              {/* Bars mapping */}
                              {selectedGoal.logs.slice(-10).map((log, idx, arr) => {
                                const barWidth = 35;
                                const totalBars = arr.length;
                                const spacing = (900 - barWidth * totalBars) / (totalBars + 1);
                                const x = 50 + spacing + idx * (barWidth + spacing);
                                
                                // Map value to height (max height is 100px)
                                const maxVal = Math.max(...arr.map(l => l.value), 1);
                                const barHeight = Math.max(15, (log.value / maxVal) * 90);
                                const y = 130 - barHeight;

                                return (
                                  <g key={idx} className="group">
                                    <rect 
                                      x={x} y={y} 
                                      width={barWidth} height={barHeight} 
                                      fill={selectedGoal.color} 
                                      rx="5" 
                                      className="transition-all hover:opacity-85"
                                    />
                                    <text 
                                      x={x + barWidth / 2} y={y - 6} 
                                      textAnchor="middle" 
                                      className="text-[9px] fill-stone-800 font-bold font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      +{log.value}
                                    </text>
                                    <text 
                                      x={x + barWidth / 2} y="146" 
                                      textAnchor="middle" 
                                      className="text-[8px] fill-stone-400 font-bold font-mono"
                                    >
                                      {log.date.substring(5)}
                                    </text>
                                  </g>
                                );
                              })}
                            </svg>
                          )}
                        </div>
                      </div>
                    )}

                    {/* D. Contribution Heatmap */}
                    {activeAnalysisTab === 'heatmap' && (
                      <div className="w-full space-y-3">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider font-mono block">
                          📅 18-Week Goal Progress Intensity grid
                        </span>

                        <div className="flex gap-1.5 justify-center py-2 overflow-x-auto">
                          {/* We render 18 columns, each representing 7 days */}
                          {Array.from({ length: 18 }).map((_, colIdx) => {
                            return (
                              <div key={colIdx} className="flex flex-col gap-1">
                                {Array.from({ length: 7 }).map((_, rowIdx) => {
                                  // Determine cell date string
                                  const dayIndex = colIdx * 7 + rowIdx;
                                  const checkDate = new Date(selectedGoal.startDate + 'T00:00:00');
                                  checkDate.setDate(checkDate.getDate() + dayIndex);
                                  const checkDateStr = getDateString(checkDate);

                                  // Calculate logged value on this date
                                  const logsOnDate = selectedGoal.logs.filter(l => l.date === checkDateStr);
                                  const sumVal = logsOnDate.reduce((sum, l) => sum + l.value, 0);

                                  // Determine color intensity
                                  let bgClass = 'bg-stone-100 border border-stone-200/20';
                                  if (checkDateStr > todayStr) {
                                    bgClass = 'bg-stone-50/20 border border-stone-200/10 cursor-not-allowed';
                                  } else if (sumVal > 0) {
                                    if (sumVal >= selectedGoal.targetValue / 100) bgClass = 'bg-stone-900 border border-stone-950';
                                    else if (sumVal >= selectedGoal.targetValue / 200) bgClass = 'bg-stone-600 border border-stone-700';
                                    else bgClass = 'bg-stone-300 border border-stone-400';
                                  }

                                  return (
                                    <div
                                      key={rowIdx}
                                      className={`w-3.5 h-3.5 rounded-sm transition-all hover:scale-105 cursor-pointer ${bgClass}`}
                                      title={checkDateStr <= todayStr ? `${checkDateStr}: Logged ${sumVal} ${selectedGoal.unit}` : undefined}
                                      onClick={() => {
                                        if (checkDateStr <= todayStr) {
                                          setLogDate(checkDateStr);
                                        }
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-center items-center gap-4 text-[9px] text-stone-400 font-bold font-mono">
                          <span>Less</span>
                          <div className="flex gap-1">
                            <div className="w-2.5 h-2.5 rounded-sm bg-stone-100" />
                            <div className="w-2.5 h-2.5 rounded-sm bg-stone-300" />
                            <div className="w-2.5 h-2.5 rounded-sm bg-stone-600" />
                            <div className="w-2.5 h-2.5 rounded-sm bg-stone-900" />
                          </div>
                          <span>More</span>
                        </div>
                      </div>
                    )}

                    {/* E. Dependency Flow Diagram */}
                    {activeAnalysisTab === 'dependencies' && (
                      <div className="w-full space-y-2">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider font-mono block mb-1">
                          🔗 Goal Prerequisites Flowchart
                        </span>

                        <div className="h-44 w-full relative flex items-center justify-center p-2">
                          {selectedGoal.dependencies.length === 0 ? (
                            <div className="text-center text-xs text-stone-400 font-mono">
                              This goal does not depend on any prerequisite objectives. Configure dependencies in settings.
                            </div>
                          ) : (
                            <div className="w-full flex items-center justify-center gap-12 relative">
                              {/* Draw parent boxes */}
                              {selectedGoal.dependencies.map((depId, idx) => {
                                const depGoal = goals.find(g => g.id === depId);
                                if (!depGoal) return null;
                                return (
                                  <div key={idx} className="flex items-center gap-6">
                                    <div className="px-4 py-2 border border-stone-200/80 bg-white shadow-xs rounded-xl text-center text-xs font-bold text-stone-800">
                                      {depGoal.title}
                                      <span className="block text-[8px] text-stone-400 font-mono mt-0.5">
                                        {getGoalCompletionPercent(depGoal)}% Complete
                                      </span>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-stone-400" />
                                  </div>
                                );
                              })}

                              {/* Target Goal */}
                              <div 
                                style={{ borderColor: selectedGoal.color }}
                                className="px-4 py-3 border-[2px] bg-white shadow-xs rounded-xl text-center text-xs font-bold text-stone-900"
                              >
                                {selectedGoal.title}
                                <span className="block text-[8px] text-stone-400 font-mono mt-0.5">
                                  {getGoalCompletionPercent(selectedGoal)}% Complete
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Sub-goals and milestones block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-stone-100 pt-6">
                  
                  {/* Nested Sub-goals section */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-xs text-stone-900 uppercase">Sub-goals Hierarchy</h4>
                      <p className="text-[9px] text-stone-400 font-mono">Manage nested goals</p>
                    </div>

                    <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                      {(!selectedGoal.subGoals || selectedGoal.subGoals.length === 0) ? (
                        <div className="p-4 text-center bg-stone-50 border border-stone-100 rounded-xl text-[11px] text-stone-400 font-mono">
                          No subgoals added. Breakdown your main goal below.
                        </div>
                      ) : (
                        selectedGoal.subGoals.map((sg) => {
                          const sgPercent = getGoalCompletionPercent(sg);
                          return (
                            <div key={sg.id} className="p-3 bg-stone-50 border border-stone-100 rounded-xl flex justify-between items-center group">
                              <div className="flex-1 mr-4">
                                <h6 className="font-bold text-[11px] text-stone-800 line-clamp-1">{sg.title}</h6>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <div className="flex-1 h-1 bg-stone-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-stone-900" style={{ width: `${sgPercent}%` }} />
                                  </div>
                                  <span className="text-[9px] text-stone-400 font-bold font-mono shrink-0">{sgPercent}%</span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveSubGoal(sg.id)}
                                className="text-red-400 hover:text-red-600 transition-colors p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
                                title="Remove subgoal"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Subgoal creation form */}
                    <form onSubmit={handleAddSubGoal} className="bg-stone-50/50 border border-stone-100 rounded-2xl p-4 space-y-3">
                      <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider font-mono block">Add Sub-Goal</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Subgoal title..."
                            required
                            value={newSubGoalTitle}
                            onChange={(e) => setNewSubGoalTitle(e.target.value)}
                            className="w-full px-2 py-1.5 text-[11px] border border-border-main rounded-lg bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Target"
                            required
                            value={newSubGoalTarget}
                            onChange={(e) => setNewSubGoalTarget(Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-[11px] border border-border-main rounded-lg bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Unit"
                          required
                          value={newSubGoalUnit}
                          onChange={(e) => setNewSubGoalUnit(e.target.value)}
                          className="flex-1 px-2 py-1.5 text-[11px] border border-border-main rounded-lg bg-white focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-stone-900 hover:opacity-90 text-white font-semibold text-[11px] rounded-lg active:scale-97 cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Objective Milestones checklist */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-xs text-stone-900 uppercase">Objective Milestones Checklist</h4>
                      <p className="text-[9px] text-stone-400 font-mono">Click to complete milestones</p>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {selectedGoal.milestones.length === 0 ? (
                        <div className="p-6 text-center bg-stone-50 border border-stone-100 rounded-xl text-[11px] text-stone-400 font-mono">
                          No milestones added. Edit the goal settings to include objective milestones.
                        </div>
                      ) : (
                        selectedGoal.milestones.map((m) => (
                          <div 
                            key={m.id}
                            onClick={() => handleToggleMilestone(selectedGoal.id, m.id)}
                            className="p-3 bg-stone-50/50 border border-stone-100 hover:border-stone-300 rounded-xl flex items-center justify-between transition-all cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5">
                              {m.completed ? (
                                <CheckSquare className="w-4 h-4 text-stone-900 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-stone-400 shrink-0" />
                              )}
                              <span className={`text-[11px] font-semibold ${m.completed ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                                {m.title}
                              </span>
                            </div>
                            {m.completed && m.completedDate && (
                              <span className="text-[8px] text-stone-400 font-mono font-bold uppercase">
                                Done {m.completedDate}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Audit history events timeline */}
                <div className="border-t border-stone-100 pt-6 space-y-4">
                  <div>
                    <h4 className="font-bold text-xs text-stone-900 uppercase">Audit Logging & History</h4>
                    <p className="text-[9px] text-stone-400 font-mono">Cryptographically-traceable actions log</p>
                  </div>

                  <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                    {selectedGoal.history.slice().reverse().map((evt) => (
                      <div key={evt.id} className="flex gap-3 text-xs">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 bg-stone-900 rounded-full shrink-0" />
                          <div className="w-[1.5px] h-full bg-stone-200 mt-1" />
                        </div>
                        <div className="flex-1 pb-3">
                          <p className="font-semibold text-stone-700">{evt.description}</p>
                          <span className="text-[9px] text-stone-400 font-mono">
                            {new Date(evt.timestamp).toLocaleString()} • Event: {evt.eventType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          )}
        </div>

      </div>

      {/* 3. New Goal Form Modal */}
      <NewGoalModal
        isOpen={isNewGoalModalOpen}
        onClose={() => setIsNewGoalModalOpen(false)}
        onSave={handleSaveGoal}
        existingGoals={goals}
        editingGoal={editingGoal}
      />

    </div>
  );
}
