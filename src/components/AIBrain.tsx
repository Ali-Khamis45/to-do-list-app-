import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Brain, Sparkles, Plus, Trash2, Edit, Star, Archive, Search, 
  Send, GitFork, Link2, AlertTriangle, Lightbulb, Play, Check, 
  Calendar, Layers, Clock, TrendingUp, Target, Shield, HelpCircle, 
  ChevronRight, Award, History, Info, CheckSquare, Zap, Activity
} from 'lucide-react';
import { Idea, IdeaLink, IdeaCluster, IdeaExpansion, IdeaHistoryTimelineEvent } from '../brain/types';
import { autoClusterIdeas, searchIdeas } from '../brain/searchEngine';
import { organizeIdeaWithAI, expandIdeaWithAI, generateIdeaTasks } from '../brain/aiService';
import { Task } from '../types';
import { Goal } from '../goals/types';
import NewIdeaModal from './NewIdeaModal';

interface AIBrainProps {
  userId: string;
  ideas: Idea[];
  ideaLinks: IdeaLink[];
  tasks: Task[];
  goals: Goal[];
  onSaveIdea: (idea: Idea) => void;
  onDeleteIdea: (ideaId: string) => void;
  onSaveIdeaLink: (link: IdeaLink) => void;
  onDeleteIdeaLink: (linkId: string) => void;
  onAddTask: (task: Task) => void;
  onAddGoal: (goal: Goal) => void;
  onRefreshData: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Business: '#ec4899',   // Pink
  Health: '#10b981',     // Green
  Learning: '#3b82f6',   // Blue
  Technology: '#a855f7', // Purple
  Personal: '#f59e0b',   // Amber
  General: '#6b7280'     // Gray
};

const AIBrain: React.FC<AIBrainProps> = ({
  userId,
  ideas,
  ideaLinks,
  tasks,
  goals,
  onSaveIdea,
  onDeleteIdea,
  onSaveIdeaLink,
  onDeleteIdeaLink,
  onAddTask,
  onAddGoal,
  onRefreshData
}) => {
  // Navigation & Filter States
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'details' | 'expansion' | 'projects' | 'graph'>('details');
  const [isNewIdeaModalOpen, setIsNewIdeaModalOpen] = useState(false);

  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string; timestamp: Date }[]>([
    { sender: 'ai', text: 'Hello! I am your AI Second Brain. I have indexed all your ideas and project targets. Ask me to synthesize your goals, generate code roadmaps, or find similar ideas!', timestamp: new Date() }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Expansion & Tasks States
  const [selectedExpansion, setSelectedExpansion] = useState<IdeaExpansion | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<Task[]>([]);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [showTaskReview, setShowTaskReview] = useState(false);

  // Drag-and-drop Nodes coordinates state for SVG Graph
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const graphRef = useRef<SVGSVGElement>(null);

  // Auto-cluster ideas dynamically
  const { clusters, clusteredIdeas } = useMemo(() => {
    const { clusters: c, updatedIdeas: ui } = autoClusterIdeas(ideas, userId);
    return { clusters: c, clusteredIdeas: ui };
  }, [ideas, userId]);

  // Selected Idea resolver
  const selectedIdea = useMemo(() => {
    return ideas.find(i => i.id === selectedIdeaId) || null;
  }, [ideas, selectedIdeaId]);

  // Semantic search matches
  const filteredIdeas = useMemo(() => {
    return searchIdeas(clusteredIdeas, searchQuery);
  }, [clusteredIdeas, searchQuery]);

  // Initialize node positions for SVG Knowledge Graph
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const width = 600;
    const height = 400;
    ideas.forEach((idea, idx) => {
      // Place in circle orbits to look structured and beautiful
      const angle = (idx / (ideas.length || 1)) * 2 * Math.PI;
      const radius = 120 + (idx % 2) * 50;
      positions[idea.id] = {
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius
      };
    });
    setNodePositions(positions);
  }, [ideas]);

  // Auto Scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Auto Load Expansion details if available in local storage metadata or reload
  useEffect(() => {
    if (selectedIdea) {
      setSelectedExpansion(null);
      setGeneratedTasks([]);
      setShowTaskReview(false);
      
      // Load local expansion cache if stored inside content
      if (selectedIdea.content.includes('Summary:')) {
        // Mock load or prepare quick fetch triggers
      }
    }
  }, [selectedIdeaId]);

  // --- SVG Node Drag Handlers ---
  const handleNodeMouseDown = (ideaId: string) => {
    setDraggedNodeId(ideaId);
  };

  const handleGraphMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggedNodeId || !graphRef.current) return;
    const rect = graphRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setNodePositions(prev => ({
      ...prev,
      [draggedNodeId]: { x, y }
    }));
  };

  const handleGraphMouseUp = () => {
    setDraggedNodeId(null);
  };

  // --- Quick Capture Save ---
  const handleSaveQuickIdea = async (data: Omit<Idea, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newId = `idea-${Date.now()}`;
    const newIdea: Idea = {
      ...data,
      id: newId,
      userId,
      createdAt: today,
      updatedAt: today
    };

    // Save initial idea record
    onSaveIdea(newIdea);
    setSelectedIdeaId(newId);

    // AI Enrichment step
    try {
      const enriched = await organizeIdeaWithAI(newIdea);
      onSaveIdea({
        ...newIdea,
        ...enriched,
        updatedAt: today
      });
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  // --- AI Expand Idea ---
  const handleAIExpand = async () => {
    if (!selectedIdea) return;
    setIsExpanding(true);
    try {
      const expansion = await expandIdeaWithAI(selectedIdea);
      setSelectedExpansion(expansion);
      setActiveWorkspaceTab('expansion');
    } catch (err) {
      console.error(err);
    } finally {
      setIsExpanding(false);
    }
  };

  // --- AI Generate Tasks ---
  const handleAIGenerateTasks = async () => {
    if (!selectedIdea) return;
    setIsGeneratingTasks(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const items = await generateIdeaTasks(selectedIdea, today);
      setGeneratedTasks(items);
      setShowTaskReview(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  // --- Accept Generated Tasks ---
  const handleAcceptTasks = () => {
    if (!selectedIdea) return;
    generatedTasks.forEach(task => {
      onAddTask(task);
    });

    // Mark Idea as Project
    onSaveIdea({
      ...selectedIdea,
      isProject: true,
      projectProgress: 0,
      updatedAt: new Date().toISOString().split('T')[0]
    });

    setGeneratedTasks([]);
    setShowTaskReview(false);
    setActiveWorkspaceTab('projects');
    onRefreshData();
  };

  // --- Promote Idea to Goal ---
  const handlePromoteToGoal = () => {
    if (!selectedIdea) return;
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 3); // 3 months target by default

    const newGoal: Goal = {
      id: `g-promoted-${selectedIdea.id}-${Date.now()}`,
      userId,
      title: selectedIdea.title,
      description: selectedIdea.content,
      goalType: 'milestone',
      targetValue: 3,
      currentValue: 0,
      unit: 'milestones',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: targetDate.toISOString().split('T')[0],
      priority: selectedIdea.priority,
      category: selectedIdea.category,
      frequency: 'weekly',
      difficulty: 'medium',
      estimatedMinutesPerUnit: 60,
      status: 'active',
      tags: selectedIdea.tags,
      color: CATEGORY_COLORS[selectedIdea.category] || '#6b7280',
      icon: 'Target',
      milestones: [
        { id: `mil1-${selectedIdea.id}`, title: 'Research & System architecture blueprint', completed: false },
        { id: `mil2-${selectedIdea.id}`, title: 'First alpha deployment module release', completed: false },
        { id: `mil3-${selectedIdea.id}`, title: 'Beta test launch & marketing campaigns', completed: false }
      ],
      logs: [],
      subGoals: [],
      dependencies: [],
      history: [{ id: `h-${selectedIdea.id}`, goalId: `g-promoted-${selectedIdea.id}`, eventType: 'created', timestamp: new Date().toISOString(), description: 'Goal created from AI Brain promo' }]
    };

    onAddGoal(newGoal);
    alert(`Goal "${selectedIdea.title}" created successfully! Check the Smart Goals panel.`);
  };

  // --- Toggle Favorite / Archived ---
  const handleToggleFavorite = () => {
    if (!selectedIdea) return;
    onSaveIdea({
      ...selectedIdea,
      favorite: !selectedIdea.favorite,
      updatedAt: new Date().toISOString().split('T')[0]
    });
  };

  const handleToggleArchived = () => {
    if (!selectedIdea) return;
    onSaveIdea({
      ...selectedIdea,
      archived: !selectedIdea.archived,
      updatedAt: new Date().toISOString().split('T')[0]
    });
    setSelectedIdeaId(null);
  };

  // --- Chat Assistant Processor ---
  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: new Date() }]);
    setChatInput('');

    // Process user question locally matching stored ideas
    setTimeout(() => {
      const q = userMsg.toLowerCase();
      let reply = '';

      if (q.includes('startup') || q.includes('business')) {
        const startupIdeas = ideas.filter(i => i.category === 'Business' || i.tags.includes('startup'));
        if (startupIdeas.length > 0) {
          reply = `Here are your startup ideas:\n` + startupIdeas.map(i => `• **${i.title}** (${i.priority} priority)`).join('\n') + `\n\nWhich one would you like to build an MVP plan for?`;
        } else {
          reply = "You don't have any ideas categorized under Business or Startup yet. You can capture one by clicking 'New Idea'!";
        }
      } else if (q.includes('react') || q.includes('code') || q.includes('javascript') || q.includes('typescript')) {
        const codingIdeas = ideas.filter(i => i.tags.includes('coding') || i.tags.includes('react') || i.title.toLowerCase().includes('react') || i.content.toLowerCase().includes('react'));
        if (codingIdeas.length > 0) {
          reply = `Found these coding/React ideas in your brain index:\n` + codingIdeas.map(i => `• **${i.title}** - suggested tech: ${i.relatedTech?.join(', ') || 'N/A'}`).join('\n');
        } else {
          reply = "I couldn't find any ideas referencing React or programming tags. Try tags like 'coding' on your next capture.";
        }
      } else if (q.includes('weekend') || q.includes('next') || q.includes('work')) {
        // Recommend easiest high/medium priority favorite idea
        const recommendation = ideas
          .filter(i => !i.archived)
          .sort((a, b) => (a.complexity || 5) - (b.complexity || 5))[0];

        if (recommendation) {
          reply = `Based on your idea index, I suggest building:\n**${recommendation.title}**\n\nIt has a complexity of **${recommendation.complexity || 5}/10** and is estimated at **${recommendation.effort || 20} hours** to MVP. Would you like to generate the project todo checklist for this?`;
        } else {
          reply = "You have no unarchived ideas to suggest. Add a quick capture first!";
        }
      } else if (q.includes('combine') || q.includes('merge')) {
        // Combine ideas suggestions
        const similar = ideas.filter(i => i.category === 'Health');
        if (similar.length >= 2) {
          reply = `I suggest merging:\n1. **${similar[0].title}**\n2. **${similar[1].title}**\n\nThey both focus on the health sector. We could compile them into a unified fitness suite. Let me know if I should merge them.`;
        } else {
          reply = "To suggest a merge, please capture more ideas sharing similar categories (like Health or Business).";
        }
      } else if (q.includes('highest') || q.includes('potential') || q.includes('business')) {
        const premium = ideas.filter(i => i.priority === 'high' && i.category === 'Business')[0];
        if (premium) {
          reply = `The idea with the highest business potential is **${premium.title}** because it targeting a large market share and has clear monetization paths.`;
        } else {
          reply = "You don't have high priority Business ideas in your index. You can adjust the priority in the details panel.";
        }
      } else {
        // Generic search fallback
        const searchMatches = searchIdeas(ideas, userMsg);
        if (searchMatches.length > 0) {
          reply = `I searched your brain for "${userMsg}" and found these matches:\n` + searchMatches.map(i => `• **${i.title}**: ${i.content.substring(0, 80)}...`).join('\n');
        } else {
          reply = `I understand you're asking about "${userMsg}". Currently I am tracking ${ideas.length} ideas, ${ideaLinks.length} connections, and ${goals.length} active goals. Try asking 'Show startup ideas' or 'What should I work on next?'.`;
        }
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: reply, timestamp: new Date() }]);
    }, 800);
  };

  // --- Workspace Calculations & Stats ---
  const stats = useMemo(() => {
    const total = ideas.length;
    const implemented = ideas.filter(i => i.isProject).length;
    const favorites = ideas.filter(i => i.favorite).length;
    const activeProjects = ideas.filter(i => i.isProject && !i.archived);
    const avgProgress = activeProjects.length > 0
      ? Math.round(activeProjects.reduce((acc, p) => acc + (p.projectProgress || 0), 0) / activeProjects.length)
      : 0;

    return { total, implemented, favorites, avgProgress };
  }, [ideas]);

  // Project checklist resolver (find tasks linked to selected idea)
  const projectTasks = useMemo(() => {
    if (!selectedIdea) return [];
    return tasks.filter(t => t.projectId === selectedIdea.id || t.ideaId === selectedIdea.id);
  }, [tasks, selectedIdeaId]);

  const projectProgressCalculated = useMemo(() => {
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter(t => t.completed).length;
    return Math.round((completed / projectTasks.length) * 100);
  }, [projectTasks]);

  // Keep projectProgress state synchronized automatically
  useEffect(() => {
    if (selectedIdea && selectedIdea.isProject && selectedIdea.projectProgress !== projectProgressCalculated) {
      onSaveIdea({
        ...selectedIdea,
        projectProgress: projectProgressCalculated
      });
    }
  }, [projectProgressCalculated, selectedIdeaId]);

  return (
    <div className="space-y-6 animate-fade-in text-stone-100 max-w-7xl mx-auto p-2">
      
      {/* 🚀 Premium Dashboard Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-stone-900/40 border border-stone-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium">Ideas Created</p>
              <h3 className="text-2xl font-bold mt-0.5">{stats.total}</h3>
            </div>
          </div>
        </div>

        <div className="bg-stone-900/40 border border-stone-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium">Active Projects</p>
              <h3 className="text-2xl font-bold mt-0.5">{stats.implemented}</h3>
            </div>
          </div>
        </div>

        <div className="bg-stone-900/40 border border-stone-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium">Favorites</p>
              <h3 className="text-2xl font-bold mt-0.5">{stats.favorites}</h3>
            </div>
          </div>
        </div>

        <div className="bg-stone-900/40 border border-stone-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-400 font-medium">Avg Project Completion</p>
              <h3 className="text-2xl font-bold mt-0.5">{stats.avgProgress}%</h3>
            </div>
          </div>
        </div>
      </div>

      {/* 🤝 Daily AI Briefing Banner */}
      <div className="bg-stone-900/30 border border-stone-800/60 rounded-2xl p-5 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl shadow-inner animate-pulse mt-0.5">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-stone-100 flex items-center gap-2">
              Morning AI Brain Briefing
            </h4>
            <p className="text-sm text-stone-300 mt-1 leading-relaxed max-w-3xl">
              Good morning! You tracked **{stats.total} ideas** in your Brain Workspace. 
              {stats.implemented > 0 ? ` Your project "**AI-Powered Fitness & Workout App**" has active tasks. We recommend finishing its database modeling today.` : ' We suggest promoting your highest-priority idea into an active project checklist.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedIdeaId(ideas[0]?.id || null);
            setActiveWorkspaceTab('graph');
          }}
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl transition-all self-start md:self-center"
        >
          View Knowledge Graph
        </button>
      </div>

      {/* 🗃️ Splitted Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Ideas Explorer and Clusters list (Col-span 4) */}
        <div className="lg:col-span-4 bg-stone-900/40 border border-stone-800/80 rounded-3xl p-5 flex flex-col h-[750px] backdrop-blur-md">
          {/* Quick Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-stone-500" />
            <input
              type="text"
              placeholder="Semantic search (e.g. food, coding)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-stone-950/80 border border-stone-800/80 hover:border-stone-700 focus:border-amber-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-stone-200 placeholder-stone-600 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">My Clusters & Ideas</h4>
            <button
              onClick={() => setIsNewIdeaModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-bold rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Capture Idea
            </button>
          </div>

          {/* Clusters / Ideas Tree list */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {clusters.map(cluster => {
              // Find matching ideas in this cluster after filtering
              const clusterIdeas = filteredIdeas.filter(i => i.clusterId === cluster.id);
              if (clusterIdeas.length === 0) return null;

              return (
                <div key={cluster.id} className="space-y-1.5">
                  <div className="px-2 py-1 bg-stone-900/20 rounded-lg flex items-center justify-between border-l-2 border-stone-700">
                    <div>
                      <h5 className="text-xs font-bold text-stone-300">{cluster.name}</h5>
                      <p className="text-[10px] text-stone-500 truncate max-w-[200px]">{cluster.description}</p>
                    </div>
                    <span className="text-[9px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded-full font-mono">
                      {clusterIdeas.length}
                    </span>
                  </div>

                  <div className="space-y-1 pl-2">
                    {clusterIdeas.map(idea => {
                      const isSelected = selectedIdeaId === idea.id;
                      const catColor = CATEGORY_COLORS[idea.category] || '#6b7280';
                      return (
                        <div
                          key={idea.id}
                          onClick={() => setSelectedIdeaId(idea.id)}
                          className={`w-full text-left p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between gap-3 ${
                            isSelected 
                              ? 'bg-stone-850 border-amber-500/50 shadow-inner' 
                              : 'bg-stone-950/40 border-stone-800/40 hover:bg-stone-800/30 hover:border-stone-800'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                              <h6 className={`text-sm font-semibold truncate ${isSelected ? 'text-amber-400' : 'text-stone-200'}`}>
                                {idea.title}
                              </h6>
                              {idea.favorite && <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-stone-500 truncate mt-0.5">
                              {idea.content.replace(/Summary:.*/, '').trim()}
                            </p>
                          </div>
                          
                          {idea.isProject && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex-shrink-0">
                              Project
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {filteredIdeas.length === 0 && (
              <div className="text-center py-12 text-stone-600">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No ideas match your search query.</p>
              </div>
            )}
          </div>

          {/* Side Panel: Integrated AI Chat Assistant */}
          <div className="mt-4 pt-4 border-t border-stone-800 flex flex-col h-[280px]">
            <h5 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Brain Chatbot
            </h5>
            
            {/* Messages box */}
            <div className="flex-1 bg-stone-950/80 rounded-xl p-3 overflow-y-auto space-y-2 mb-2 text-xs scrollbar-thin border border-stone-900">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-none' 
                      : 'bg-stone-800/80 text-stone-200 rounded-tl-none border border-stone-800'
                  }`}>
                    {msg.text.split('\n').map((line, i) => (
                      <p key={i} className="mb-0.5">{line}</p>
                    ))}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input form */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask about AI, start-ups..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
                className="flex-1 bg-stone-950/60 border border-stone-850 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleSendChatMessage}
                className="p-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl transition-all flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Workspace and Details (Col-span 8) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Workspace Tabs Header */}
          <div className="bg-stone-900/40 border border-stone-800/80 rounded-2xl p-2 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveWorkspaceTab('details')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                  activeWorkspaceTab === 'details' ? 'bg-stone-800 text-amber-400' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Info className="w-3.5 h-3.5" /> Idea Details
              </button>

              <button
                onClick={() => {
                  if (selectedExpansion) setActiveWorkspaceTab('expansion');
                  else handleAIExpand();
                }}
                disabled={!selectedIdea}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                  !selectedIdea ? 'opacity-40 cursor-not-allowed' : ''
                } ${activeWorkspaceTab === 'expansion' ? 'bg-stone-800 text-amber-400' : 'text-stone-400 hover:text-stone-200'}`}
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Expansion {isExpanding && '...'}
              </button>

              <button
                onClick={() => setActiveWorkspaceTab('projects')}
                disabled={!selectedIdea}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                  !selectedIdea ? 'opacity-40 cursor-not-allowed' : ''
                } ${activeWorkspaceTab === 'projects' ? 'bg-stone-800 text-amber-400' : 'text-stone-400 hover:text-stone-200'}`}
              >
                <Layers className="w-3.5 h-3.5" /> Project Mode
              </button>

              <button
                onClick={() => setActiveWorkspaceTab('graph')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                  activeWorkspaceTab === 'graph' ? 'bg-stone-800 text-amber-400' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <GitFork className="w-3.5 h-3.5" /> Knowledge Graph
              </button>
            </div>
            
            {/* Quick Promo Actions */}
            {selectedIdea && (
              <div className="flex items-center gap-2 pr-2">
                <button
                  onClick={handleToggleFavorite}
                  className={`p-1.5 rounded-lg border transition-all ${
                    selectedIdea.favorite 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                      : 'border-stone-800 text-stone-500 hover:text-stone-300'
                  }`}
                  title="Favorite"
                >
                  <Star className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToggleArchived}
                  className="p-1.5 rounded-lg border border-stone-800 text-stone-500 hover:text-stone-300 transition-all"
                  title="Archive Idea"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this idea?')) {
                      onDeleteIdea(selectedIdea.id);
                      setSelectedIdeaId(null);
                    }
                  }}
                  className="p-1.5 rounded-lg border border-stone-800 text-stone-500 hover:text-red-400 transition-all"
                  title="Delete Idea"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ACTIVE TAB: Details View */}
          {activeWorkspaceTab === 'details' && selectedIdea && (
            <div className="bg-stone-900/40 border border-stone-800/80 rounded-3xl p-6 flex-1 backdrop-blur-md space-y-6">
              {/* Title & Metadata */}
              <div className="flex flex-col gap-1.5 border-b border-stone-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: `${CATEGORY_COLORS[selectedIdea.category] || '#6b7280'}20`, color: CATEGORY_COLORS[selectedIdea.category] || '#6b7280' }}>
                    {selectedIdea.category}
                  </span>
                  <span className="text-[10px] font-mono text-stone-500">
                    Created: {selectedIdea.createdAt}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-stone-100">{selectedIdea.title}</h3>
                {selectedIdea.mood && (
                  <p className="text-xs text-stone-400 font-medium">Vibe: {selectedIdea.mood}</p>
                )}
              </div>

              {/* Editable content body */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Concept Outline</h4>
                <div className="bg-stone-950/60 border border-stone-850 rounded-2xl p-4 min-h-[150px] text-stone-300 text-sm leading-relaxed whitespace-pre-line">
                  {selectedIdea.content}
                </div>
              </div>

              {/* Details Metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-stone-950/40 border border-stone-850 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-stone-400 mb-1">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Complexity</span>
                  </div>
                  <div className="text-lg font-bold text-stone-200">
                    {selectedIdea.complexity ? `${selectedIdea.complexity} / 10` : 'Not Measured'}
                  </div>
                </div>

                <div className="bg-stone-950/40 border border-stone-850 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-stone-400 mb-1">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Est. Effort</span>
                  </div>
                  <div className="text-lg font-bold text-stone-200">
                    {selectedIdea.effort ? `${selectedIdea.effort} hours` : 'Not Measured'}
                  </div>
                </div>

                <div className="bg-stone-950/40 border border-stone-850 p-4 rounded-2xl col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 text-stone-400 mb-1">
                    <Link2 className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Linked Tech</span>
                  </div>
                  <div className="text-xs font-semibold text-stone-300 truncate">
                    {selectedIdea.relatedTech && selectedIdea.relatedTech.length > 0
                      ? selectedIdea.relatedTech.join(', ')
                      : 'None detected'}
                  </div>
                </div>
              </div>

              {/* Tags Cloud */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Brain Tags Index</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedIdea.tags.map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg cursor-default transition-all">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Promote Triggers */}
              <div className="flex flex-wrap gap-3 pt-6 border-t border-stone-800/80">
                <button
                  onClick={handlePromoteToGoal}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-stone-100 font-bold rounded-xl shadow-lg transition-all"
                >
                  <Target className="w-4 h-4" /> Convert to Goal
                </button>
                
                <button
                  onClick={handleAIGenerateTasks}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-stone-100 font-bold rounded-xl shadow-lg transition-all"
                >
                  <Layers className="w-4 h-4" /> Convert to Project
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE TAB: AI Expansion View */}
          {activeWorkspaceTab === 'expansion' && selectedIdea && selectedExpansion && (
            <div className="bg-stone-900/40 border border-stone-800/80 rounded-3xl p-6 flex-1 backdrop-blur-md space-y-6 overflow-y-auto max-h-[670px] scrollbar-thin">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" /> AI Blueprint Analysis
                </h3>
                <button
                  onClick={handleAIExpand}
                  className="text-xs font-bold text-amber-400 hover:underline"
                >
                  Regenerate Blueprint
                </button>
              </div>

              {/* Expansion Grid Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-stone-950/40 border border-stone-850 p-5 rounded-2xl space-y-2">
                  <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> Business Opportunities
                  </h4>
                  <ul className="text-xs text-stone-300 space-y-1.5 list-disc pl-4">
                    {selectedExpansion.businessOpportunities.map((o, idx) => (
                      <li key={idx}>{o}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-stone-950/40 border border-stone-850 p-5 rounded-2xl space-y-2">
                  <h4 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Risks & Pitfalls
                  </h4>
                  <ul className="text-xs text-stone-300 space-y-1.5 list-disc pl-4">
                    {selectedExpansion.risks.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-stone-950/40 border border-stone-850 p-5 rounded-2xl space-y-2">
                  <h4 className="text-sm font-bold text-purple-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Unique Selling Points (USPs)
                  </h4>
                  <ul className="text-xs text-stone-300 space-y-1.5 list-disc pl-4">
                    {selectedExpansion.usps.map((u, idx) => (
                      <li key={idx}>{u}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-stone-950/40 border border-stone-850 p-5 rounded-2xl space-y-2">
                  <h4 className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> MVP Plan
                  </h4>
                  <ul className="text-xs text-stone-300 space-y-1.5 list-disc pl-4">
                    {selectedExpansion.mvpPlan.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-stone-950/40 border border-stone-850 p-5 rounded-2xl col-span-1 md:col-span-2 space-y-2">
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" /> Roadmap Stages
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selectedExpansion.roadmap.map((phase, idx) => (
                      <div key={idx} className="bg-stone-900/60 p-3 rounded-xl border border-stone-800">
                        <div className="text-[10px] font-bold text-amber-500 uppercase">Phase {idx + 1}</div>
                        <p className="text-xs text-stone-300 mt-1">{phase}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-stone-950/40 border border-stone-850 p-5 rounded-2xl space-y-2">
                  <h4 className="text-sm font-bold text-stone-300">Monetization</h4>
                  <ul className="text-xs text-stone-400 space-y-1 list-disc pl-4">
                    {selectedExpansion.monetization.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-stone-950/40 border border-stone-850 p-5 rounded-2xl space-y-2">
                  <h4 className="text-sm font-bold text-stone-300">Suggested Tech Stack</h4>
                  <ul className="text-xs text-stone-400 space-y-1 list-disc pl-4">
                    {selectedExpansion.suggestedTech.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE TAB: Project Mode */}
          {activeWorkspaceTab === 'projects' && selectedIdea && (
            <div className="bg-stone-900/40 border border-stone-800/80 rounded-3xl p-6 flex-1 backdrop-blur-md space-y-6 overflow-y-auto max-h-[670px] scrollbar-thin">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" /> Project Workspace & Tasks
                </h3>
                {selectedIdea.isProject && (
                  <div className="text-xs text-stone-400">
                    Project Progress: <span className="font-bold text-emerald-400">{projectProgressCalculated}%</span>
                  </div>
                )}
              </div>

              {selectedIdea.isProject ? (
                <div className="space-y-6">
                  {/* Progress Bar */}
                  <div className="w-full bg-stone-950 rounded-full h-3.5 border border-stone-800 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${projectProgressCalculated}%` }}
                    />
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Project Tasks Checklist</h4>
                    <div className="space-y-2">
                      {projectTasks.map(task => (
                        <div key={task.id} className="bg-stone-950/60 border border-stone-850 p-4 rounded-xl flex items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-1 text-emerald-400 mt-0.5">
                              {task.completed ? (
                                <CheckSquare className="w-4.5 h-4.5" />
                              ) : (
                                <Layers className="w-4.5 h-4.5 text-stone-600" />
                              )}
                            </div>
                            <div>
                              <h5 className={`text-sm font-semibold ${task.completed ? 'line-through text-stone-500' : 'text-stone-200'}`}>
                                {task.title}
                              </h5>
                              <p className="text-xs text-stone-500 mt-0.5">{task.subtext}</p>
                            </div>
                          </div>
                          
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-stone-800 text-stone-400'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-stone-950/20 border border-dashed border-stone-800 rounded-2xl">
                  <Layers className="w-12 h-12 mx-auto text-stone-600 mb-3" />
                  <h4 className="text-base font-bold text-stone-300">This idea is not a project yet</h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1.5 mb-6">
                    Promoting this idea to a project will generate an Epic, Feature, and Subtask tree. They will sync to your main Todo list.
                  </p>
                  <button
                    onClick={handleAIGenerateTasks}
                    disabled={isGeneratingTasks}
                    className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-stone-950 font-bold rounded-xl shadow-lg transition-all"
                  >
                    {isGeneratingTasks ? 'Generating Tasks...' : 'Activate Project Mode'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE TAB: Knowledge Graph View */}
          {activeWorkspaceTab === 'graph' && (
            <div className="bg-stone-900/40 border border-stone-800/80 rounded-3xl p-6 flex-1 backdrop-blur-md flex flex-col h-[670px] relative overflow-hidden">
              <div className="border-b border-stone-800 pb-3 mb-4">
                <h3 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-amber-400" /> Interactive Ideas Connection Graph
                </h3>
                <p className="text-xs text-stone-500">Drag nodes to organize connections visually. Click a node to select it.</p>
              </div>

              {/* Renders Draggable SVG network nodes */}
              <div className="flex-1 bg-stone-950/60 rounded-2xl relative border border-stone-900">
                <svg
                  ref={graphRef}
                  width="100%"
                  height="100%"
                  onMouseMove={handleGraphMouseMove}
                  onMouseUp={handleGraphMouseUp}
                  onMouseLeave={handleGraphMouseUp}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#444" />
                    </marker>
                  </defs>

                  {/* Draw links / edges */}
                  {ideaLinks.map((link, idx) => {
                    const sourcePos = nodePositions[link.sourceIdeaId];
                    const targetPos = nodePositions[link.targetIdeaId];
                    if (!sourcePos || !targetPos) return null;

                    return (
                      <g key={link.id || idx}>
                        <line
                          x1={sourcePos.x}
                          y1={sourcePos.y}
                          x2={targetPos.x}
                          y2={targetPos.y}
                          stroke={link.type === 'depends_on' ? '#f87171' : link.type === 'extends' ? '#60a5fa' : '#fbbf24'}
                          strokeWidth="2"
                          strokeDasharray={link.type === 'similar_to' ? '5,5' : '0'}
                          markerEnd="url(#arrow)"
                          opacity="0.6"
                        />
                        <text
                          x={(sourcePos.x + targetPos.x) / 2}
                          y={(sourcePos.y + targetPos.y) / 2 - 5}
                          fill="#777"
                          fontSize="9"
                          textAnchor="middle"
                          className="bg-stone-950"
                        >
                          {link.type.replace('_', ' ')}
                        </text>
                      </g>
                    );
                  })}

                  {/* Draw nodes */}
                  {ideas.map(idea => {
                    const pos = nodePositions[idea.id];
                    if (!pos) return null;
                    const isSelected = selectedIdeaId === idea.id;
                    const color = CATEGORY_COLORS[idea.category] || '#6b7280';

                    return (
                      <g
                        key={idea.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIdeaId(idea.id);
                          setActiveWorkspaceTab('details');
                        }}
                      >
                        <circle
                          r={isSelected ? "18" : "14"}
                          fill={color}
                          stroke="#1c1917"
                          strokeWidth="3"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleNodeMouseDown(idea.id);
                          }}
                          className="transition-all hover:scale-110 shadow-lg"
                        />
                        {/* Text labels */}
                        <text
                          y="32"
                          fill={isSelected ? '#f59e0b' : '#d6d3d1'}
                          fontSize="10"
                          fontWeight={isSelected ? 'bold' : 'normal'}
                          textAnchor="middle"
                          className="select-none pointer-events-none filter drop-shadow-md"
                        >
                          {idea.title.substring(0, 18)}{idea.title.length > 18 ? '...' : ''}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* Fallback Empty state when no idea selected */}
          {!selectedIdea && activeWorkspaceTab !== 'graph' && (
            <div className="bg-stone-900/40 border border-stone-800/80 rounded-3xl p-16 flex-1 flex flex-col items-center justify-center text-center backdrop-blur-md">
              <Brain className="w-16 h-16 text-stone-600 mb-4 animate-pulse" />
              <h3 className="text-xl font-bold text-stone-300">Welcome to your AI Brain Workspace</h3>
              <p className="text-sm text-stone-500 max-w-md mt-2">
                Select an idea from the sidebar, search keywords semantically, or check the Visual Knowledge Graph network to begin organizing.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Review Generated Tasks before Accepting */}
      {showTaskReview && selectedIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-stone-100 mb-2">Review AI Generated Project Tasks</h3>
            <p className="text-xs text-stone-400 mb-4">
              These tasks will be saved in your database and appear directly in your Todo List.
            </p>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
              {generatedTasks.map((t, idx) => (
                <div key={idx} className="bg-stone-950 border border-stone-850 p-4 rounded-xl flex items-start justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-semibold text-stone-200">{t.title}</h5>
                    <p className="text-xs text-stone-500 mt-1">{t.subtext}</p>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800 mt-6">
              <button
                onClick={() => setShowTaskReview(false)}
                className="px-4 py-2 bg-stone-850 hover:bg-stone-800 text-stone-300 font-semibold rounded-xl"
              >
                Reject / Edit
              </button>
              <button
                onClick={handleAcceptTasks}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-stone-950 font-bold rounded-xl"
              >
                Accept and Sync Tasks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quick Capture */}
      <NewIdeaModal
        isOpen={isNewIdeaModalOpen}
        onClose={() => setIsNewIdeaModalOpen(false)}
        onSave={handleSaveQuickIdea}
      />
    </div>
  );
};

export default AIBrain;
