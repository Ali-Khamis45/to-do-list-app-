import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  MinusCircle, 
  Trash2,
  BookOpen, 
  Dumbbell, 
  Code, 
  Coffee, 
  Flame, 
  Heart, 
  Smile, 
  CheckSquare, 
  Music, 
  Sparkles, 
  Apple, 
  Brain,
  HelpCircle
} from 'lucide-react';
import { Habit, HabitStatus } from '../types';

// Map of string icons to Lucide components
export const ICON_MAP: Record<string, React.ComponentType<any>> = {
  BookOpen,
  Dumbbell,
  Code,
  Coffee,
  Flame,
  Heart,
  Smile,
  CheckSquare,
  Music,
  Sparkles,
  Apple,
  Brain
};

interface HabitGridProps {
  habits: Habit[];
  currentDate: Date; // State of active calendar viewing
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToggleCell: (habitId: string, dateString: string) => void;
  onDeleteHabit: (habitId: string) => void;
}

export default function HabitGrid({
  habits,
  currentDate,
  onPrevMonth,
  onNextMonth,
  onToggleCell,
  onDeleteHabit
}: HabitGridProps) {
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  
  // Calculate total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();
  
  // Array of days [1, 2, ..., totalDays]
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  
  // Check if a day is today
  const todayDateObj = new Date();
  const isCurrentMonthYear = todayDateObj.getFullYear() === year && todayDateObj.getMonth() === month;
  const todayDayNum = todayDateObj.getDate();

  // Helper to format date key YYYY-MM-DD
  const formatDateKey = (dayNum: number): string => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(dayNum).padStart(2, '0');
    return `${year}-${formattedMonth}-${formattedDay}`;
  };

  const getMonthNameArabic = (m: number): string => {
    const months = [
      'يناير (January)', 'فبراير (February)', 'مارس (March)', 'أبريل (April)', 
      'مايو (May)', 'يونيو (June)', 'يوليو (July)', 'أغسطس (August)', 
      'سبتمبر (September)', 'أكتوبر (October)', 'نوفمبر (November)', 'ديسمبر (December)'
    ];
    return months[m];
  };

  // Render cell icon depending on status
  const renderCellIcon = (status: HabitStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4.5 h-4.5 text-stone-900 fill-stone-100" />;
      case 'missed':
        return <XCircle className="w-4.5 h-4.5 text-red-600 fill-red-50" />;
      case 'half':
        return <MinusCircle className="w-4.5 h-4.5 text-stone-400 fill-stone-50" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 p-6 flex flex-col shadow-xs">
      {/* Grid Header Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-stone-100 text-stone-800 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg text-stone-900">مخطط العادات الشهري</h2>
            <p className="text-xs text-stone-400 font-medium">Monthly Habit Grid</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-stone-50 p-1 rounded-xl border border-stone-200/60">
          <button 
            onClick={onPrevMonth}
            className="p-1 hover:bg-white hover:shadow-xs rounded-lg transition-all text-stone-500 hover:text-stone-900"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium text-xs text-stone-700 px-3 min-w-[130px] text-center">
            {getMonthNameArabic(month)} {year}
          </span>
          <button 
            onClick={onNextMonth}
            className="p-1 hover:bg-white hover:shadow-xs rounded-lg transition-all text-stone-500 hover:text-stone-900"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Habit Grid Scroll Container */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-[950px] space-y-1">
          {/* Header Row (Days of month) */}
          <div className="flex items-center h-10 border-b border-stone-100 font-semibold text-xs text-stone-400 select-none">
            <div className="w-[160px] pl-2 text-stone-500">العادة • Habit</div>
            <div className="flex-1 grid gap-px" style={{ gridTemplateColumns: 'repeat(31, minmax(0, 1fr))' }}>
              {Array.from({ length: 31 }).map((_, idx) => {
                const dayNum = idx + 1;
                const exists = dayNum <= totalDays;
                const isToday = isCurrentMonthYear && dayNum === todayDayNum;
                
                return (
                  <div 
                    key={idx} 
                    className={`h-9 flex items-center justify-center font-bold text-center transition-all ${
                      exists 
                        ? isToday 
                          ? 'text-stone-900 bg-stone-100/70 border-b-2 border-stone-900 active-day-glow' 
                          : 'text-stone-600 hover:bg-stone-50'
                        : 'opacity-10 bg-stone-50 text-stone-300'
                    }`}
                  >
                    {exists ? dayNum : ''}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Habit Rows */}
          {habits.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-sm flex flex-col items-center justify-center gap-2">
              <Calendar className="w-8 h-8 text-stone-300 stroke-1" />
              <span>لا توجد عادات حالية. اضغط على "New Task" في القائمة لإضافة واحدة!</span>
              <span className="text-xs text-stone-400 font-mono">No habits created. Create one from the sidebar button.</span>
            </div>
          ) : (
            habits.map((habit) => {
              const IconComponent = ICON_MAP[habit.icon] || HelpCircle;
              return (
                <div key={habit.id} className="flex items-center h-10 hover:bg-stone-50/40 rounded-lg group transition-all">
                  {/* Habit Title + Action Label */}
                  <div className="w-[160px] pr-2 flex items-center justify-between text-stone-700 font-medium text-xs truncate">
                    <div className="flex items-center gap-2 truncate">
                      <div className={`p-1 rounded bg-stone-50 ${habit.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="truncate" title={habit.name}>{habit.name}</span>
                    </div>
                    {/* Delete action */}
                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-1 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1 rounded-md hover:bg-red-50"
                      title="حذف العادة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 31 columns for cells */}
                  <div className="flex-1 grid gap-px" style={{ gridTemplateColumns: 'repeat(31, minmax(0, 1fr))' }}>
                    {Array.from({ length: 31 }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const exists = dayNum <= totalDays;
                      const dateKey = formatDateKey(dayNum);
                      const status = habit.logs[dateKey] || null;
                      const isToday = isCurrentMonthYear && dayNum === todayDayNum;

                      return (
                        <button
                          key={idx}
                          disabled={!exists}
                          onClick={() => onToggleCell(habit.id, dateKey)}
                          className={`h-9 flex items-center justify-center transition-all ${
                            exists 
                              ? `hover:bg-stone-100 cursor-pointer active:scale-90 relative ${isToday ? 'bg-stone-50' : ''}`
                              : 'bg-stone-50/30 opacity-20 cursor-not-allowed'
                          }`}
                        >
                          {exists ? (
                            renderCellIcon(status) || <div className="w-1.5 h-1.5 rounded-full bg-stone-200 group-hover:bg-stone-300" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Grid Legend Footer */}
      <div className="mt-5 flex flex-wrap items-center gap-6 pt-4 border-t border-stone-100 text-xs text-stone-500 font-medium">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-stone-900 fill-stone-100" />
          <span>مكتمل (Completed)</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-600 fill-red-50" />
          <span>غير مكتمل (Missed)</span>
        </div>
        <div className="flex items-center gap-2">
          <MinusCircle className="w-4 h-4 text-stone-400 fill-stone-50" />
          <span>نصف مكتمل (Half-Done)</span>
        </div>
        <div className="text-stone-300 select-none">|</div>
        <div className="text-stone-400 italic">💡 انقر على خلايا الجدول لتغيير حالة الإنجاز اليومي.</div>
      </div>
    </div>
  );
}
