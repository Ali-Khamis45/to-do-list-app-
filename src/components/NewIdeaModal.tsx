import React, { useState } from 'react';
import { X, Lightbulb, Tag } from 'lucide-react';
import { Idea } from '../brain/types';

interface NewIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (idea: Omit<Idea, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
}

const CATEGORIES = ['Business', 'Health', 'Learning', 'Technology', 'Personal', 'General'];
const PRIORITIES: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];

const NewIdeaModal: React.FC<NewIdeaModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tagInput, setTagInput] = useState('');
  const [mood, setMood] = useState('');
  const [favorite, setFavorite] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Parse comma separated tags
    const tags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // If category is not in tags, add it as a lowercase tag
    if (category && !tags.map(t => t.toLowerCase()).includes(category.toLowerCase())) {
      tags.push(category.toLowerCase());
    }

    onSave({
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      tags,
      mood: mood.trim() || undefined,
      favorite,
      archived: false
    });

    // Reset fields
    setTitle('');
    setContent('');
    setCategory('General');
    setPriority('medium');
    setTagInput('');
    setMood('');
    setFavorite(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-xl bg-stone-900/90 border border-stone-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden backdrop-blur-md">
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
              <Lightbulb className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-100">Quick Capture Idea</h2>
              <p className="text-xs text-stone-400">Save your thoughts in seconds and let the AI organize them</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Title</label>
            <input
              type="text"
              id="title"
              required
              placeholder="e.g. AI-powered recipe planner..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-stone-950/80 border border-stone-800 hover:border-stone-700 focus:border-amber-500 rounded-xl px-4 py-3 text-stone-100 placeholder-stone-600 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Content / Description</label>
            <textarea
              id="content"
              rows={4}
              placeholder="Jot down the core thoughts, unique features, or why it matters..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full bg-stone-950/80 border border-stone-800 hover:border-stone-700 focus:border-amber-500 rounded-xl px-4 py-3 text-stone-100 placeholder-stone-600 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Category</label>
              <select
                id="category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl px-4 py-3 text-stone-200 focus:outline-none transition-all"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl px-4 py-3 text-stone-200 focus:outline-none transition-all"
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="tags" className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Tags (comma separated)
                </span>
              </label>
              <input
                type="text"
                id="tags"
                placeholder="e.g. saas, react, startup"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                className="w-full bg-stone-950/80 border border-stone-800 hover:border-stone-700 focus:border-amber-500 rounded-xl px-4 py-3 text-stone-100 placeholder-stone-600 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="mood" className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Mood / Vibe</label>
              <input
                type="text"
                id="mood"
                placeholder="e.g. ⚡ inspired, 🧘 calm"
                value={mood}
                onChange={e => setMood(e.target.value)}
                className="w-full bg-stone-950/80 border border-stone-800 hover:border-stone-700 focus:border-amber-500 rounded-xl px-4 py-3 text-stone-100 placeholder-stone-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="favorite"
              checked={favorite}
              onChange={e => setFavorite(e.target.checked)}
              className="w-4 h-4 rounded border-stone-800 text-amber-500 focus:ring-amber-500 bg-stone-950"
            />
            <label htmlFor="favorite" className="text-sm font-medium text-stone-300 select-none">
              Mark as Favorite
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-stone-950 font-bold rounded-xl shadow-lg transition-all shadow-amber-500/10"
            >
              Organize Idea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewIdeaModal;
