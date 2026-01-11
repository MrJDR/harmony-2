import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Mail, Phone, MapPin, Briefcase, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  department: string;
  bio: string;
  avatarUrl: string;
}

export function ProfileSettings() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<ProfileData>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    jobTitle: 'Product Manager',
    department: 'Product',
    bio: 'Passionate about building great products and leading high-performing teams.',
    avatarUrl: '',
  });

  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, avatarUrl: reader.result as string }));
        setIsDirty(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setProfile((prev) => ({ ...prev, avatarUrl: '' }));
    setIsDirty(true);
  };

  const handleSave = () => {
    toast({
      title: 'Profile updated',
      description: 'Your profile information has been saved.',
    });
    setIsDirty(false);
  };

  const handleDeleteAccount = () => {
    toast({
      title: 'Account deletion requested',
      description: 'We\'ve sent you an email to confirm account deletion.',
      variant: 'destructive',
    });
  };

  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-lg font-semibold text-card-foreground">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information and account settings
        </p>
      </div>

      {/* Avatar Section */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile Photo</CardTitle>
          <CardDescription>This will be displayed on your profile and in comments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatarUrl} alt={`${profile.firstName} ${profile.lastName}`} />
                <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={handleAvatarClick}>
                Upload new photo
              </Button>
              {profile.avatarUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleRemoveAvatar}
                >
                  Remove photo
                </Button>
              )}
              <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Personal Information</CardTitle>
          </div>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profile.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profile.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </span>
            </Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </span>
            </Label>
            <Input
              id="location"
              value={profile.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="City, Country"
            />
          </div>
        </CardContent>
      </Card>

      {/* Work Information */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Work Information</CardTitle>
          </div>
          <CardDescription>Your role within the organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={profile.jobTitle}
                onChange={(e) => handleChange('jobTitle', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={profile.department}
                onChange={(e) => handleChange('department', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Tell us a bit about yourself..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Brief description for your profile. URLs are hyperlinked.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all of your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4">
        {isDirty && (
          <Button
            variant="outline"
            onClick={() => {
              setProfile({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@company.com',
                phone: '+1 (555) 123-4567',
                location: 'San Francisco, CA',
                jobTitle: 'Product Manager',
                department: 'Product',
                bio: 'Passionate about building great products and leading high-performing teams.',
                avatarUrl: '',
              });
              setIsDirty(false);
            }}
          >
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={!isDirty}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}