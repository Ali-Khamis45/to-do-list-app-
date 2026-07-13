/**
 * @module aiService
 * @description AI generation engine for the AI Brain Workspace.
 *
 * Provides three async functions that each attempt a Gemini API call first,
 * then fall back to a rich local rule-based engine if the API key is absent
 * or the call fails. This ensures the app is fully functional offline.
 *
 * API Integration:
 *   - Model: gemini-2.5-flash
 *   - Key: VITE_GEMINI_API_KEY environment variable
 *   - All prompts request raw JSON responses (no markdown wrapping)
 *
 * Exported functions:
 *
 * organizeIdeaWithAI(idea)
 *   → Classifies, tags, estimates complexity (1-10) and effort (hours)
 *   → Detects related technologies from content keywords
 *   → Returns Partial<Idea> with enriched fields to merge into existing idea
 *
 * expandIdeaWithAI(idea)
 *   → Full 17-dimension product analysis
 *   → Returns IdeaExpansion with: relatedIdeas, improvements, risks,
 *      businessOpportunities, challenges, features, mvpPlan, roadmap,
 *      suggestedTech, learningResources, nextSteps, monetization,
 *      targetUsers, competitors, usps, missingPieces, criticalQuestions
 *
 * generateIdeaTasks(idea, targetDate)
 *   → Converts idea description into 5-6 structured project tasks
 *   → Each task includes title, subtext, priority, estimated hours
 *   → Returns Task[] objects ready for UserRepository.saveTask()
 *   → Generated tasks carry projectId and ideaId for AI Brain filtering
 *
 * Local fallbacks provide category-specific templates:
 *   - Learning/Books template
 *   - Software/SaaS template (default)
 */
import { GoogleGenAI } from '@google/genai';
import { Idea, IdeaExpansion } from './types';
import { Task } from '../types';

/**
 * AI Service for the Second Brain.
 * Interacts with Google's Gemini SDK if API Key is configured, with a robust fallback.
 */

// Helper to check if a valid Gemini API key is configured
const getApiKey = (): string => {
  return (import.meta.env?.VITE_GEMINI_API_KEY as string) || '';
};

/**
 * Automatically classifies, tags, summarizes, and estimates complexity for an idea.
 */
export const organizeIdeaWithAI = async (idea: Idea): Promise<Partial<Idea>> => {
  const key = getApiKey();
  
  if (key && key !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const prompt = `
        You are an AI note organization processor. Analyze this idea note:
        - Title: "${idea.title}"
        - Content: "${idea.content}"
        - Category: "${idea.category}"

        Respond ONLY with a JSON object of this structure:
        {
          "tags": ["tag1", "tag2"],
          "complexity": 5, // 1 to 10 scale
          "effort": 40, // estimated hours to implement/complete
          "relatedTech": ["React", "Stripe"],
          "contentSummary": "One-line clear summary of the core concept"
        }
        Do not add markdown formatting or backticks around the JSON. Return only the raw JSON.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.text) {
        const data = JSON.parse(response.text.trim());
        return {
          tags: [...new Set([...idea.tags, ...(data.tags || [])])],
          complexity: Number(data.complexity) || 5,
          effort: Number(data.effort) || 30,
          relatedTech: data.relatedTech || [],
          content: `${idea.content}\n\nSummary: ${data.contentSummary}`
        };
      }
    } catch (err) {
      console.warn('Gemini organizeIdea failed, using local fallback.', err);
    }
  }

  // --- Local Fallback Classifier ---
  const text = (idea.title + ' ' + idea.content).toLowerCase();
  const tags = [...idea.tags];
  const relatedTech: string[] = [];
  let complexity = 3;
  let effort = 10;

  // Keyword scanners
  if (text.includes('react') || text.includes('vue') || text.includes('frontend')) {
    tags.push('frontend', 'web');
    relatedTech.push('React', 'TypeScript', 'Vite');
    complexity = 5;
    effort = 30;
  }
  if (text.includes('backend') || text.includes('api') || text.includes('node') || text.includes('database')) {
    tags.push('backend', 'database');
    relatedTech.push('Node.js', 'Express', 'PostgreSQL');
    complexity = 6;
    effort = 40;
  }
  if (text.includes('ai') || text.includes('gemini') || text.includes('llm') || text.includes('learning')) {
    tags.push('ai', 'cognitive');
    relatedTech.push('Gemini AI API', 'Python');
    complexity = 8;
    effort = 80;
  }
  if (text.includes('money') || text.includes('save') || text.includes('stripe') || text.includes('sell')) {
    tags.push('finance', 'monetization');
    relatedTech.push('Stripe API', 'TailwindCSS');
    complexity = 6;
    effort = 35;
  }
  if (text.includes('gym') || text.includes('fit') || text.includes('weight') || text.includes('run')) {
    tags.push('fitness', 'health');
    complexity = 4;
    effort = 20;
  }

  // Clean duplicates
  const finalTags = [...new Set(tags)];

  return {
    tags: finalTags,
    complexity,
    effort,
    relatedTech,
    content: idea.content.includes('Summary:') 
      ? idea.content 
      : `${idea.content}\n\nSummary: A custom ${idea.category || 'notes'} project outline targeting ${idea.title}.`
  };
};

/**
 * Expands an idea dynamically, creating potential USPs, MVP plans, Roadmaps, and monetizations.
 */
export const expandIdeaWithAI = async (idea: Idea): Promise<IdeaExpansion> => {
  const key = getApiKey();

  if (key && key !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const prompt = `
        You are an elite product architect and startup incubator coach. Expand this idea:
        - Title: "${idea.title}"
        - Category: "${idea.category}"
        - Description: "${idea.content}"

        Respond ONLY with a JSON object conforming exactly to this schema:
        {
          "relatedIdeas": ["idea1", "idea2"],
          "improvements": ["suggestion1", "suggestion2"],
          "risks": ["risk1", "risk2"],
          "businessOpportunities": ["opp1", "opp2"],
          "challenges": ["challenge1", "challenge2"],
          "features": ["feature1", "feature2"],
          "mvpPlan": ["step1", "step2"],
          "roadmap": ["phase1", "phase2"],
          "suggestedTech": ["tech1", "tech2"],
          "learningResources": ["resource1", "resource2"],
          "nextSteps": ["step1", "step2"],
          "monetization": ["model1", "model2"],
          "targetUsers": ["userGroup1", "userGroup2"],
          "competitors": ["comp1", "comp2"],
          "usps": ["usp1", "usp2"],
          "missingPieces": ["piece1", "piece2"],
          "criticalQuestions": ["question1", "question2"]
        }
        Do not add markdown formatting or backticks around the JSON. Return only the raw JSON.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.text) {
        return JSON.parse(response.text.trim());
      }
    } catch (err) {
      console.warn('Gemini expandIdea failed, using local fallback.', err);
    }
  }

  // --- Local Fallback Generator Templates based on category ---
  const cat = (idea.category || 'general').toLowerCase();
  
  if (cat === 'learning' || cat.includes('book') || cat.includes('study')) {
    return {
      relatedIdeas: ['Speed reading training tracker', 'AI Book Summary compiler', 'Language learning flashcard stack'],
      improvements: ['Incorporate spaced-repetition schedules', 'Add active recall testing popups', 'Log reviews in an online journal'],
      risks: ['Procrastination and streak loss', 'Cognitive overload from logging too much information', 'Low absorption of complex material'],
      businessOpportunities: ['Create paid review courses', 'Build study group memberships', 'Publish book reviews on medium/blog'],
      challenges: ['Time management during busy periods', 'Maintaining concentration during active recall', 'Structuring study materials'],
      features: ['Daily text cards summaries', 'Active recall quiz dashboard', 'Progress indicators for lessons'],
      mvpPlan: ['Select study resources', 'Draft daily reading calendar', 'Implement local notes summary database'],
      roadmap: ['Phase 1: Basic reading & highlights logging', 'Phase 2: Automated quiz generators', 'Phase 3: Community study decks sync'],
      suggestedTech: ['Markdown notes', 'Anki API', 'Notion Database'],
      learningResources: ['Atomic Habits by James Clear', 'Learning How to Learn (Coursera)', 'Spaced Repetition Wiki page'],
      nextSteps: ['Outline the first 5 study chapters', 'Configure daily 30m reading block in Calendar', 'Setup learning folder'],
      monetization: ['Sponsorships on summary blogs', 'Paid premium flashcard decks', 'Patreon study guides'],
      targetUsers: ['Students', 'Self-taught developers', 'Lifelong learners'],
      competitors: ['Blinkist', 'Anki app', 'Duolingo'],
      usps: ['Integrates directly into daily planner tasks', 'Uses cognitive metrics to calculate recall decay', 'AI-guided focus sessions'],
      missingPieces: ['Specific exam/test date timelines', 'Access to study guides / books', 'Partner accountability system'],
      criticalQuestions: ['How many pages can I absorb per day?', 'What topics yield the highest career output?', 'How will I test recall?']
    };
  }

  // Software / SaaS startup template
  return {
    relatedIdeas: ['AI-powered Todo organizer', 'Automatic micro-monetization engine', 'Developer portfolio template generator'],
    improvements: ['Offer automated backups', 'Include dark-mode layouts and micro-interactions', 'Integrate payment gateways early'],
    risks: ['Scope creep delaying shipping dates', 'No demand for the core MVP utility', 'Technical debt in database configurations'],
    businessOpportunities: ['SaaS Monthly Subscription plans', 'One-time template exports licensing', 'Corporate developer team plans'],
    challenges: ['Setting up robust authentication layers', 'Integrating APIs with low latency rates', 'Building database isolated repositories'],
    features: ['Frictionless idea quick capture', 'Auto-generated todo checklists', 'SVG visualizations and metrics dashboards'],
    mvpPlan: ['Define DB models and repository methods', 'Build responsive Tailwind UI layouts', 'Test task sync flow manually'],
    roadmap: ['Phase 1: Frontend MVP with LocalStorage', 'Phase 2: Node Express backend deployment', 'Phase 3: Payment integration & marketing'],
    suggestedTech: ['React 19', 'TypeScript', 'TailwindCSS v4', 'Gemini SDK', 'Vite'],
    learningResources: ['The Lean Startup by Eric Ries', 'Vite documentation', 'Google GenAI SDK guides'],
    nextSteps: ['Draft system wireframes', 'Create new repository', 'Outline first 3 features to build'],
    monetization: ['SaaS $9/month basic tier', 'Whitelabel licensing', 'Freemium with advanced SVGs locked'],
    targetUsers: ['Solo developers', 'Product designers', 'Agile project managers'],
    competitors: ['Notion Goals', 'Todoist Premium', 'Motion', 'ClickUp'],
    usps: ['Converts raw brain-dump ideas into Todo items with 1 click', 'SVG graphs visualize goal-to-goal dependencies', 'Defensive local storage recovery'],
    missingPieces: ['Landing page mockups', 'User feedback questionnaires', 'OAuth login providers configuration'],
    criticalQuestions: ['Does the user prefer simple text or graphs?', 'What is the fastest path to MVP release?', 'How will we seed test data?']
  };
};

/**
 * Generate structural tasks (Epics, Features, Subtasks) from an idea to sync to the Todo list.
 */
export const generateIdeaTasks = async (idea: Idea, targetDateStr: string): Promise<Task[]> => {
  const key = getApiKey();
  const todayStr = new Date().toISOString().split('T')[0];

  if (key && key !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const prompt = `
        You are a Staff Project Manager. Translate this product idea note into a list of 5 actionable tasks for a developer/user:
        - Idea Title: "${idea.title}"
        - Description: "${idea.content}"

        Respond ONLY with a JSON array conforming exactly to this structure:
        [
          {
            "title": "Epic Name: Feature Objective",
            "subtext": "Short actionable checklist description",
            "priority": "medium", // low, medium, high
            "estimatedHours": 4 // estimated hours to code
          }
        ]
        Do not add markdown formatting or backticks around the JSON. Return only the raw JSON.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.text) {
        const list = JSON.parse(response.text.trim());
        if (Array.isArray(list)) {
          return list.map((item, idx) => ({
            id: `pt-${idea.id}-${idx}-${Date.now()}`,
            title: item.title,
            time: '10:00',
            subtext: item.subtext || `Estimated: ${item.estimatedHours || 2} hours`,
            completed: false,
            date: targetDateStr || todayStr,
            category: idea.category || 'Project',
            priority: item.priority || 'medium',
            notes: `Project Task Generated from Idea: "${idea.title}"`,
            createdAt: todayStr,
            logs: {}
          }));
        }
      }
    } catch (err) {
      console.warn('Gemini generateIdeaTasks failed, using local fallback.', err);
    }
  }

  // --- Local Fallback Project Task Generator ---
  const tasksList = [
    { title: 'Project Setup & Architecture Wireframing', subtext: 'Configure repository, directory structure, and UI layout wireframes.', hours: 4, priority: 'high' },
    { title: 'System Database Schema Modelling', subtext: 'Map repository types, local storage keys, and isolate user profiles.', hours: 3, priority: 'medium' },
    { title: 'Core UI Layout Implementation', subtext: 'Build responsive glassmorphic cards, checklists, and navigation menus.', hours: 6, priority: 'medium' },
    { title: 'AI Coach / Enrichment Integrations', subtext: 'Connect to external endpoints, fallback templates, and message logs.', hours: 5, priority: 'high' },
    { title: 'SVG Charts & Performance Analytics', subtext: 'Draw cumulative progress lines, forecasted estimates, and heatmaps.', hours: 6, priority: 'medium' },
    { title: 'Production Build, Testing, & Deploy', subtext: 'Run typescript checks, bundle source files, and deploy to hosting server.', hours: 4, priority: 'low' }
  ];

  return tasksList.map((item, idx) => ({
    id: `pt-${idea.id}-${idx}-${Date.now()}`,
    title: `${idea.title} - ${item.title}`,
    time: '10:00',
    subtext: `${item.subtext} (Estimated: ${item.hours}h)`,
    completed: false,
    date: targetDateStr || todayStr,
    category: idea.category || 'Project',
    priority: item.priority as any,
    notes: `Project Task Generated from Idea: "${idea.title}"`,
    createdAt: todayStr,
    logs: {}
  }));
};
