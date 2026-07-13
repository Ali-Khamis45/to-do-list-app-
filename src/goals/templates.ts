export interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  goalType: 'numeric' | 'milestone' | 'habit';
  unit: string;
  targetValue: number;
  estimatedMinutesPerUnit: number;
  icon: string;
  color: string;
  category: string;
  tags: string[];
  initialMilestones: string[];
  suggestions: string[];
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'read-books',
    title: 'Read Books',
    description: 'Track and accomplish your reading list. Converts books into daily pages and reading times.',
    goalType: 'numeric',
    unit: 'books',
    targetValue: 12,
    estimatedMinutesPerUnit: 240, // 4 hours per book average
    icon: 'BookOpen',
    color: '#8b5cf6', // Violet
    category: 'Learning',
    tags: ['reading', 'learning', 'habits'],
    initialMilestones: [
      'Select and obtain my books list',
      'Finish my 1st book',
      'Reach halfway point of my reading goal',
      'Complete final book on my list'
    ],
    suggestions: [
      'Read at least 15 minutes right after waking up.',
      'Always carry a book or Kindle with you.',
      'Replace 15 minutes of social media scrolling with reading.'
    ]
  },
  {
    id: 'lose-weight',
    title: 'Lose Weight & Get Fit',
    description: 'Plan your weight loss safely. Tracks weight goals and computes exercise milestones.',
    goalType: 'numeric',
    unit: 'kg',
    targetValue: 10,
    estimatedMinutesPerUnit: 60, // 60 minutes of gym per workout / unit
    icon: 'Dumbbell',
    color: '#10b981', // Emerald
    category: 'Health',
    tags: ['fitness', 'health', 'gym'],
    initialMilestones: [
      'Consult coach/dietitian and establish meal plan',
      'Lose first 2 kg',
      'Lose 5 kg (halfway milestone)',
      'Reach target weight'
    ],
    suggestions: [
      'Log workouts and caloric intake consistently.',
      'Drink 3 liters of water daily.',
      'Walk 10,000 steps on rest days to keep metabolic activity high.'
    ]
  },
  {
    id: 'save-money',
    title: 'Save Money & Invest',
    description: 'Grow your savings. Breaks down financial goals into daily/weekly targets.',
    goalType: 'numeric',
    unit: 'dollars',
    targetValue: 5000,
    estimatedMinutesPerUnit: 10, // 10 minutes to log / review finances
    icon: 'Coins',
    color: '#f59e0b', // Amber
    category: 'Finance',
    tags: ['money', 'savings', 'wealth'],
    initialMilestones: [
      'Establish a monthly zero-based budget',
      'Save first $1,000',
      'Save $2,500 (halfway point)',
      'Reach total savings target'
    ],
    suggestions: [
      'Automate your savings deposits on payday.',
      'Track every single expense, no matter how small.',
      'Wait 48 hours before making any non-essential purchase.'
    ]
  },
  {
    id: 'learn-language',
    title: 'Learn a New Language',
    description: 'Acquire new language skills by logging lessons and practice consistency.',
    goalType: 'habit',
    unit: 'lessons',
    targetValue: 100,
    estimatedMinutesPerUnit: 25, // 25 mins per Duolingo/lesson
    icon: 'Languages',
    color: '#3b82f6', // Blue
    category: 'Learning',
    tags: ['language', 'study', 'consistency'],
    initialMilestones: [
      'Learn alphabet, core pronunciation, and greeting words',
      'Complete 25 lessons (Basic conversations)',
      'Learn 500 common vocabulary terms',
      'Hold a 5-minute conversation with a native speaker'
    ],
    suggestions: [
      'Do a 5-minute review every single day to cement vocabulary.',
      'Watch movies or videos in your target language with subtitles.',
      'Label household items with their names in the new language.'
    ]
  },
  {
    id: 'coding-practice',
    title: 'Coding Practice & Projects',
    description: 'Consistently code to level up developer skills or complete projects.',
    goalType: 'numeric',
    unit: 'hours',
    targetValue: 150,
    estimatedMinutesPerUnit: 60, // 60 minutes per hour of coding
    icon: 'Code',
    color: '#ef4444', // Red
    category: 'Career',
    tags: ['programming', 'learning', 'portfolio'],
    initialMilestones: [
      'Set up developer environment and local git repositories',
      'Complete 50 hours of programming practice',
      'Build first portfolio-ready project',
      'Launch project to production/GitHub'
    ],
    suggestions: [
      'Write code for at least 30 minutes every day.',
      'Solve one algorithm puzzle (LeetCode/Codewars) daily.',
      'Contribute to an open-source project or build a side project.'
    ]
  },
  {
    id: 'build-startup',
    title: 'Launch a Startup / SaaS',
    description: 'Transform an idea into a working product. Highly milestone-centric.',
    goalType: 'milestone',
    unit: 'milestones',
    targetValue: 6,
    estimatedMinutesPerUnit: 120, // 2 hours review / task average
    icon: 'Compass',
    color: '#ec4899', // Pink
    category: 'Business',
    tags: ['startup', 'business', 'product'],
    initialMilestones: [
      'Conduct market research and define user persona',
      'Write simple landing page and collect email list',
      'Build minimal viable product (MVP)',
      'Launch to first 50 beta users',
      'Incorporate payment processing (Stripe/PayPal)',
      'Get first paying subscriber'
    ],
    suggestions: [
      'Talk to 3 potential customers weekly.',
      'Focus strictly on core value; do not build unnecessary features.',
      'Ship updates early and iterate based on direct customer complaints.'
    ]
  },
  {
    id: 'publish-apps',
    title: 'Publish Mobile/Web Apps',
    description: 'Create and submit multiple products. Combines subgoals and tasks.',
    goalType: 'numeric',
    unit: 'apps',
    targetValue: 3,
    estimatedMinutesPerUnit: 1200, // 20 hours per app
    icon: 'Layout',
    color: '#06b6d4', // Cyan
    category: 'Career',
    tags: ['apps', 'portfolio', 'shipping'],
    initialMilestones: [
      'Wireframe UX and outline system architecture',
      'Complete App 1 coding and testing',
      'Submit App 1 to App/Play Store',
      'Publish all target applications'
    ],
    suggestions: [
      'Use pre-existing UI frameworks to save design time.',
      'Deploy early to local testing environments.',
      'Set hard limits on scope creep for each product.'
    ]
  }
];
