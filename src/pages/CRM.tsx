import { useState } from 'react';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { ContactsTable } from '@/components/crm/ContactsTable';
import { ComposeEmail } from '@/components/email/ComposeEmail';
import { mockContacts } from '@/data/mockData';
import { Contact } from '@/types/portfolio';

export default function CRM() {
  const [emailContact, setEmailContact] = useState<Contact | undefined>();
  const [showCompose, setShowCompose] = useState(false);

  const handleEmailClick = (contact: Contact) => {
    setEmailContact(contact);
    setShowCompose(true);
  };

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
        <div className="grid gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <p className="text-3xl font-semibold text-foreground">{mockContacts.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Total Contacts</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <p className="text-3xl font-semibold text-foreground">
              {new Set(mockContacts.map((c) => c.company)).size}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Companies</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <p className="text-3xl font-semibold text-foreground">12</p>
            <p className="mt-1 text-sm text-muted-foreground">Emails This Week</p>
          </motion.div>
        </div>

        {/* Contacts Table */}
        <ContactsTable contacts={mockContacts} onEmailClick={handleEmailClick} />

        {/* Email Compose Modal */}
        {showCompose && (
          <ComposeEmail contact={emailContact} onClose={() => setShowCompose(false)} />
        )}
      </div>
    </MainLayout>
  );
}
