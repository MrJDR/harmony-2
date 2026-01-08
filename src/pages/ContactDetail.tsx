import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  Calendar,
  MessageSquare,
  FileText,
  Plus,
  Send
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ComposeEmail } from '@/components/email/ComposeEmail';
import { mockContacts, mockPortfolio } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock activity data
const mockActivities = [
  { id: '1', type: 'email', title: 'Sent project proposal', date: '2025-01-07', description: 'Shared Q1 project roadmap' },
  { id: '2', type: 'meeting', title: 'Discovery call', date: '2025-01-05', description: 'Discussed requirements for mobile app' },
  { id: '3', type: 'note', title: 'Added note', date: '2025-01-03', description: 'Prefers async communication' },
  { id: '4', type: 'email', title: 'Received follow-up', date: '2025-01-02', description: 'Approved budget for Phase 1' },
];

const mockNotes = [
  { id: '1', content: 'Prefers async communication via email. Best time to reach is mornings.', date: '2025-01-03' },
  { id: '2', content: 'Decision maker for all technical purchases. Reports to VP of Product.', date: '2024-12-28' },
];

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showCompose, setShowCompose] = useState(false);
  const [newNote, setNewNote] = useState('');

  const contact = mockContacts.find((c) => c.id === id);

  if (!contact) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-semibold text-foreground">Contact not found</h2>
          <Button variant="link" onClick={() => navigate('/crm')}>
            Back to CRM
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Find related projects (mock relationship based on company name matching)
  const relatedProjects = mockPortfolio.programs.flatMap(p => p.projects).slice(0, 2);

  const handleAddNote = () => {
    if (newNote.trim()) {
      // In a real app, this would save to the database
      setNewNote('');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/crm')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to CRM
          </Button>
        </motion.div>

        {/* Contact Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-xl font-semibold text-accent-foreground">
              {contact.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {contact.name}
              </h1>
              <p className="text-muted-foreground">{contact.role}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Briefcase className="h-3 w-3" />
                  {contact.expertise}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Phone className="h-4 w-4" />
              Call
            </Button>
            <Button onClick={() => setShowCompose(true)} className="gap-2">
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Details & Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6 lg:col-span-1"
          >
            {/* Contact Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {contact.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Expertise</p>
                    <p className="text-sm text-foreground">{contact.expertise}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm text-foreground">{contact.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Related Projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.status}</p>
                    </div>
                    <Badge
                      variant={project.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {project.progress}%
                    </Badge>
                  </div>
                ))}
                {relatedProjects.length === 0 && (
                  <p className="text-sm text-muted-foreground">No related projects</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Activity & Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <Tabs defaultValue="activity" className="w-full">
                <CardHeader className="pb-0">
                  <TabsList>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="emails">Emails</TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Activity Tab */}
                  <TabsContent value="activity" className="mt-0 space-y-4">
                    {mockActivities.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-4"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 border-b border-border pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {activity.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {activity.description}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </TabsContent>

                  {/* Notes Tab */}
                  <TabsContent value="notes" className="mt-0 space-y-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <Button
                        onClick={handleAddNote}
                        size="icon"
                        className="shrink-0"
                        disabled={!newNote.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3 pt-2">
                      {mockNotes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-lg border border-border bg-muted/30 p-4"
                        >
                          <p className="text-sm text-foreground">{note.content}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {new Date(note.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Emails Tab */}
                  <TabsContent value="emails" className="mt-0">
                    <div className="space-y-3">
                      {mockActivities
                        .filter((a) => a.type === 'email')
                        .map((email) => (
                          <div
                            key={email.id}
                            className="flex items-start gap-3 rounded-lg border border-border p-4"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <Send className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <p className="text-sm font-medium text-foreground">
                                  {email.title}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(email.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {email.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => setShowCompose(true)}
                      >
                        <Mail className="h-4 w-4" />
                        Compose New Email
                      </Button>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </motion.div>
        </div>

        {/* Email Compose Modal */}
        {showCompose && (
          <ComposeEmail contact={contact} onClose={() => setShowCompose(false)} />
        )}
      </div>
    </MainLayout>
  );
}
