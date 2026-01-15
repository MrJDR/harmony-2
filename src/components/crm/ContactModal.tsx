import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Mail, Briefcase, Building2, Check } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ContactModalProps {
  contact?: Contact;
  onClose: () => void;
  onSave: (contact: Contact) => void;
}

export const expertiseOptions = [
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

// Helper to parse expertise string to array
export const parseExpertise = (expertise: string): string[] => {
  if (!expertise) return [];
  return expertise.split(',').map(e => e.trim()).filter(Boolean);
};

// Helper to join expertise array to string
export const joinExpertise = (expertise: string[]): string => {
  return expertise.join(', ');
};

export function ContactModal({ contact, onClose, onSave }: ContactModalProps) {
  const { toast } = useToast();
  const isEditing = !!contact;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    expertise: [] as string[],
    role: '',
    phone: '',
    company: '',
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean }>({});

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        email: contact.email,
        expertise: parseExpertise(contact.expertise),
        role: contact.role,
        phone: contact.phone || '',
        company: contact.company || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        expertise: [],
        role: '',
        phone: '',
        company: '',
      });
    }
    // Reset validation
    setErrors({});
    setTouched({});
  }, [contact]);

  const handleSubmit = () => {
    // Validate all fields
    const newErrors: { name?: string; email?: string } = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ name: true, email: true });
      return;
    }

    const savedContact: Contact = {
      id: contact?.id || `contact-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      expertise: formData.expertise.length > 0 ? joinExpertise(formData.expertise) : 'Other',
      role: formData.role || 'Consultant',
      phone: formData.phone || undefined,
      company: formData.company || undefined,
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
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  if (e.target.value.trim()) setErrors(prev => ({ ...prev, name: undefined }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                placeholder="John Doe"
                className={touched.name && errors.name ? 'border-destructive' : ''}
              />
              {touched.name && errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, email: e.target.value }));
                  if (e.target.value.trim()) setErrors(prev => ({ ...prev, email: undefined }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                placeholder="john@example.com"
                className={touched.email && errors.email ? 'border-destructive' : ''}
              />
              {touched.email && errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expertise" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Expertise
              </Label>
              <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 rounded-md border border-input bg-background">
                {expertiseOptions.map((opt) => {
                  const isSelected = formData.expertise.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          expertise: isSelected
                            ? prev.expertise.filter((e) => e !== opt)
                            : [...prev.expertise, opt],
                        }));
                      }}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      {opt}
                    </button>
                  );
                })}
              </div>
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
