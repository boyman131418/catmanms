import { useState } from 'react';
import { SheetData, SheetRow, canEditRow } from '@/lib/sheets';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Save, X, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SheetTableProps {
  data: SheetData;
  userEmail: string;
  onDataUpdated: () => void;
  scriptUrl: string | null;
}

const SheetTable = ({ data, userEmail, onDataUpdated, scriptUrl }: SheetTableProps) => {
  const [editingRow, setEditingRow] = useState<SheetRow | null>(null);
  const [editedData, setEditedData] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleEdit = (row: SheetRow) => {
    setEditingRow(row);
    setEditedData([...row.data]);
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditedData([]);
  };

  const handleSave = async () => {
    if (!editingRow || !scriptUrl) return;

    setIsSaving(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('update-sheet', {
        body: {
          scriptUrl,
          rowIndex: editingRow.rowIndex,
          data: editedData
        }
      });

      if (error) throw error;

      if (result.success) {
        toast({
          title: '儲存成功',
          description: '資料已更新',
        });
        setEditingRow(null);
        setEditedData([]);
        onDataUpdated();
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: '儲存失敗',
        description: error instanceof Error ? error.message : '請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (index: number, value: string) => {
    const newData = [...editedData];
    newData[index] = value;
    setEditedData(newData);
  };

  if (data.rows.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>沒有資料</p>
      </div>
    );
  }

  // Helper to truncate cell content for specific columns
  const truncateHeaders = ['iglink', 'apikey'];
  
  const formatCellContent = (cell: string, headerName: string) => {
    const normalizedHeader = headerName.toLowerCase().replace(/\s/g, '');
    if (truncateHeaders.includes(normalizedHeader) && cell.length > 10) {
      return cell.substring(0, 10) + '...';
    }
    return cell;
  };

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {data.headers.map((header, index) => (
                  <TableHead key={index} className="font-semibold whitespace-nowrap">
                    {header}
                  </TableHead>
                ))}
                <TableHead className="w-20 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => {
                const editable = canEditRow(row, userEmail);
                return (
                  <TableRow 
                    key={row.rowIndex}
                    className={editable ? 'bg-accent/10 hover:bg-accent/20' : ''}
                  >
                    {row.data.map((cell, cellIndex) => (
                      <TableCell 
                        key={cellIndex} 
                        className="whitespace-nowrap max-w-xs"
                        title={cell}
                      >
                        {formatCellContent(cell, data.headers[cellIndex] || '')}
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      {editable ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(row)}
                          disabled={!scriptUrl}
                          title={!scriptUrl ? '需要設定 Google Apps Script URL' : '編輯'}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={editingRow !== null} onOpenChange={() => handleCancelEdit()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>編輯資料 (第 {editingRow?.rowIndex} 行)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {data.headers.map((header, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`field-${index}`}>{header}</Label>
                <Input
                  id={`field-${index}`}
                  value={editedData[index] || ''}
                  onChange={(e) => handleFieldChange(index, e.target.value)}
                  disabled={index === 0} // Column A (email) cannot be edited
                />
                {index === 0 && (
                  <p className="text-xs text-muted-foreground">電郵地址不能修改</p>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                  儲存中...
                </span>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  儲存
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SheetTable;