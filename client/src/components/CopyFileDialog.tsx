import { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { S3File } from '@shared/schema';

interface CopyFileDialogProps {
  file: S3File | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  isCopying?: boolean;
}

export function CopyFileDialog({
  file,
  isOpen,
  onClose,
  onConfirm,
  isCopying = false,
}: CopyFileDialogProps) {
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (file && isOpen) {
      // Generate copy name
      const nameParts = file.name.split('.');
      const ext = nameParts.length > 1 ? nameParts.pop() : '';
      const baseName = nameParts.join('.');
      setNewName(ext ? `${baseName} (copy).${ext}` : `${baseName} (copy)`);
    }
  }, [file, isOpen]);

  const handleConfirm = () => {
    if (newName.trim()) {
      onConfirm(newName.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-testid="copy-dialog">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Copy className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Make a copy</DialogTitle>
          </div>
          <DialogDescription>
            Create a copy of <span className="font-medium text-foreground">"{file?.name}"</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="copy-name">New file name</Label>
            <Input
              id="copy-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter file name"
              disabled={isCopying}
              data-testid="input-copy-name"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) {
                  handleConfirm();
                }
              }}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCopying} data-testid="cancel-copy">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!newName.trim() || isCopying}
            data-testid="confirm-copy"
          >
            {isCopying ? 'Copying...' : 'Create copy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
