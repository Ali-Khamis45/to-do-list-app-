import React, { useState } from 'react';
import { Check, Trash2, GripVertical, Plus, Clock, FileText } from 'lucide-react';
import { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  activeDateString: string;
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function TaskList({
  tasks,
  activeDateString,
  onToggleTask,
  onAddTask,
  onDeleteTask
}: TaskListProps) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTime, setQuickTime] = useState('09:00');
  const [quickSubtext, setQuickSubtext] = useState('');

  // Filter tasks that match the selected active date
  const filteredTasks = tasks.filter(t => t.date === activeDateString);
  const remainingCount = filteredTasks.filter(t => !t.completed).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onAddTask({
      title: quickTitle,
      time: quickTime,
      subtext: quickSubtext,
      date: activeDateString
    });
    setQuickTitle('');
    setQuickSubtext('');
    setIsQuickAddOpen(false);
  };

  return (
    <section className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-xs flex flex-col">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base text-stone-900 flex items-center gap-2">
          Today's Tasks
          <span className="text-[10px] font-normal text-stone-500 bg-stone-50 px-2.5 py-0.5 rounded-full border border-stone-100 font-mono">
            ({remainingCount} remaining)
          </span>
        </h3>
        <button
          onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
          className="p-1.5 text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
          title="Quick Add Task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Add Form */}
      {isQuickAddOpen && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 bg-stone-50/50 rounded-xl border border-stone-100 space-y-2 animate-in fade-in duration-150">
          <input
            type="text"
            required
            placeholder="Task title..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              required
              value={quickTime}
              onChange={(e) => setQuickTime(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
            />
            <input
              type="text"
              placeholder="Details (e.g. Leg day)..."
              value={quickSubtext}
              onChange={(e) => setQuickSubtext(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
            />
          </div>
          <div className="flex justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(false)}
              className="text-[10px] px-2.5 py-1 text-stone-500 hover:bg-stone-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-[10px] px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* Task List Container */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
        {filteredTasks.length === 0 ? (
          <div className="py-8 text-center text-stone-400 text-sm flex flex-col items-center justify-center gap-1.5 border border-dashed border-stone-200 rounded-xl">
            <FileText className="w-7 h-7 text-stone-300 stroke-1" />
            <span className="text-xs">No tasks scheduled for today.</span>
            <button 
              onClick={() => setIsQuickAddOpen(true)}
              className="text-[10px] text-stone-900 font-semibold hover:underline"
            >
              Add a task now
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${
                task.completed
                  ? 'bg-stone-50/50 border-stone-100'
                  : 'bg-white border-stone-100 hover:border-stone-200/80 hover:shadow-xs'
              }`}
            >
              {/* Checkbox Trigger */}
              <button
                onClick={() => onToggleTask(task.id)}
                className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${
                  task.completed
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-300 hover:border-stone-900 hover:bg-stone-100/30 cursor-pointer'
                }`}
                title={task.completed ? "Mark as Incomplete" : "Mark as Complete"}
              >
                {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
              </button>

              {/* Task Details */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate flex items-center gap-1.5 ${
                  task.completed ? 'line-through text-stone-400' : 'text-stone-700'
                }`}>
                  <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="font-mono text-[10px] font-medium text-stone-400 shrink-0">{task.time}</span>
                  <span className="truncate">{task.title}</span>
                </p>
                {task.subtext && (
                  <p className={`text-[10px] pl-5 truncate ${
                    task.completed ? 'text-stone-300' : 'text-stone-400'
                  }`}>
                    {task.subtext}
                  </p>
                )}
              </div>

              {/* Grip and Delete Action */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1 text-stone-300 hover:text-red-500 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <GripVertical className="w-4 h-4 text-stone-300 cursor-grab shrink-0 hidden group-hover:block" />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
