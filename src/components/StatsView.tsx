import React, { useState } from 'react';
import { Sparkles, Calendar, Zap, AlertCircle, PlusCircle, Check } from 'lucide-react';
import { Habit, Task, FocusSession } from '../types';

interface StatsViewProps {
  habits: Habit[];
  tasks: Task[];
  focusSessions: FocusSession[];
  onAddFocusSession: (dateString: string, intensity: number) => void;
}

export default function StatsView({
  habits,
  tasks,
  focusSessions,
  onAddFocusSession
}: StatsViewProps) {
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<number | null>(null);

  // Helper to format date key YYYY-MM-DD
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const todayStr = getTodayDateString();

  // 1. Calculate Today's Progress
  const todayHabits = habits.length;
  const todayCompletedHabits = habits.filter(h => h.logs[todayStr] === 'completed').length;
  const todayHalfHabits = habits.filter(h => h.logs[todayStr] === 'half').length;
  
  const todayTasks = tasks.filter(t => t.date === todayStr).length;
  const todayCompletedTasks = tasks.filter(t => t.date === todayStr && t.completed).length;

  const totalTodayItems = todayHabits + todayTasks;
  const completedTodayItems = todayCompletedHabits + (todayHalfHabits * 0.5) + todayCompletedTasks;
  
  const todayPercentage = totalTodayItems > 0 
    ? Math.round((completedTodayItems / totalTodayItems) * 100) 
    : 0;

  // 2. Calculate Weekly Progress (last 7 days)
  const getPastDateString = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  let totalWeeklyCells = 0;
  let completedWeeklyCells = 0;

  for (let i = 0; i < 7; i++) {
    const dateStr = getPastDateString(i);
    habits.forEach(h => {
      totalWeeklyCells++;
      const status = h.logs[dateStr];
      if (status === 'completed') completedWeeklyCells++;
      if (status === 'half') completedWeeklyCells += 0.5;
    });
  }

  const weeklyPercentage = totalWeeklyCells > 0 
    ? Math.round((completedWeeklyCells / totalWeeklyCells) * 100) 
    : 0;

  // 3. Calculate Monthly Progress (last 30 days)
  let totalMonthlyCells = 0;
  let completedMonthlyCells = 0;

  for (let i = 0; i < 30; i++) {
    const dateStr = getPastDateString(i);
    habits.forEach(h => {
      totalMonthlyCells++;
      const status = h.logs[dateStr];
      if (status === 'completed') completedMonthlyCells++;
      if (status === 'half') completedMonthlyCells += 0.5;
    });
  }

  const monthlyPercentage = totalMonthlyCells > 0 
    ? Math.round((completedMonthlyCells / totalMonthlyCells) * 100) 
    : 0;

  // 4. Monthly Goal Performance
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  let performanceDaysCount = 0;
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(d).padStart(2, '0');
    const dateKey = `${currentYear}-${formattedMonth}-${formattedDay}`;
    
    const hasActivity = habits.some(h => h.logs[dateKey] === 'completed' || h.logs[dateKey] === 'half');
    if (hasActivity) {
      performanceDaysCount++;
    }
  }

  const performancePercentage = Math.round((performanceDaysCount / totalDaysInMonth) * 100);

  // SVG ring helper
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  
  const getRingOffset = (percentage: number) => {
    return circumference - (percentage / 100) * circumference;
  };

  // Focus intensity calculations
  const getHeatmapGrid = () => {
    const grid = [];
    for (let i = 41; i >= 0; i--) {
      const dateStr = getPastDateString(i);
      const sessions = focusSessions.filter(s => s.date === dateStr);
      const intensity = sessions.length > 0 
        ? Math.min(1.0, sessions.reduce((acc, s) => acc + s.intensity, 0)) 
        : 0;
      grid.push({
        index: i,
        dateString: dateStr,
        intensity,
        sessionCount: sessions.length
      });
    }
    return grid;
  };

  const heatmapData = getHeatmapGrid();

  const handleCellClick = (dateStr: string, index: number) => {
    setSelectedHeatmapCell(selectedHeatmapCell === index ? null : index);
  };

  const triggerLogFocus = (dateStr: string) => {
    onAddFocusSession(dateStr, 0.35);
  };

  return (
    <aside className="w-full lg:w-[360px] space-y-6">
      
      {/* 1. Aggregated Progress Card */}
      <section className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs flex flex-col">
        <h3 className="font-semibold text-sm text-stone-900 mb-6 flex items-center justify-between">
          <span>التقدم التراكمي</span>
          <span className="text-[10px] text-stone-400 font-mono">Aggregated Progress</span>
        </h3>
        
        <div className="flex flex-col items-center gap-6">
          {/* Rings Row */}
          <div className="flex justify-around w-full gap-2">
            
            {/* Today Ring */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    className="text-stone-100 stroke-current" 
                    cx="50" cy="50" r={radius} fill="none" strokeWidth="7"
                  />
                  <circle 
                    className="text-stone-900 stroke-current transition-all duration-500" 
                    cx="50" cy="50" r={radius} fill="none" strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={getRingOffset(todayPercentage)}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-stone-900 font-mono">{todayPercentage}%</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider font-mono">اليوم</span>
            </div>

            {/* Weekly Ring */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    className="text-stone-100 stroke-current" 
                    cx="50" cy="50" r={radius} fill="none" strokeWidth="7"
                  />
                  <circle 
                    className="text-stone-600 stroke-current transition-all duration-500" 
                    cx="50" cy="50" r={radius} fill="none" strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={getRingOffset(weeklyPercentage)}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-stone-700 font-mono">{weeklyPercentage}%</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider font-mono">أسبوعي</span>
            </div>

            {/* Monthly Ring */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    className="text-stone-100 stroke-current" 
                    cx="50" cy="50" r={radius} fill="none" strokeWidth="7"
                  />
                  <circle 
                    className="text-stone-400 stroke-current transition-all duration-500" 
                    cx="50" cy="50" r={radius} fill="none" strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={getRingOffset(monthlyPercentage)}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-stone-600 font-mono">{monthlyPercentage}%</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider font-mono">شهري</span>
            </div>

          </div>

          {/* Monthly goal bar indicator */}
          <div className="w-full space-y-2 mt-2">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="font-semibold text-stone-600">أداء الهدف الشهري</span>
                <span className="font-bold text-stone-900 font-mono">{performanceDaysCount} / {totalDaysInMonth} Days</span>
              </div>
              <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-stone-900 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(4, performancePercentage)}%` }}
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Focus Intensity Heatmap Card */}
      <section className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-sm text-stone-900 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-stone-900 fill-stone-900" />
            <span>شدة التركيز وجلسات العمل</span>
          </h3>
          <span className="text-[10px] text-stone-400 font-mono">Focus Intensity</span>
        </div>
        <p className="text-[11px] text-stone-400 mb-4">
          انقر فوق أي مربع لتسجيل جلسة تركيز (30 دقيقة) وزيادة شدتها اليومية.
        </p>

        {/* Heatmap Grid */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-3 p-1.5 bg-stone-50/50 rounded-xl border border-stone-100">
          {heatmapData.map((cell) => {
            const isToday = cell.dateString === todayStr;
            return (
              <div key={cell.index} className="relative">
                <button
                  onClick={() => handleCellClick(cell.dateString, cell.index)}
                  className={`w-6.5 h-6.5 rounded transition-all duration-150 hover:scale-115 cursor-pointer relative ${
                    isToday ? 'ring-2 ring-stone-900 ring-offset-1 z-10' : ''
                  }`}
                  style={{
                    backgroundColor: cell.intensity > 0 ? '#1c1917' : '#e7e5e4',
                    opacity: cell.intensity > 0 ? Math.max(0.2, cell.intensity) : 1
                  }}
                  title={`${cell.dateString}: ${cell.sessionCount} sessions`}
                />
              </div>
            );
          })}
        </div>

        {/* Selected Heatmap Cell Detail */}
        {selectedHeatmapCell !== null && (() => {
          const cell = heatmapData.find(c => c.index === selectedHeatmapCell);
          if (!cell) return null;
          return (
            <div className="p-3 bg-stone-50 border border-stone-100 rounded-xl text-xs text-stone-600 animate-in slide-in-from-top-2 duration-150 space-y-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-stone-700">{cell.dateString}</span>
                <span className="text-[10px] text-stone-400 font-mono">({cell.sessionCount} sessions)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>الشدة الإجمالية: {Math.round(cell.intensity * 100)}%</span>
                <button
                  onClick={() => triggerLogFocus(cell.dateString)}
                  className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium text-[10px] flex items-center gap-1 transition-colors"
                >
                  <PlusCircle className="w-3 h-3" /> تسجيل جلسة 
                </button>
              </div>
            </div>
          );
        })()}

        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] text-stone-400 pt-2 border-t border-stone-100 mt-3 font-mono">
          <span>أقل (Less)</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded bg-stone-200" />
            <div className="w-2.5 h-2.5 rounded bg-stone-900" style={{ opacity: 0.25 }} />
            <div className="w-2.5 h-2.5 rounded bg-stone-900" style={{ opacity: 0.5 }} />
            <div className="w-2.5 h-2.5 rounded bg-stone-900" style={{ opacity: 0.75 }} />
            <div className="w-2.5 h-2.5 rounded bg-stone-900" style={{ opacity: 1.0 }} />
          </div>
          <span>أكثر (More)</span>
        </div>
      </section>

      {/* 3. Success Ratio Chart */}
      <section className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs">
        <h3 className="font-semibold text-sm text-stone-900 mb-4 flex items-center justify-between">
          <span>نسبة نجاح العادات (%)</span>
          <span className="text-[10px] text-stone-400 font-mono">Success Ratio</span>
        </h3>

        {habits.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-400">
            أضف عادات وسجّلها لعرض نسب النجاح
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map(habit => {
              const loggedDays = Object.keys(habit.logs);
              const completedDays = Object.values(habit.logs).filter(v => v === 'completed').length;
              const halfDays = Object.values(habit.logs).filter(v => v === 'half').length;
              
              const ratio = loggedDays.length > 0 
                ? Math.round(((completedDays + halfDays * 0.5) / loggedDays.length) * 100)
                : 0;

              return (
                <div key={habit.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-stone-700 truncate max-w-[200px]">{habit.name}</span>
                    <span className="font-bold text-stone-400 font-mono">{ratio}% ({loggedDays.length}d logged)</span>
                  </div>
                  <div className="w-full h-2 bg-stone-50 rounded-full overflow-hidden border border-stone-100">
                    <div 
                      className="h-full rounded-full bg-stone-900 transition-all duration-500"
                      style={{ width: `${Math.max(4, ratio)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </aside>
  );
}
