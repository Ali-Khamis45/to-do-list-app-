import { User } from './UserModel';
import { IUserRepository } from './UserRepository';
import { IPasswordHasher } from './PasswordHasher';
import { ISessionManager } from './SessionManager';

export interface RegisterInput {
  fullName: string;
  email: string;
  passwordHash: string; // Pre-hashed or password to be hashed
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface IAuthenticationService {
  register(fullName: string, email: string, password: string): Promise<AuthResponse>;
  login(email: string, password: string, rememberMe: boolean): Promise<AuthResponse>;
  logout(): void;
  getLoggedInUser(): User | null;
}

export class AuthenticationService implements IAuthenticationService {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private sessionManager: ISessionManager
  ) {}

  public async register(fullName: string, email: string, password: string): Promise<AuthResponse> {
    // 1. Inputs validation
    if (!fullName || fullName.trim().length < 2) {
      return { success: false, message: 'الرجاء إدخال اسم ثلاثي أو ثنائي صحيح (حرفين على الأقل)' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, message: 'الرجاء إدخال بريد إلكتروني صالح' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل' };
    }

    // 2. Check duplicate email registration
    if (this.userRepository.isEmailExists(email)) {
      return { success: false, message: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول' };
    }

    try {
      // 3. Secure password hashing
      const hashed = await this.passwordHasher.hash(password);

      // 4. Create new user entity
      const newUser: User = {
        id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: hashed,
        themePreference: 'stone',
        notificationSettings: {
          enableReminders: true,
          alertSound: true,
          weeklyDigest: false
        },
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      // 5. Save User
      this.userRepository.saveUser(newUser);

      // 6. Seed isolated default records for the user
      this.userRepository.seedDefaultUserData(newUser.id);

      return { 
        success: true, 
        message: 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول',
        user: newUser
      };
    } catch (e) {
      console.error('Registration failed', e);
      return { success: false, message: 'حدث خطأ غير متوقع أثناء التسجيل. حاول مرة أخرى' };
    }
  }

  public async login(email: string, password: string, rememberMe: boolean): Promise<AuthResponse> {
    if (!email || !password) {
      return { success: false, message: 'الرجاء ملء حقول البريد الإلكتروني وكلمة المرور' };
    }

    const user = this.userRepository.getUserByEmail(email);
    if (!user) {
      return { success: false, message: 'خطأ: البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    // Verify hashed password
    const isMatched = await this.passwordHasher.compare(password, user.passwordHash);
    if (!isMatched) {
      return { success: false, message: 'خطأ: البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    // Update login audit log
    const lastLoginTime = new Date().toISOString();
    this.userRepository.updateUserLastLogin(user.id, lastLoginTime);
    user.lastLogin = lastLoginTime;

    // Save login session
    this.sessionManager.setActiveSession(user.id, rememberMe);

    return {
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user
    };
  }

  public logout(): void {
    this.sessionManager.clearSession();
  }

  public getLoggedInUser(): User | null {
    const activeId = this.sessionManager.getActiveUserId();
    if (!activeId) return null;
    return this.userRepository.getUserById(activeId);
  }
}
