import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, Mail, TrendingUp } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ContactsTable } from '@/components/crm/ContactsTable';
import { ContactModal } from '@/components/crm/ContactModal';
import { DeleteContactDialog } from '@/components/crm/DeleteContactDialog';
import { ComposeEmail } from '@/components/email/ComposeEmail';
import { usePortfolioData } from '@/contexts/PortfolioDataContext';
import { Contact } from '@/types/portfolio';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from '@/hooks/useContacts';

export default function CRM() {
  const { toast } = useToast();
  const { contacts, isLoading } = usePortfolioData();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  
  const [emailContact, setEmailContact] = useState<Contact | undefined>();
  const [showCompose, setShowCompose] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  const handleEmailClick = (contact: Contact) => {
    setEmailContact(contact);
    setShowCompose(true);
  };

  const handleAddClick = () => {
    setEditingContact(undefined);
    setShowContactModal(true);
  };

  const handleEditClick = (contact: Contact) => {
    setEditingContact(contact);
    setShowContactModal(true);
  };

  const handleDeleteClick = (contact: Contact) => {
    setDeletingContact(contact);
  };

  const handleSaveContact = (contact: Contact) => {
    if (editingContact) {
      updateContact.mutate({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        expertise: contact.expertise,
        role: contact.role,
      });
    } else {
      createContact.mutate({
        name: contact.name,
        email: contact.email,
        expertise: contact.expertise,
        role: contact.role,
      });
    }
    setShowContactModal(false);
    setEditingContact(undefined);
  };

  const handleConfirmDelete = () => {
    if (deletingContact) {
      deleteContact.mutate(deletingContact.id);
      toast({
        title: 'Contact deleted',
        description: `${deletingContact.name} has been removed.`,
      });
      setDeletingContact(null);
    }
  };

  // Calculate stats
  const expertiseCount = new Set(contacts.map((c) => c.expertise).filter(Boolean)).size;
  const recentContacts = contacts.slice(0, 5).length;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div>
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-5 w-48 mt-2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8 overflow-x-hidden">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader
            title="CRM"
            description="Manage your contacts and communications"
          />
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-3 sm:p-5 shadow-card"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Total Contacts</p>
                <p className="mt-0.5 sm:mt-1 text-xl sm:text-3xl font-semibold text-foreground">{contacts.length}</p>
              </div>
              <div className="flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-3 sm:p-5 shadow-card"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Expertise Areas</p>
                <p className="mt-0.5 sm:mt-1 text-xl sm:text-3xl font-semibold text-foreground">{expertiseCount}</p>
              </div>
              <div className="flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-success/10">
                <Briefcase className="h-4 w-4 sm:h-6 sm:w-6 text-success" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-3 sm:p-5 shadow-card"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Emails This Week</p>
                <p className="mt-0.5 sm:mt-1 text-xl sm:text-3xl font-semibold text-foreground">0</p>
              </div>
              <div className="flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-info/10">
                <Mail className="h-4 w-4 sm:h-6 sm:w-6 text-info" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-border bg-card p-3 sm:p-5 shadow-card"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">New This Month</p>
                <p className="mt-0.5 sm:mt-1 text-xl sm:text-3xl font-semibold text-foreground">{recentContacts}</p>
              </div>
              <div className="flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-warning/10">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-warning" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Contacts Table */}
        <ContactsTable
          contacts={contacts}
          onEmailClick={handleEmailClick}
          onAddClick={handleAddClick}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
        />

        {/* Contact Modal (Add/Edit) */}
        {showContactModal && (
          <ContactModal
            contact={editingContact}
            onClose={() => {
              setShowContactModal(false);
              setEditingContact(undefined);
            }}
            onSave={handleSaveContact}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteContactDialog
          contact={deletingContact}
          open={!!deletingContact}
          onOpenChange={(open) => !open && setDeletingContact(null)}
          onConfirm={handleConfirmDelete}
        />

        {/* Email Compose Modal */}
        {showCompose && (
          <ComposeEmail contact={emailContact} onClose={() => setShowCompose(false)} />
        )}
      </div>
    </MainLayout>
  );
}
