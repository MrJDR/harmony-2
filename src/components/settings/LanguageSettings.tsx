import { useState } from 'react';
import { Globe, Clock, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const languages = [
  { value: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { value: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'zh-CN', label: '中文 (简体)', flag: '🇨🇳' },
];

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8' },
  { value: 'Europe/London', label: 'London (GMT)', offset: 'UTC+0' },
  { value: 'Europe/Paris', label: 'Paris (CET)', offset: 'UTC+1' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 'UTC+9' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)', offset: 'UTC+11' },
];

const currencies = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
];

export function LanguageSettings() {
  const { toast } = useToast();
  const [language, setLanguage] = useState('en-US');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [weekStart, setWeekStart] = useState('sunday');
  const [currency, setCurrency] = useState('USD');

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your language and region preferences have been updated.',
    });
  };

  const currentDate = new Date();
  const formatDate = (format: string) => {
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    
    switch (format) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${month}/${day}/${year}`;
    }
  };

  const formatTime = (format: string) => {
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    
    if (format === '12h') {
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes} ${period}`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-lg font-semibold text-card-foreground">
          Language & Region
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set your preferred language, timezone, and regional formats
        </p>
      </div>

      {/* Language */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Language</CardTitle>
          </div>
          <CardDescription>Choose your preferred language for the interface</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Timezone */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Timezone</CardTitle>
          </div>
          <CardDescription>All times will be displayed in this timezone</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  <span className="flex items-center justify-between gap-4">
                    <span>{tz.label}</span>
                    <span className="text-muted-foreground">{tz.offset}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Date & Time Format */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Date & Time Format</CardTitle>
          </div>
          <CardDescription>Choose how dates and times are displayed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Format */}
          <div className="space-y-3">
            <Label>Date Format</Label>
            <RadioGroup value={dateFormat} onValueChange={setDateFormat} className="space-y-2">
              {[
                { value: 'MM/DD/YYYY', example: formatDate('MM/DD/YYYY') },
                { value: 'DD/MM/YYYY', example: formatDate('DD/MM/YYYY') },
                { value: 'YYYY-MM-DD', example: formatDate('YYYY-MM-DD') },
              ].map((format) => (
                <Label
                  key={format.value}
                  htmlFor={format.value}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted',
                    dateFormat === format.value && 'border-primary bg-primary/5'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={format.value} id={format.value} />
                    <span className="text-sm">{format.value}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{format.example}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Time Format */}
          <div className="space-y-3">
            <Label>Time Format</Label>
            <RadioGroup value={timeFormat} onValueChange={setTimeFormat} className="flex gap-4">
              {[
                { value: '12h', label: '12-hour', example: formatTime('12h') },
                { value: '24h', label: '24-hour', example: formatTime('24h') },
              ].map((format) => (
                <Label
                  key={format.value}
                  htmlFor={`time-${format.value}`}
                  className={cn(
                    'flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-muted',
                    timeFormat === format.value && 'border-primary bg-primary/5'
                  )}
                >
                  <RadioGroupItem value={format.value} id={`time-${format.value}`} className="sr-only" />
                  <span className="text-sm font-medium">{format.label}</span>
                  <span className="text-sm text-muted-foreground">{format.example}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Week Start */}
          <div className="space-y-3">
            <Label>Week Starts On</Label>
            <Select value={weekStart} onValueChange={setWeekStart}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunday">Sunday</SelectItem>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="saturday">Saturday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Currency</CardTitle>
          </div>
          <CardDescription>Set your preferred currency for financial displays</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((curr) => (
                <SelectItem key={curr.value} value={curr.value}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono">{curr.symbol}</span>
                    <span>{curr.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave}>Save Language Settings</Button>
      </div>
    </div>
  );
}