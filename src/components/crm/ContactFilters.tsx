import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ContactFiltersProps {
  expertiseFilter: string;
  roleFilter: string;
  onExpertiseChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onClearFilters: () => void;
  expertiseOptions: string[];
  roleOptions: string[];
}

export function ContactFilters({
  expertiseFilter,
  roleFilter,
  onExpertiseChange,
  onRoleChange,
  onClearFilters,
  expertiseOptions,
  roleOptions,
}: ContactFiltersProps) {
  const hasFilters = expertiseFilter || roleFilter;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={expertiseFilter} onValueChange={onExpertiseChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Expertise" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Expertise</SelectItem>
          {expertiseOptions.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={roleFilter} onValueChange={onRoleChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All Roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          {roleOptions.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-8 gap-1 text-muted-foreground"
        >
          <X className="h-3 w-3" />
          Clear filters
        </Button>
      )}

      {hasFilters && (
        <div className="flex items-center gap-2">
          {expertiseFilter && expertiseFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {expertiseFilter}
              <button
                onClick={() => onExpertiseChange('all')}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {roleFilter && roleFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {roleFilter}
              <button
                onClick={() => onRoleChange('all')}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
