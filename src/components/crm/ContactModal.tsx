import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Mail, Briefcase, Building2 } from 'lucide-react';
import { Contact } from '@/types/portfolio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ContactModalProps {
  contact?: Contact;
  onClose: () => void;
  onSave: (contact: Contact) => void;
}

const expertiseOptions = [
  'Engineering',
  'Design',
  'Product',
  'Marketing',
  'Sales',
  'Operations',
  'Finance',
  'HR',
  'Legal',
  'Other',
];

const roleOptions = [
  'CEO',
  'CTO',
  'CFO',
  'VP',
  'Director',
  'Manager',
  'Lead',
  'Senior',
  'Junior',
  'Intern',
  'Consultant',
  'Contractor',
];

export function ContactModal({ contact, onClose, onSave }: ContactModalProps) {
  const { toast } = useToast();
  const isEditing = !!contact;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    expertise: '',
    role: '',
    phone: '',
    company: '',
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        email: contact.email,
        expertise: contact.expertise,
        role: contact.role,
        phone: '',
        company: '',
      });
    }
  }, [contact]);

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in name and email.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    const savedContact: Contact = {
      id: contact?.id || `contact-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      expertise: formData.expertise || 'Other',
      role: formData.role || 'Consultant',
    };

    onSave(savedContact);
    toast({
      title: isEditing ? 'Contact updated' : 'Contact created',
      description: `${savedContact.name} has been ${isEditing ? 'updated' : 'added'} successfully.`,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-border bg-card shadow-elevated"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-card-foreground">
            {isEditing ? 'Edit Contact' : 'Add New Contact'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expertise" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Expertise
              </Label>
              <Select
                value={formData.expertise}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, expertise: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expertise" />
                </SelectTrigger>
                <SelectContent>
                  {expertiseOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? 'Save Changes' : 'Add Contact'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
