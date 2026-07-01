import React, { useState } from 'react';
import { X, Check, BookOpen, Dumbbell, Code, Coffee, Flame, Heart, Smile, CheckSquare, Music, Sparkles, Apple, Brain, Compass } from 'lucide-react';
import { Habit, Task } from '../types';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
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

  // Habit state
  const [habitName, setHabitName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('BookOpen');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [streakGoal, setStreakGoal] = useState(30);

  if (!isOpen) return null;

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    onAddTask({
      title: taskTitle,
      time: taskTime,
      subtext: taskSubtext,
      date: taskDate,
    });
    setTaskTitle('');
    setTaskSubtext('');
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
              مهمة جديدة
            </button>
            <button
              onClick={() => setActiveTab('habit')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'habit'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-400 hover:text-stone-900'
              }`}
            >
              عادة جديدة
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
        {activeTab === 'task' ? (
          <form onSubmit={handleTaskSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-stone-400 mb-1">اسم المهمة</label>
              <input
                type="text"
                required
                placeholder="أدخل عنوان المهمة..."
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-stone-400 mb-1">الوقت</label>
                <input
                  type="time"
                  required
                  value={taskTime}
                  onChange={(e) => setTaskTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-stone-400 mb-1">التاريخ</label>
                <input
                  type="date"
                  required
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-stone-400 mb-1">تفاصيل إضافية (اختياري)</label>
              <input
                type="text"
                placeholder="أدخل تفاصيل المهمة (مثال: Leg day focus)"
                value={taskSubtext}
                onChange={(e) => setTaskSubtext(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2 px-4 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> إضافة المهمة
            </button>
          </form>
        ) : (
          <form onSubmit={handleHabitSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-stone-400 mb-1">اسم العادة</label>
              <input
                type="text"
                required
                placeholder="أدخل اسم العادة..."
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-stone-400 mb-1">اختر أيقونة</label>
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
                <label className="block text-[10px] font-semibold text-stone-400 mb-1">اللون</label>
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
                <label className="block text-[10px] font-semibold text-stone-400 mb-1">الهدف (بالأيام)</label>
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
              <Check className="w-4 h-4" /> إضافة العادة
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
