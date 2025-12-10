import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScriptSetupProps {
  scriptUrl: string;
  onScriptUrlChange: (url: string) => void;
}

const SCRIPT_CODE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rowIndex = data.rowIndex;
    var rowData = data.data;
    
    // Update the row
    for (var i = 0; i < rowData.length; i++) {
      sheet.getRange(rowIndex, i + 1).setValue(rowData[i]);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

const ScriptSetup = ({ scriptUrl, onScriptUrlChange }: ScriptSetupProps) => {
  const [inputUrl, setInputUrl] = useState(scriptUrl);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(SCRIPT_CODE);
      setCopied(true);
      toast({
        title: '已複製',
        description: 'Apps Script 程式碼已複製到剪貼簿',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: '複製失敗',
        description: '請手動選擇並複製程式碼',
        variant: 'destructive',
      });
    }
  };

  const handleSaveUrl = () => {
    onScriptUrlChange(inputUrl);
    toast({
      title: '已儲存',
      description: 'Script URL 已更新',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">設定 Google Apps Script</CardTitle>
        <CardDescription>
          要編輯 Google Sheet，需要設定 Apps Script 作為中間層
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription className="space-y-3">
            <p className="font-medium">設定步驟：</p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                打開你的 Google Sheet，選擇 <strong>擴充功能 &gt; Apps Script</strong>
              </li>
              <li>刪除預設的程式碼，貼上以下程式碼：</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="relative">
          <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto max-h-48">
            {SCRIPT_CODE}
          </pre>
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleCopyCode}
          >
            {copied ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Alert>
          <AlertDescription className="space-y-2">
            <ol className="list-decimal list-inside space-y-2 text-sm" start={3}>
              <li>點擊 <strong>部署 &gt; 新增部署</strong></li>
              <li>選擇類型為 <strong>網頁應用程式</strong></li>
              <li>將「誰可以存取」設為 <strong>所有人</strong></li>
              <li>點擊「部署」並授權</li>
              <li>複製產生的 URL 並貼到下方</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Input
            placeholder="https://script.google.com/macros/s/xxx/exec"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
          />
          <Button onClick={handleSaveUrl}>
            儲存
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open('https://script.google.com', '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          打開 Apps Script
        </Button>
      </CardContent>
    </Card>
  );
};

export default ScriptSetup;