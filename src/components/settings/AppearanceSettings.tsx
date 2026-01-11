import { useState } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Palette, Sun, Moon, Monitor, Type, Layout, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark' | 'system';
type AccentColor = 'teal' | 'blue' | 'purple' | 'orange' | 'pink' | 'green';
type DensityMode = 'comfortable' | 'compact' | 'spacious';

const accentColors: { value: AccentColor; label: string; color: string }[] = [
  { value: 'teal', label: 'Teal', color: 'bg-teal-500' },
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { value: 'pink', label: 'Pink', color: 'bg-pink-500' },
  { value: 'green', label: 'Green', color: 'bg-green-500' },
];

export function AppearanceSettings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [accentColor, setAccentColor] = useState<AccentColor>('teal');
  const [fontSize, setFontSize] = useState(16);
  const [density, setDensity] = useState<DensityMode>('comfortable');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  const handleSave = () => {
    toast({
      title: 'Appearance saved',
      description: 'Your appearance preferences have been updated.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-lg font-semibold text-card-foreground">
          Appearance Settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize the look and feel of your workspace
        </p>
      </div>

      {/* Theme Selection */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Theme</CardTitle>
          </div>
          <CardDescription>Choose your preferred color theme</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={theme}
            onValueChange={(v) => setTheme(v as ThemeMode)}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark', label: 'Dark', icon: Moon },
              { value: 'system', label: 'System', icon: Monitor },
            ].map((option) => (
              <Label
                key={option.value}
                htmlFor={option.value}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50',
                  theme === option.value && 'border-primary bg-primary/5'
                )}
              >
                <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                <option.icon className={cn('h-6 w-6', theme === option.value ? 'text-primary' : 'text-muted-foreground')} />
                <span className={cn('text-sm font-medium', theme === option.value ? 'text-foreground' : 'text-muted-foreground')}>
                  {option.label}
                </span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Accent Color</CardTitle>
          <CardDescription>Choose a color for interactive elements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {accentColors.map((color) => (
              <button
                key={color.value}
                onClick={() => setAccentColor(color.value)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full transition-all',
                  color.color,
                  accentColor === color.value
                    ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                    : 'opacity-70 hover:opacity-100'
                )}
                title={color.label}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Typography</CardTitle>
          </div>
          <CardDescription>Adjust text size for readability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Base Font Size</Label>
              <span className="text-sm text-muted-foreground">{fontSize}px</span>
            </div>
            <Slider
              value={[fontSize]}
              onValueChange={([v]) => setFontSize(v)}
              min={12}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Small</span>
              <span>Large</span>
            </div>
          </div>
          <div
            className="rounded-lg border border-border bg-muted/30 p-4"
            style={{ fontSize: `${fontSize}px` }}
          >
            <p className="text-foreground">Preview text at {fontSize}px</p>
            <p className="text-sm text-muted-foreground">
              This is how body text will appear throughout the application.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Layout & Density */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Layout & Density</CardTitle>
          </div>
          <CardDescription>Control spacing and layout preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Content Density</Label>
            <Select value={density} onValueChange={(v) => setDensity(v as DensityMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact - Show more content</SelectItem>
                <SelectItem value="comfortable">Comfortable - Balanced spacing</SelectItem>
                <SelectItem value="spacious">Spacious - More breathing room</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Collapsed Sidebar by Default</Label>
              <p className="text-sm text-muted-foreground">Start with a minimized sidebar</p>
            </div>
            <Switch
              checked={sidebarCollapsed}
              onCheckedChange={setSidebarCollapsed}
            />
          </div>
        </CardContent>
      </Card>

      {/* Animations */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Motion & Animations</CardTitle>
          <CardDescription>Control motion effects and transitions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Animations</Label>
              <p className="text-sm text-muted-foreground">Show smooth transitions and effects</p>
            </div>
            <Switch
              checked={animationsEnabled}
              onCheckedChange={setAnimationsEnabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Reduce Motion</Label>
              <p className="text-sm text-muted-foreground">Minimize motion for accessibility</p>
            </div>
            <Switch
              checked={reduceMotion}
              onCheckedChange={setReduceMotion}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave}>Save Appearance Settings</Button>
      </div>
    </div>
  );
}