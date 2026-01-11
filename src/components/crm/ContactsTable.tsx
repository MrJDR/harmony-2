import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, MoreHorizontal, Search, UserPlus, Edit, Trash2, Eye } from 'lucide-react';
import { Contact } from '@/types/portfolio';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ContactFilters } from './ContactFilters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface ContactsTableProps {
  contacts: Contact[];
  onEmailClick: (contact: Contact) => void;
  onAddClick: () => void;
  onEditClick: (contact: Contact) => void;
  onDeleteClick: (contact: Contact) => void;
}

export function ContactsTable({ 
  contacts, 
  onEmailClick, 
  onAddClick,
  onEditClick,
  onDeleteClick,
}: ContactsTableProps) {
  const [search, setSearch] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const navigate = useNavigate();

  // Get unique expertise and role options from contacts
  const expertiseOptions = [...new Set(contacts.map((c) => c.expertise))].sort();
  const roleOptions = [...new Set(contacts.map((c) => c.role))].sort();

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(search.toLowerCase()) ||
      contact.expertise.toLowerCase().includes(search.toLowerCase()) ||
      contact.email.toLowerCase().includes(search.toLowerCase()) ||
      contact.role.toLowerCase().includes(search.toLowerCase());

    const matchesExpertise =
      !expertiseFilter || expertiseFilter === 'all' || contact.expertise === expertiseFilter;
    const matchesRole = !roleFilter || roleFilter === 'all' || contact.role === roleFilter;

    return matchesSearch && matchesExpertise && matchesRole;
  });

  const handleRowClick = (contactId: string) => {
    navigate(`/crm/${contactId}`);
  };

  const handleClearFilters = () => {
    setExpertiseFilter('');
    setRoleFilter('');
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
    <motion.div
      data-tour="contacts-table"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card shadow-card"
    >
      {/* Header with search and filters */}
      <div className="space-y-4 border-b border-border p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={onAddClick}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>

        <ContactFilters
          expertiseFilter={expertiseFilter}
          roleFilter={roleFilter}
          onExpertiseChange={setExpertiseFilter}
          onRoleChange={setRoleFilter}
          onClearFilters={handleClearFilters}
          expertiseOptions={expertiseOptions}
          roleOptions={roleOptions}
        />
      </div>

      {/* Results count */}
      <div className="border-b border-border bg-muted px-4 py-2">
        <p className="text-sm text-muted-foreground">
          {filteredContacts.length} {filteredContacts.length === 1 ? 'contact' : 'contacts'}
          {(search || expertiseFilter || roleFilter) && ' found'}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Expertise</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredContacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="text-muted-foreground">No contacts found</p>
                  {(search || expertiseFilter || roleFilter) && (
                    <Button variant="link" onClick={handleClearFilters} className="h-auto p-0">
                      Clear filters
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredContacts.map((contact, index) => (
              <motion.tr
                key={contact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleRowClick(contact.id)}
                className="group cursor-pointer border-b border-border transition-colors hover:bg-muted"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                      {contact.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <span className="font-medium text-foreground">{contact.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <a
                    href={`mailto:${contact.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary hover:underline"
                  >
                    {contact.email}
                  </a>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getExpertiseColor(contact.expertise)}>
                    {contact.expertise}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{contact.role}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEmailClick(contact)}
                      className="h-8 w-8"
                      title="Send email"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRowClick(contact.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditClick(contact)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Contact
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteClick(contact)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </motion.tr>
            ))
          )}
        </TableBody>
      </Table>
    </motion.div>
  );
}
