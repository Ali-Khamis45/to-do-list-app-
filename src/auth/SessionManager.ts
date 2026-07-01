export interface ISessionManager {
  getActiveUserId(): string | null;
  setActiveSession(userId: string, rememberMe: boolean): void;
  clearSession(): void;
  isRememberMeEnabled(): boolean;
}

export class SessionManager implements ISessionManager {
  private readonly SESSION_KEY = 'nexus_session_userId';
  private readonly REMEMBER_KEY = 'nexus_remember_me';

  public getActiveUserId(): string | null {
    // Check sessionStorage first, then localStorage if Remember Me is checked
    const transientUser = sessionStorage.getItem(this.SESSION_KEY);
    if (transientUser) return transientUser;

    const persistentUser = localStorage.getItem(this.SESSION_KEY);
    return persistentUser || null;
  }

  public setActiveSession(userId: string, rememberMe: boolean): void {
    if (rememberMe) {
      localStorage.setItem(this.SESSION_KEY, userId);
      localStorage.setItem(this.REMEMBER_KEY, 'true');
    } else {
      sessionStorage.setItem(this.SESSION_KEY, userId);
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.setItem(this.REMEMBER_KEY, 'false');
    }
  }

  public clearSession(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.REMEMBER_KEY);
  }

  public isRememberMeEnabled(): boolean {
    return localStorage.getItem(this.REMEMBER_KEY) === 'true';
  }
}
