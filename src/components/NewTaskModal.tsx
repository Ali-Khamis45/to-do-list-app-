import React, { useState } from 'react';
import { X, Check, BookOpen, Dumbbell, Code, Coffee, Flame, Heart, Smile, CheckSquare, Music, Sparkles, Apple, Brain, Compass, AlertCircle, Bell } from 'lucide-react';
import { Habit, Task } from '../types';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: {
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
  }) => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'logs' | 'createdAt'>) => void;
}

const HABIT_ICONS = [
  { name: 'BookOpen', component: BookOpen, label: 'Reading' },
  { name: 'Dumbbell', component: Dumbbell, label: 'Fitness' },
  { name: 'Code', component: Code, label: 'Programming' },
  { name: 'Coffee', component: Coffee, label: 'Routine' },
  { name: 'Flame', component: Flame, label: 'Energy' },
  { name: 'Heart', component: Heart, label: 'Health' },
  { name: 'Smile', component: Smile, label: 'Mindset' },
  { name: 'CheckSquare', component: CheckSquare, label: 'Work' },
  { name: 'Music', component: Music, label: 'Art' },
  { name: 'Sparkles', component: Sparkles, label: 'Elite' },
  { name: 'Apple', component: Apple, label: 'Diet' },
  { name: 'Brain', component: Brain, label: 'Study' },
];

const COLOR_PRESETS = [
  { name: 'Charcoal', class: 'text-stone-900 bg-stone-50 border-stone-300', hex: '#1c1917' },
  { name: 'WarmGray', class: 'text-stone-700 bg-stone-100/50 border-stone-200', hex: '#57534e' },
  { name: 'Sand', class: 'text-stone-600 bg-stone-100/30 border-stone-200', hex: '#78716c' },
  { name: 'Clay', class: 'text-stone-500 bg-stone-50 border-stone-200', hex: '#a8a29e' },
  { name: 'Bone', class: 'text-stone-800 bg-stone-100/70 border-stone-300', hex: '#44403c' },
  { name: 'Ink', class: 'text-stone-950 bg-stone-50/50 border-stone-200', hex: '#0c0a09' },
];

export default function NewTaskModal({ isOpen, onClose, onAddTask, onAddHabit }: NewTaskModalProps) {
  const [activeTab, setActiveTab] = useState<'task' | 'habit'>('task');
  
  // Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTime, setTaskTime] = useState('09:00');
  const [taskSubtext, setTaskSubtext] = useState('');
  const [taskDate, setTaskDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [repeatType, setRepeatType] = useState('none');
  const [notes, setNotes] = useState('');

  // Habit state
  const [habitName, setHabitName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('CheckSquare');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [streakGoal, setStreakGoal] = useState('30');

  // Validation function
  const validateForm = () => {
    const errors: string[] = [];
    if (!taskTitle.trim()) {
      errors.push("Task title is required.");
    }
    
    // Check if one reminder field is specified but not both
    if (reminderDate && !reminderTime) {
      errors.push("Please specify a Reminder Time to schedule the reminder.");
    }
    if (reminderTime && !reminderDate) {
      errors.push("Please specify a Reminder Date to schedule the reminder.");
    }

    if (reminderDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(reminderDate)) {
        errors.push("Invalid Reminder Date format.");
      } else {
        const selected = new Date(reminderDate + 'T00:00:00');
        const todayStr = new Date().toISOString().split('T')[0];
        const today = new Date(todayStr + 'T00:00:00');
        if (selected < today) {
          errors.push("Reminder Date cannot be in the past.");
        }
      }
    }

    if (reminderTime) {
      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!timeRegex.test(reminderTime)) {
        errors.push("Invalid Reminder Time format (use HH:MM).");
      }
    }

    return errors;
  };

  const validationErrors = validateForm();
  const isValid = validationErrors.length === 0;

  if (!isOpen) return null;

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onAddTask({
      title: taskTitle,
      time: taskTime,
      subtext: taskSubtext,
      date: taskDate,
      description,
      category,
      priority,
      reminderDate: reminderDate || undefined,
      reminderTime: reminderTime || undefined,
      repeatType,
      notes,
    });
    setTaskTitle('');
    setTaskTime('09:00');
    setTaskSubtext('');
    setDescription('');
    setCategory('Personal');
    setPriority('medium');
    setReminderDate('');
    setReminderTime('');
    setRepeatType('none');
    setNotes('');
    onClose();
  };

  const handleHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    onAddHabit({
      name: habitName,
      icon: selectedIcon,
      color: selectedColor.class.split(' ')[0], // text-stone-900 etc.
      colorHex: selectedColor.hex,
      streakGoal: Number(streakGoal),
    });
    setHabitName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200/60 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-stone-100">
          <div className="flex gap-1.5 p-1 bg-stone-100 rounded-xl">
            <button
              onClick={() => setActiveTab('task')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'task'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-400 hover:text-stone-900'
              }`}
            >
              New Task
            </button>
            <button
              onClick={() => setActiveTab('habit')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'habit'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-400 hover:text-stone-900'
              }`}
            >
              New Habit
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {/* Form Body */}
        {activeTab === 'task' ? (
          <form onSubmit={handleTaskSubmit} className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
            {validationErrors.length > 0 && (
              <div className="p-3 bg-red-50/20 border border-red-500/20 rounded-xl text-[10px] text-red-500 font-semibold space-y-1">
                {validationErrors.map((err, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-stone-400 mb-1">Task Name *</label>
              <input
                type="text"
                required
                placeholder="Enter task title..."
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 mb-1">Description</label>
              <input
                type="text"
                placeholder="Brief description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={taskTime}
                  onChange={(e) => setTaskTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="Personal">Personal</option>
                  <option value="Work">Work</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Learning">Learning</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 mb-1">Repeat Type</label>
                <select
                  value={repeatType}
                  onChange={(e) => setRepeatType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="none">Does Not Repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 mb-1">Priority</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 px-3 rounded-lg text-[10px] font-semibold border capitalize transition-all ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-red-50 text-red-600 border-red-300 ring-1 ring-red-300'
                          : p === 'medium'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 text-stone-600 border-stone-300'
                        : 'bg-white text-stone-400 border-stone-200 hover:text-stone-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Reminder Fields */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-2">
              <span className="text-[10px] font-bold text-stone-500 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-stone-400" /> Reminder (Optional Toast)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-stone-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-stone-400 mb-1">Time</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-500 bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 mb-1">Notes</label>
              <textarea
                placeholder="Enter notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!isValid}
              className="w-full mt-3 bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2 px-4 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-4 h-4" /> Save Task
            </button>
          </form>
        ) : (
          <form onSubmit={handleHabitSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-stone-400 mb-1">Habit Name</label>
              <input
                type="text"
                required
                placeholder="Enter habit name..."
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-stone-400 mb-1">Select Icon</label>
              <div className="grid grid-cols-6 gap-2 border border-stone-200/60 p-2 rounded-xl max-h-36 overflow-y-auto">
                {HABIT_ICONS.map((iconObj) => {
                  const IconComponent = iconObj.component;
                  return (
                    <button
                      key={iconObj.name}
                      type="button"
                      title={iconObj.label}
                      onClick={() => setSelectedIcon(iconObj.name)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                        selectedIcon === iconObj.name
                          ? 'bg-stone-900 border border-stone-950 text-white shadow-xs'
                          : 'text-stone-400 border border-transparent hover:bg-stone-50'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-stone-400 mb-1">Color</label>
                <div className="flex gap-1.5 items-center py-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setSelectedColor(preset)}
                      className={`w-5 h-5 rounded-full border transition-all ${
                        selectedColor.name === preset.name
                          ? 'ring-2 ring-stone-400 scale-110'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-stone-400 mb-1">Streak Goal (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  required
                  value={streakGoal}
                  onChange={(e) => setStreakGoal(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2 px-4 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Add Habit
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
