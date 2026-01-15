import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Briefcase, 
  Calendar,
  MessageSquare,
  FileText,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ComposeEmail } from '@/components/email/ComposeEmail';
import { ContactModal } from '@/components/crm/ContactModal';
import { DeleteContactDialog } from '@/components/crm/DeleteContactDialog';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useUpdateContact, useDeleteContact } from '@/hooks/useContacts';
import { Contact } from '@/types/portfolio';

interface Activity {
  id: string;
  type: 'email' | 'meeting' | 'note' | 'call';
  title: string;
  date: string;
  description: string;
}

interface Note {
  id: string;
  content: string;
  date: string;
}

// Mock activity data (will be replaced with real data later)
const initialActivities: Activity[] = [];
const initialNotes: Note[] = [];

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { contacts, projects, isLoading } = usePortfolioData();
  const updateContact = useUpdateContact();
  const deleteContactMutation = useDeleteContact();
  
  const [showCompose, setShowCompose] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  const contact = contacts.find((c) => c.id === id);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-32 mt-2" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

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

  // Find related projects (based on team assignments - simplified for now)
  const relatedProjects = projects.slice(0, 2);

  const handleAddNote = () => {
    if (newNote.trim()) {
      const note: Note = {
        id: `note-${Date.now()}`,
        content: newNote.trim(),
        date: new Date().toISOString().split('T')[0],
      };
      setNotes((prev) => [note, ...prev]);
      
      const activity: Activity = {
        id: `activity-${Date.now()}`,
        type: 'note',
        title: 'Added note',
        date: note.date,
        description: newNote.trim().slice(0, 50) + (newNote.length > 50 ? '...' : ''),
      };
      setActivities((prev) => [activity, ...prev]);
      
      setNewNote('');
      toast({
        title: 'Note added',
        description: 'Your note has been saved.',
      });
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    toast({
      title: 'Note deleted',
      description: 'The note has been removed.',
    });
  };

  const handleSaveContact = (updatedContact: Contact) => {
    updateContact.mutate({
      id: updatedContact.id,
      name: updatedContact.name,
      email: updatedContact.email,
      phone: updatedContact.phone,
      company: updatedContact.company,
      expertise: updatedContact.expertise,
      role: updatedContact.role,
      notes: updatedContact.notes,
    });
    setShowEditModal(false);
    toast({
      title: 'Contact updated',
      description: `${updatedContact.name} has been updated.`,
    });
  };

  const handleDeleteContact = () => {
    deleteContactMutation.mutate(contact.id);
    toast({
      title: 'Contact deleted',
      description: `${contact.name} has been removed.`,
    });
    navigate('/crm');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getExpertiseColor = (expertise: string) => {
    const colors: Record<string, string> = {
      Engineering: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      Design: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      Product: 'bg-green-500/10 text-green-600 dark:text-green-400',
      Marketing: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      Sales: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      Operations: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    };
    return colors[expertise] || 'bg-muted text-muted-foreground';
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
                {contact.expertise && (
                  <Badge variant="secondary" className={getExpertiseColor(contact.expertise)}>
                    <Briefcase className="mr-1 h-3 w-3" />
                    {contact.expertise}
                  </Badge>
                )}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Contact
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Contact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                {contact.expertise && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Expertise</p>
                      <p className="text-sm text-foreground">{contact.expertise}</p>
                    </div>
                  </div>
                )}
                {contact.role && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Role</p>
                      <p className="text-sm text-foreground">{contact.role}</p>
                    </div>
                  </div>
                )}
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
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{project.status}</p>
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
                    <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
                    <TabsTrigger value="emails">Emails</TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Activity Tab */}
                  <TabsContent value="activity" className="mt-0 space-y-4">
                    {activities.length === 0 ? (
                      <p className="py-8 text-center text-muted-foreground">No activity yet</p>
                    ) : (
                      activities.map((activity, index) => (
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
                      ))
                    )}
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
                      {notes.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">
                          No notes yet. Add one above!
                        </p>
                      ) : (
                        notes.map((note) => (
                          <div
                            key={note.id}
                            className="group relative rounded-lg border border-border bg-muted p-4"
                          >
                            <p className="pr-8 text-sm text-foreground">{note.content}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {new Date(note.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-2 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Emails Tab */}
                  <TabsContent value="emails" className="mt-0">
                    <div className="space-y-3">
                      {activities
                        .filter((a) => a.type === 'email')
                        .map((email) => (
                          <div
                            key={email.id}
                            className="flex items-start gap-3 rounded-lg border border-border p-4"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <Mail className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <p className="text-sm font-medium text-foreground">
                                  {email.title}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(email.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {email.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      {activities.filter((a) => a.type === 'email').length === 0 && (
                        <p className="py-8 text-center text-muted-foreground">
                          No emails sent yet
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </motion.div>
        </div>

        {/* Modals */}
        {showEditModal && (
          <ContactModal
            contact={contact}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveContact}
          />
        )}

        <DeleteContactDialog
          contact={showDeleteDialog ? contact : null}
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDeleteContact}
        />

        {showCompose && (
          <ComposeEmail contact={contact} onClose={() => setShowCompose(false)} />
        )}
      </div>
    </MainLayout>
  );
}
