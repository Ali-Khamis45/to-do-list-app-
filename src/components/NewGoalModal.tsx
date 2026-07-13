import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { Goal, GoalType, Priority, Frequency, Difficulty } from '../goals/types';
import { GOAL_TEMPLATES, GoalTemplate } from '../goals/templates';
import { getDateString, addDays } from '../goals/calculations';

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: Omit<Goal, 'id' | 'userId' | 'currentValue' | 'logs' | 'history'>) => void;
  existingGoals: Goal[];
  editingGoal?: Goal | null;
}

const PRESET_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899', '#06b6d4', '#1c1917'];
const PRESET_ICONS = ['BookOpen', 'Dumbbell', 'Coins', 'Languages', 'Code', 'Compass', 'Layout', 'Target', 'Flame', 'Sparkles'];

export default function NewGoalModal({ isOpen, onClose, onSave, existingGoals, editingGoal }: NewGoalModalProps) {
  const todayStr = getDateString(new Date());
  
  // State variables for form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('numeric');
  const [targetValue, setTargetValue] = useState<number>(10);
  const [unit, setUnit] = useState('books');
  const [startDate, setStartDate] = useState(todayStr);
  const [targetDate, setTargetDate] = useState(addDays(todayStr, 90)); // default 3 months
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('Personal');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [estimatedMinutesPerUnit, setEstimatedMinutesPerUnit] = useState<number>(30);
  const [tagsInput, setTagsInput] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [icon, setIcon] = useState('Target');
  
  // Milestones input state
  const [milestones, setMilestones] = useState<string[]>([]);
  const [newMilestoneText, setNewMilestoneText] = useState('');

  // Selected dependencies
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);

  // Reset or load editing goal data
  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title);
      setDescription(editingGoal.description);
      setGoalType(editingGoal.goalType);
      setTargetValue(editingGoal.targetValue);
      setUnit(editingGoal.unit);
      setStartDate(editingGoal.startDate);
      setTargetDate(editingGoal.targetDate);
      setPriority(editingGoal.priority);
      setCategory(editingGoal.category);
      setFrequency(editingGoal.frequency);
      setDifficulty(editingGoal.difficulty);
      setEstimatedMinutesPerUnit(editingGoal.estimatedMinutesPerUnit);
      setTagsInput(editingGoal.tags.join(', '));
      setColor(editingGoal.color);
      setIcon(editingGoal.icon);
      setMilestones(editingGoal.milestones.map(m => m.title));
      setSelectedDependencies(editingGoal.dependencies || []);
    } else {
      // Defaults
      setTitle('');
      setDescription('');
      setGoalType('numeric');
      setTargetValue(10);
      setUnit('books');
      setStartDate(todayStr);
      setTargetDate(addDays(todayStr, 90));
      setPriority('medium');
      setCategory('Personal');
      setFrequency('daily');
      setDifficulty('medium');
      setEstimatedMinutesPerUnit(30);
      setTagsInput('');
      setColor('#8b5cf6');
      setIcon('Target');
      setMilestones([]);
      setSelectedDependencies([]);
    }
  }, [editingGoal, isOpen]);

  if (!isOpen) return null;

  // Apply a template preset
  const handleSelectTemplate = (tpl: GoalTemplate) => {
    setTitle(tpl.title);
    setDescription(tpl.description);
    setGoalType(tpl.goalType);
    setTargetValue(tpl.targetValue);
    setUnit(tpl.unit);
    setEstimatedMinutesPerUnit(tpl.estimatedMinutesPerUnit);
    setColor(tpl.color);
    setIcon(tpl.icon);
    setCategory(tpl.category);
    setTagsInput(tpl.tags.join(', '));
    setMilestones([...tpl.initialMilestones]);
  };

  const handleAddMilestone = () => {
    if (!newMilestoneText.trim()) return;
    setMilestones([...milestones, newMilestoneText.trim()]);
    setNewMilestoneText('');
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, idx) => idx !== index));
  };

  const toggleDependency = (goalId: string) => {
    if (selectedDependencies.includes(goalId)) {
      setSelectedDependencies(selectedDependencies.filter(id => id !== goalId));
    } else {
      setSelectedDependencies([...selectedDependencies, goalId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const goalMilestones = milestones.map(mTitle => ({
      id: editingGoal?.milestones.find(em => em.title === mTitle)?.id || `m-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: mTitle,
      completed: editingGoal?.milestones.find(em => em.title === mTitle)?.completed || false,
      completedDate: editingGoal?.milestones.find(em => em.title === mTitle)?.completedDate
    }));

    onSave({
      title: title.trim(),
      description: description.trim(),
      goalType,
      targetValue: Number(targetValue),
      unit: unit.trim(),
      startDate,
      targetDate,
      priority,
      category,
      frequency,
      difficulty,
      estimatedMinutesPerUnit: Number(estimatedMinutesPerUnit),
      status: editingGoal ? editingGoal.status : 'active',
      tags,
      color,
      icon,
      milestones: goalMilestones,
      subGoals: editingGoal ? editingGoal.subGoals : [],
      dependencies: selectedDependencies
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[85vh] bg-bg-card rounded-2xl shadow-xl border border-border-main flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border-main bg-bg-sidebar">
          <div>
            <h3 className="font-bold text-sm text-text-primary uppercase tracking-tight">
              {editingGoal ? 'Upgrade Goal Settings' : 'Initialize New Smart Goal'}
            </h3>
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-mono">
              SOLID Architecture Design
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-bg-hover text-text-secondary cursor-pointer transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Preset Templates Selector (only when creating) */}
          {!editingGoal && (
            <div>
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-2 font-mono">
                Select a Starting Template
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {GOAL_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className="flex flex-col text-left p-3 border border-border-main rounded-xl bg-bg-app hover:bg-bg-hover hover:border-text-muted active:scale-98 transition-all cursor-pointer group"
                  >
                    <span className="font-bold text-[11px] text-text-primary group-hover:text-accent-main transition-colors">
                      {tpl.title}
                    </span>
                    <span className="text-[9px] text-text-secondary mt-0.5 line-clamp-1">
                      {tpl.unit} • {tpl.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Title & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read 50 books this year"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border-main rounded-xl bg-bg-app focus:outline-none focus:ring-1 focus:ring-accent-main"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Learning, Health, Finance"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border-main rounded-xl bg-bg-app focus:outline-none focus:ring-1 focus:ring-accent-main"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                Goal Description
              </label>
              <textarea
                placeholder="Detail what accomplishments this goal represents..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-16 px-3 py-2 text-xs border border-border-main rounded-xl bg-bg-app focus:outline-none focus:ring-1 focus:ring-accent-main resize-none"
              />
            </div>

            {/* Goal Types, Target Value, Units */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                  Goal Type
                </label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as GoalType)}
                  className="w-full px-3 py-2 text-xs border border-border-main rounded-xl bg-bg-app focus:outline-none"
                >
                  <option value="numeric">Numeric Quantity</option>
                  <option value="milestone">Milestones List</option>
                  <option value="habit">Habit / Lessons</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                  Target Value
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-border-main rounded-xl bg-bg-app focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                  Progress Unit
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. books, kg, lessons"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border-main rounded-xl bg-bg-app focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                  Time Est. (Mins/Unit)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={estimatedMinutesPerUnit}
                  onChange={(e) => setEstimatedMinutesPerUnit(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-border-main rounded-xl bg-bg-app focus:outline-none"
                />
              </div>
            </div>

            {/* Dates, Priority, Difficulty, Frequency */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-1 md:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-2 text-xs border border-border-main rounded-xl bg-bg-app focus:outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                  Target Date
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-2 py-2 text-xs border border-border-main rounded-xl bg-bg-app focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2 text-xs border border-border-main rounded-xl bg-bg-app focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">🔴 Critical</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full px-3 py-2 text-xs border border-border-main rounded-xl bg-bg-app focus:outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as Frequency)}
                  className="w-full px-3 py-2 text-xs border border-border-main rounded-xl bg-bg-app focus:outline-none"
                >
                  <option value="daily">Daily Target</option>
                  <option value="weekly">Weekly Target</option>
                  <option value="monthly">Monthly Target</option>
                </select>
              </div>
            </div>

            {/* Customizer (Tags, Colors, Icons) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border-main pt-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. read, personal, study"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-border-main rounded-xl bg-bg-app focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                  Goal Accent Color
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${
                        color === c ? 'border-text-primary scale-110 shadow-xs' : 'border-transparent hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                  Choose Icon
                </label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {PRESET_ICONS.map(iName => (
                    <button
                      key={iName}
                      type="button"
                      onClick={() => setIcon(iName)}
                      className={`px-2 py-1 text-[10px] rounded-lg border font-mono transition-all cursor-pointer ${
                        icon === iName 
                          ? 'bg-text-primary text-bg-card border-text-primary font-bold' 
                          : 'border-border-main text-text-secondary hover:bg-bg-hover'
                      }`}
                    >
                      {iName}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dependencies */}
            {existingGoals.length > 0 && (
              <div className="border-t border-border-main pt-4 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-text-muted" />
                  Prerequisite Goals (Dependencies)
                </label>
                <p className="text-[10px] text-text-muted mb-2">
                  Select which goals must be completed before starting this goal.
                </p>
                <div className="flex flex-wrap gap-2">
                  {existingGoals
                    .filter(eg => eg.id !== editingGoal?.id)
                    .map(eg => {
                      const isSelected = selectedDependencies.includes(eg.id);
                      return (
                        <button
                          key={eg.id}
                          type="button"
                          onClick={() => toggleDependency(eg.id)}
                          className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-text-primary border-text-primary text-bg-card font-bold' 
                              : 'bg-bg-app border-border-main text-text-secondary hover:bg-bg-hover'
                          }`}
                        >
                          {eg.title}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Milestones Input Checklist */}
            <div className="border-t border-border-main pt-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary font-mono">
                  Milestones Checklist ({milestones.length})
                </label>
                <p className="text-[10px] text-text-muted mb-2">
                  Define concrete sub-targets to check off as you progress.
                </p>
              </div>

              {/* Added Milestones List */}
              {milestones.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-1.5 border border-border-main rounded-xl bg-bg-app/40">
                  {milestones.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-bg-card rounded-lg border border-border-main">
                      <span className="font-semibold text-text-primary">{m}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(idx)}
                        className="text-red-500 hover:text-red-700 transition-colors p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Milestone Adding Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter a milestone title..."
                  value={newMilestoneText}
                  onChange={(e) => setNewMilestoneText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-border-main rounded-xl bg-bg-app focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMilestone();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="bg-bg-btn text-text-btn px-3 rounded-xl hover:opacity-90 active:scale-97 flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2 border-t border-border-main pt-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-border-main hover:bg-bg-hover text-text-secondary font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-bg-btn hover:opacity-95 text-text-btn font-semibold text-xs rounded-xl shadow-xs active:scale-97 transition-all cursor-pointer"
              >
                {editingGoal ? 'Update Goal' : 'Launch Goal'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
