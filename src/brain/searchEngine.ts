/**
 * @module searchEngine
 * @description Semantic search and automatic idea clustering for the AI Brain Workspace.
 *
 * Provides two primary services without requiring external APIs or embeddings:
 *
 * 1. SEMANTIC SEARCH (searchIdeas)
 *    - Tokenizes the query into words
 *    - Expands each token using a local keyword dictionary (thesaurus)
 *    - Scores each idea by field weight: title (+10), tags (+5), content (+1.5/occurrence)
 *    - Returns ideas sorted descending by relevance score
 *
 *    Example: searching "food" also matches ideas containing
 *    restaurant, cooking, recipes, meal planner, nutrition, food delivery
 *
 * 2. AUTO-CLUSTERING (autoClusterIdeas)
 *    - Matches ideas against 5 predefined cluster specs
 *    - Uses tag overlap, category match, and content substring matching
 *    - Assigns `clusterId` directly on each Idea object
 *    - Remaining unmatched ideas fall into a "General Notes" cluster
 *    - Called reactively via useMemo in AIBrain.tsx — zero cost on unchanged data
 *
 * Clusters defined:
 *   - Food & Culinary Tech (food, restaurant, cooking, meal, nutrition)
 *   - Health & Personal Fitness (health, fitness, gym, workout, diet)
 *   - Software & SaaS Development (coding, programming, web, react, saas)
 *   - Finance & Saving Tools (money, finance, savings, invest, stripe)
 *   - Personal Education & Study (learning, education, study, books, skills)
 */
import { Idea, IdeaCluster } from './types';

// Hardcoded semantic keyword dictionary to simulate local embeddings expansion
const SEMANTIC_DICTIONARY: Record<string, string[]> = {
  food: ['restaurant', 'cooking', 'recipes', 'meal planner', 'nutrition', 'food delivery', 'groceries', 'diet', 'dine'],
  health: ['gym', 'fitness', 'diet', 'exercise', 'weight', 'workout', 'running', 'nutrition', 'meal', 'body', 'muscle'],
  coding: ['programming', 'developer', 'react', 'typescript', 'software', 'app', 'saas', 'backend', 'frontend', 'database', 'git', 'web'],
  startup: ['business', 'saas', 'monetize', 'marketing', 'mvp', 'pitch', 'launch', 'product', 'company', 'startup', 'founders'],
  money: ['finance', 'savings', 'invest', 'stripe', 'billing', 'monetization', 'business', 'cash', 'revenue'],
  learning: ['education', 'study', 'books', 'skills', 'lessons', 'course', 'languages', 'practice']
};

/**
 * Perform semantic-aware search on a list of ideas.
 * Expands query tokens using a dictionary, then scores matches by title, content, and tags.
 */
export const searchIdeas = (ideas: Idea[], query: string): Idea[] => {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return ideas;

  const queryTokens = normalizedQuery.split(/\s+/);
  
  // Expand tokens semantically
  const expandedTokens = new Set<string>();
  queryTokens.forEach(token => {
    expandedTokens.add(token);
    
    // Add related terms from our vocabulary dictionary
    Object.entries(SEMANTIC_DICTIONARY).forEach(([key, synonyms]) => {
      if (key === token || synonyms.includes(token)) {
        expandedTokens.add(key);
        synonyms.forEach(syn => expandedTokens.add(syn));
      }
    });
  });

  // Score each idea based on query occurrences
  const scoredIdeas = ideas.map(idea => {
    let score = 0;
    const titleLower = idea.title.toLowerCase();
    const contentLower = idea.content.toLowerCase();
    const tagsLower = idea.tags.map(t => t.toLowerCase());

    expandedTokens.forEach(token => {
      // Score multipliers based on field importance
      if (titleLower.includes(token)) score += 10;
      if (tagsLower.includes(token)) score += 5;
      
      // Simple regex count for content occurrences
      const contentMatches = contentLower.match(new RegExp(token, 'g'));
      if (contentMatches) score += contentMatches.length * 1.5;
    });

    return { idea, score };
  });

  // Filter out zero matches and sort descending by score
  return scoredIdeas
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.idea);
};

/**
 * Automatically groups ideas into clusters based on tag similarity and category overlap.
 */
export const autoClusterIdeas = (ideas: Idea[], userId: string): { clusters: IdeaCluster[]; updatedIdeas: Idea[] } => {
  if (ideas.length === 0) return { clusters: [], updatedIdeas: [] };

  const clusters: IdeaCluster[] = [];
  const updatedIdeas = ideas.map(i => ({ ...i }));

  // Predefined cluster templates based on common topics
  const clusterSpecs = [
    { id: 'c-food', name: 'Food & Culinary Tech', keywords: ['food', 'restaurant', 'cooking', 'recipes', 'meal', 'nutrition'], desc: 'Innovative applications related to meal preparation, restaurant tech, and dietary tracking.' },
    { id: 'c-health', name: 'Health & Personal Fitness', keywords: ['health', 'fitness', 'gym', 'workout', 'diet', 'weight'], desc: 'Trackers, planning tools, and guides to optimize physical fitness and diet regimes.' },
    { id: 'c-coding', name: 'Software & SaaS Development', keywords: ['coding', 'programming', 'web', 'app', 'react', 'typescript', 'saas', 'database'], desc: 'Startup projects, portfolio apps, and tools built using modern software design methodologies.' },
    { id: 'c-finance', name: 'Finance & Saving Tools', keywords: ['money', 'finance', 'savings', 'invest', 'stripe', 'monetize'], desc: 'Financial planning, accounting, and cashflow optimization side-projects.' },
    { id: 'c-learning', name: 'Personal Education & Study', keywords: ['learning', 'education', 'study', 'books', 'skills', 'languages'], desc: 'Goals relating to books lists, language lessons, and skill acquisition tracks.' }
  ];

  // Map ideas to clusters based on matching keywords / tags
  clusterSpecs.forEach(spec => {
    const matchingIdeas = updatedIdeas.filter(idea => {
      if (idea.clusterId) return false; // Already clustered
      
      // Check tags and category
      const matchesTag = idea.tags.some(tag => spec.keywords.includes(tag.toLowerCase()));
      const matchesCategory = spec.keywords.includes(idea.category.toLowerCase());
      const matchesContent = spec.keywords.some(kw => idea.title.toLowerCase().includes(kw) || idea.content.toLowerCase().includes(kw));

      return matchesTag || matchesCategory || matchesContent;
    });

    if (matchingIdeas.length > 0) {
      // Create cluster entry
      clusters.push({
        id: spec.id,
        userId,
        name: spec.name,
        description: spec.desc,
        tags: spec.keywords,
        ideasCount: matchingIdeas.length
      });

      // Update ideas reference
      matchingIdeas.forEach(idea => {
        idea.clusterId = spec.id;
      });
    }
  });

  // Group remaining ideas into an 'Uncategorized' or custom tag-based clusters
  const unclustered = updatedIdeas.filter(idea => !idea.clusterId);
  if (unclustered.length > 0) {
    // Group remaining into 'General Notes & Concepts'
    const genClusterId = 'c-general';
    clusters.push({
      id: genClusterId,
      userId,
      name: 'General Notes & Concepts',
      description: 'Miscellaneous thoughts, notes, and unclassified creative suggestions.',
      tags: ['notes', 'general'],
      ideasCount: unclustered.length
    });

    unclustered.forEach(idea => {
      idea.clusterId = genClusterId;
    });
  }

  return { clusters, updatedIdeas };
};
