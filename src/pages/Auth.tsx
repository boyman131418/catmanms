import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: '登入失敗',
            description: error.message === 'Invalid login credentials' 
              ? '電郵或密碼錯誤' 
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: '登入成功',
            description: '歡迎回來！',
          });
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: '註冊失敗',
            description: error.message.includes('already registered')
              ? '此電郵已被註冊'
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: '註冊成功',
            description: '帳戶已建立，你現在可以登入了。',
          });
          setIsLogin(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isLogin ? '歡迎回來' : '建立帳戶'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? '輸入你的電郵和密碼來登入' 
              : '輸入你的資料來建立新帳戶'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">電郵地址</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  minLength={6}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                  處理中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {isLogin ? '登入' : '註冊'}
                </span>
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? '還沒有帳戶？' : '已有帳戶？'}
            </span>{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? '立即註冊' : '立即登入'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;