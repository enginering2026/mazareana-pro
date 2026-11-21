import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'worker';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isAdmin: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const MOCK_USER: User = {
  id: 'local-user',
  email: 'admin@local.com',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  role: 'authenticated'
};

const MOCK_SESSION: Session = {
  access_token: 'local-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'local-refresh-token',
  user: MOCK_USER
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isLoggedOut = typeof window !== 'undefined' ? localStorage.getItem('local_logged_out') === 'true' : false;
  const [user, setUser] = useState<User | null>(isLoggedOut ? null : MOCK_USER);
  const [session, setSession] = useState<Session | null>(isLoggedOut ? null : MOCK_SESSION);
  const [role, setRole] = useState<AppRole | null>(isLoggedOut ? null : 'admin');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Keep local sync if storage changes
    const checkAuth = () => {
      const loggedOut = localStorage.getItem('local_logged_out') === 'true';
      if (!loggedOut) {
        setUser(MOCK_USER);
        setSession(MOCK_SESSION);
        setRole('admin');
      } else {
        setUser(null);
        setSession(null);
        setRole(null);
      }
    };
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      localStorage.removeItem('local_logged_out');
      setUser(MOCK_USER);
      setSession(MOCK_SESSION);
      setRole('admin');
      toast.success('تم إنشاء الحساب محلياً بنجاح!');
      return { error: null };
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      localStorage.removeItem('local_logged_out');
      setUser(MOCK_USER);
      setSession(MOCK_SESSION);
      setRole('admin');
      toast.success('تم تسجيل الدخول بنجاح');
      return { error: null };
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      localStorage.setItem('local_logged_out', 'true');
      setUser(null);
      setSession(null);
      setRole(null);
      toast.success('تم تسجيل الخروج بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  const value = {
    user,
    session,
    role,
    isAdmin: role === 'admin',
    signUp,
    signIn,
    signOut,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}