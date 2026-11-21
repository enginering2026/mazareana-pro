import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Auth() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    
    if (!error) {
      navigate('/', { replace: true });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return;
    
    if (password !== confirmPassword) {
      return;
    }
    
    setIsLoading(true);
    const { error } = await signUp(email, password);
    setIsLoading(false);
    
    if (!error) {
      setActiveTab('login');
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4" dir="rtl">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center shadow-large">
            <span className="text-3xl font-bold text-primary-foreground">م</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المزارع</h1>
          <p className="text-muted-foreground">نظام إدارة شامل لمزارعك</p>
        </div>

        <Card className="p-6 shadow-large border-border/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                إنشاء حساب
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 pl-10"
                      required
                      dir="ltr"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-1 top-1 h-8 w-8 p-0 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 pl-10"
                      required
                      dir="ltr"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-1 top-1 h-8 w-8 p-0 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                      required
                      dir="ltr"
                    />
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-sm text-destructive">كلمات المرور غير متطابقة</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary"
                  disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
                >
                  {isLoading ? 'جارٍ إنشاء الحساب...' : 'إنشاء حساب'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 إدارة المزارع. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </div>
  );
}