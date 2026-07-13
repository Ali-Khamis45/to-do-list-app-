export interface Idea {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string; // YYYY-MM-DD
  updatedAt: string; // YYYY-MM-DD
  priority: 'low' | 'medium' | 'high';
  category: string;
  mood?: string;
  favorite: boolean;
  archived: boolean;
  complexity?: number; // Estimated 1-10 difficulty
  effort?: number;     // Estimated effort in hours/days
  relatedTech?: string[];
  clusterId?: string;
  isProject?: boolean;
  projectProgress?: number; // 0 to 100
}

export interface IdeaLink {
  id: string;
  userId: string;
  sourceIdeaId: string;
  targetIdeaId: string;
  type: 'depends_on' | 'extends' | 'similar_to';
}

export interface IdeaCluster {
  id: string;
  userId: string;
  name: string;
  description: string;
  tags: string[];
  ideasCount: number;
}

export interface IdeaHistoryTimelineEvent {
  id: string;
  ideaId: string;
  type: 'created' | 'expanded' | 'converted_to_project' | 'converted_to_goal' | 'task_generated' | 'notes_updated';
  timestamp: string; // ISO string
  description: string;
}

export interface IdeaExpansion {
  relatedIdeas: string[];
  improvements: string[];
  risks: string[];
  businessOpportunities: string[];
  challenges: string[];
  features: string[];
  mvpPlan: string[];
  roadmap: string[];
  suggestedTech: string[];
  learningResources: string[];
  nextSteps: string[];
  monetization: string[];
  targetUsers: string[];
  competitors: string[];
  usps: string[];
  missingPieces: string[];
  criticalQuestions: string[];
}
