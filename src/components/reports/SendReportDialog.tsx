import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Send, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateReportHTML, type ReportData } from '@/lib/reportExport';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';

interface SendReportDialogProps {
  open: boolean;
  onClose: () => void;
  reportData: ReportData;
}

export function SendReportDialog({ open, onClose, reportData }: SendReportDialogProps) {
  const { toast } = useToast();
  const { teamMembers } = usePortfolioData();
  const [sending, setSending] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [customEmail, setCustomEmail] = useState('');
  const [customEmails, setCustomEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState(`Portfolio Update - ${new Date().toLocaleDateString()}`);
  const [additionalMessage, setAdditionalMessage] = useState('');

  const membersWithEmail = teamMembers.filter(m => m.email);

  const handleAddCustomEmail = () => {
    const email = customEmail.trim().toLowerCase();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (!customEmails.includes(email)) {
        setCustomEmails([...customEmails, email]);
      }
      setCustomEmail('');
    } else {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveCustomEmail = (email: string) => {
    setCustomEmails(customEmails.filter(e => e !== email));
  };

  const toggleRecipient = (memberId: string) => {
    setSelectedRecipients(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAll = () => {
    setSelectedRecipients(membersWithEmail.map(m => m.id));
  };

  const deselectAll = () => {
    setSelectedRecipients([]);
  };

  const handleSend = async () => {
    const recipientEmails = [
      ...selectedRecipients
        .map(id => membersWithEmail.find(m => m.id === id)?.email)
        .filter(Boolean) as string[],
      ...customEmails,
    ];

    if (recipientEmails.length === 0) {
      toast({
        title: 'No recipients',
        description: 'Please select at least one recipient.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    try {
      // Generate the HTML report content
      let htmlContent = generateReportHTML(reportData);
      
      // Add additional message if provided
      if (additionalMessage.trim()) {
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #1e293b; white-space: pre-wrap;">${additionalMessage}</p>
          </div>
        ` + htmlContent;
      }

      // Send to each recipient (the edge function handles individual sends)
      const results = await Promise.allSettled(
        recipientEmails.map(email =>
          supabase.functions.invoke('send-email', {
            body: {
              to: email,
              subject,
              body: htmlContent,
            },
          })
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast({
          title: 'Report sent!',
          description: `Successfully sent to ${successCount} recipient${successCount > 1 ? 's' : ''}.${failCount > 0 ? ` Failed: ${failCount}` : ''}`,
        });
        onClose();
      } else {
        throw new Error('All sends failed');
      }
    } catch (error: unknown) {
      console.error('Error sending report:', error);
      toast({
        title: 'Failed to send',
        description: error instanceof Error ? error.message : 'Could not send the report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg rounded-xl bg-background border border-border shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Send Report Update</h2>
                <p className="text-sm text-muted-foreground">Email a portfolio snapshot to your team</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>

            {/* Additional Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Additional Message (optional)</Label>
              <Textarea
                id="message"
                value={additionalMessage}
                onChange={e => setAdditionalMessage(e.target.value)}
                placeholder="Add a personal note to the report..."
                rows={2}
              />
            </div>

            {/* Team Recipients */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Team Recipients</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll} className="h-7 text-xs">
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll} className="h-7 text-xs">
                    Clear
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-32 rounded-md border border-border p-2">
                {membersWithEmail.length > 0 ? (
                  <div className="space-y-2">
                    {membersWithEmail.map(member => (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 rounded-md p-2 hover:bg-muted cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedRecipients.includes(member.id)}
                          onCheckedChange={() => toggleRecipient(member.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No team members with email addresses
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Custom Email */}
            <div className="space-y-2">
              <Label>Additional Recipients</Label>
              <div className="flex gap-2">
                <Input
                  value={customEmail}
                  onChange={e => setCustomEmail(e.target.value)}
                  placeholder="Enter email address..."
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomEmail();
                    }
                  }}
                />
                <Button variant="outline" onClick={handleAddCustomEmail}>
                  Add
                </Button>
              </div>
              {customEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {customEmails.map(email => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      {email}
                      <button
                        onClick={() => handleRemoveCustomEmail(email)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {selectedRecipients.length + customEmails.length} recipient{selectedRecipients.length + customEmails.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-border p-4">
            <Button variant="outline" onClick={onClose} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Update
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
