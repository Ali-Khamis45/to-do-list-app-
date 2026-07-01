import { User } from '../auth/UserModel';
import { IUserRepository } from '../auth/UserRepository';

export type AppTheme = 'light' | 'dark' | 'stone';

export interface ThemeChangeListener {
  (theme: AppTheme): void;
}

export class ThemeService {
  private static instance: ThemeService;
  private currentTheme: AppTheme = 'stone';
  private listeners: Set<ThemeChangeListener> = new Set();
  private userRepository?: IUserRepository;
  private currentUser?: User;

  private constructor() {
    // Attempt to load initial theme from localStorage as fallback
    const saved = localStorage.getItem('app_theme') as AppTheme;
    if (saved === 'light' || saved === 'dark' || saved === 'stone') {
      this.currentTheme = saved;
    }
    this.applyTheme(this.currentTheme);
  }

  public static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  /**
   * Initializes the service with repository and current user context
   */
  public initialize(userRepository: IUserRepository, currentUser: User | null): void {
    this.userRepository = userRepository;
    if (currentUser) {
      this.currentUser = currentUser;
      const userTheme = currentUser.themePreference || 'stone';
      this.setTheme(userTheme, false); // apply without resaving back to user during initialization
    } else {
      this.currentUser = undefined;
      // If no user logged in, revert to localStorage fallback or default
      const saved = localStorage.getItem('app_theme') as AppTheme;
      this.setTheme(saved || 'stone', false);
    }
  }

  public getTheme(): AppTheme {
    return this.currentTheme;
  }

  /**
   * Switches the active theme, updates localStorage, saves to database if user is logged in,
   * updates DOM resource class, and notifies all React subscribers.
   */
  public setTheme(theme: AppTheme, saveToUser: boolean = true): void {
    if (this.currentTheme === theme && document.documentElement.classList.contains(`theme-${theme}`)) {
      return;
    }

    this.currentTheme = theme;
    localStorage.setItem('app_theme', theme);
    this.applyTheme(theme);

    // Save to user database if user is logged in and saveToUser is true
    if (saveToUser && this.currentUser && this.userRepository) {
      const updatedUser: User = {
        ...this.currentUser,
        themePreference: theme,
      };
      this.userRepository.saveUser(updatedUser);
      this.currentUser = updatedUser;
    }

    // Notify UI subscribers
    this.notifyListeners();
  }

  /**
   * Register a callback listener for when theme changes
   */
  public subscribe(listener: ThemeChangeListener): () => void {
    this.listeners.add(listener);
    // Return an unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentTheme);
      } catch (err) {
        console.error('Error in theme listener:', err);
      }
    });
  }

  /**
   * Applies the theme class directly to document root element
   */
  private applyTheme(theme: AppTheme): void {
    const root = document.documentElement;
    // Remove existing themes
    root.classList.remove('theme-stone', 'theme-light', 'theme-dark');
    // Add current theme class
    root.classList.add(`theme-${theme}`);
    
    // Also apply 'dark' class for third-party dark mode compliance if needed
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

export const themeService = ThemeService.getInstance();
