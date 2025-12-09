import { useState } from 'react';
import { api } from '../api/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface ShareLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: number;
}

export function ShareLinkDialog({ open, onOpenChange, fileId }: ShareLinkDialogProps) {
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState('');
  const [expiresIn, setExpiresIn] = useState('24');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    try {
      const data = await api.createShareLink(fileId, parseInt(expiresIn));
      // Use the presigned URL directly from S3
      setShareUrl(data.share_url);
      toast({
        title: 'Success',
        description: 'Share link created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create share link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast({
          title: 'Copied',
          description: 'Share link copied to clipboard',
        });
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback to legacy method
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          
          if (successful) {
            setCopied(true);
            toast({
              title: 'Copied',
              description: 'Share link copied to clipboard',
            });
            setTimeout(() => setCopied(false), 2000);
          } else {
            throw new Error('Copy command failed');
          }
        } catch (err) {
          document.body.removeChild(textArea);
          throw err;
        }
      }
    } catch (error) {
      console.error('Copy failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy link. Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setShareUrl('');
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="dark:bg-gray-900 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">Share File</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Create a temporary download link that expires after the selected time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium dark:text-gray-200">Link expires in</label>
            <Select value={expiresIn} onValueChange={setExpiresIn}>
              <SelectTrigger className="dark:bg-gray-900 dark:border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-900 dark:border-gray-700">
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="3">3 hours</SelectItem>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {shareUrl ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Share Link</label>
              <div className="flex space-x-2">
                <Input 
                  value={shareUrl} 
                  readOnly 
                  className="font-mono text-sm dark:bg-gray-900 dark:border-gray-700" 
                  onClick={(e) => {
                    e.currentTarget.select();
                  }}
                />
                <Button variant="outline" onClick={copyToClipboard}>
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This link will expire in {expiresIn} hour{expiresIn !== '1' ? 's' : ''}. Click the text to select and copy manually.
              </p>
            </div>
          ) : (
            <Button onClick={generateLink} disabled={loading} className="w-full">
              {loading ? 'Generating...' : 'Generate Share Link'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
