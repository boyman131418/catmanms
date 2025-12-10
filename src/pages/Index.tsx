import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { fetchSheetData, SheetData } from '@/lib/sheets';
import SheetTable from '@/components/SheetTable';
import ScriptSetup from '@/components/ScriptSetup';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { LogOut, RefreshCw, Settings, ChevronDown, Loader2, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwhqGh895WThl6H8-h22mWEtDKfjqSMb1SI-etg4JsnX6o-m0n8bxD7ferz1Oko94jSZA/exec';
const SETTINGS_PASSWORD = '0012';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scriptUrl, setScriptUrl] = useState<string>(DEFAULT_SCRIPT_URL);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    // Load saved script URL from localStorage, or use default
    const savedUrl = localStorage.getItem('google_script_url');
    if (savedUrl) {
      setScriptUrl(savedUrl);
    } else {
      setScriptUrl(DEFAULT_SCRIPT_URL);
      localStorage.setItem('google_script_url', DEFAULT_SCRIPT_URL);
    }
  }, []);

  const handleUnlockSettings = () => {
    if (passwordInput === SETTINGS_PASSWORD) {
      setIsSettingsUnlocked(true);
      setPasswordInput('');
      toast({
        title: '已解鎖',
        description: '設定已解鎖，可以查看或修改',
      });
    } else {
      toast({
        title: '密碼錯誤',
        description: '請輸入正確的密碼',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadSheetData();
    }
  }, [user]);

  const loadSheetData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSheetData(user?.email || undefined);
      setSheetData(data);
    } catch (error) {
      console.error('Error loading sheet data:', error);
      toast({
        title: '載入失敗',
        description: '無法載入表格資料，請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScriptUrlChange = (url: string) => {
    setScriptUrl(url);
    localStorage.setItem('google_script_url', url);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">表格編輯器</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadSheetData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                重新載入
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                登出
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Settings Panel - Password Protected */}
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">設定</span>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <ChevronDown className={`h-5 w-5 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4">
                {isSettingsUnlocked ? (
                  <ScriptSetup scriptUrl={scriptUrl} onScriptUrlChange={handleScriptUrlChange} />
                ) : (
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <p className="text-sm text-muted-foreground">請輸入密碼以查看或修改設定</p>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          placeholder="輸入密碼"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUnlockSettings()}
                        />
                        <Button onClick={handleUnlockSettings}>
                          解鎖
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Info Card */}
        <Card className="bg-accent/10 border-accent/20">
          <CardContent className="p-4">
            <p className="text-sm">
              <strong>提示：</strong>只顯示與你登入電郵相符的資料。
            </p>
          </CardContent>
        </Card>

        {/* Data Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sheetData ? (
          <SheetTable
            data={sheetData}
            userEmail={user.email || ''}
            onDataUpdated={loadSheetData}
            scriptUrl={scriptUrl || null}
          />
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              無法載入資料
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Index;