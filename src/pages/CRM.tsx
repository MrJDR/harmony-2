import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, Mail, TrendingUp } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ContactsTable } from '@/components/crm/ContactsTable';
import { ContactModal } from '@/components/crm/ContactModal';
import { DeleteContactDialog } from '@/components/crm/DeleteContactDialog';
import { ComposeEmail } from '@/components/email/ComposeEmail';
import { mockContacts } from '@/data/mockData';
import { Contact } from '@/types/portfolio';
import { useToast } from '@/hooks/use-toast';

export default function CRM() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
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
      // Update existing contact
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? contact : c))
      );
    } else {
      // Add new contact
      setContacts((prev) => [contact, ...prev]);
    }
    setShowContactModal(false);
    setEditingContact(undefined);
  };

  const handleConfirmDelete = () => {
    if (deletingContact) {
      setContacts((prev) => prev.filter((c) => c.id !== deletingContact.id));
      toast({
        title: 'Contact deleted',
        description: `${deletingContact.name} has been removed.`,
      });
      setDeletingContact(null);
    }
  };

  // Calculate stats
  const expertiseCount = new Set(contacts.map((c) => c.expertise)).size;
  const recentContacts = contacts.slice(0, 5).length;

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl font-bold text-foreground">CRM</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your contacts and communications
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Contacts</p>
                <p className="mt-1 text-3xl font-semibold text-foreground">{contacts.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expertise Areas</p>
                <p className="mt-1 text-3xl font-semibold text-foreground">{expertiseCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <Briefcase className="h-6 w-6 text-success" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Emails This Week</p>
                <p className="mt-1 text-3xl font-semibold text-foreground">12</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
                <Mail className="h-6 w-6 text-info" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New This Month</p>
                <p className="mt-1 text-3xl font-semibold text-foreground">{recentContacts}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                <TrendingUp className="h-6 w-6 text-warning" />
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
