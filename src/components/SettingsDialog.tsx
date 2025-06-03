<<<<<<< HEAD

=======
>>>>>>> 1e03dc9 (feat: add SettingsDialog component for user preferences and account management)
import React from 'react';
import { X, Moon, Sun, Bell, Shield, HelpCircle, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
<<<<<<< HEAD

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    console.log('Theme switched to:', newTheme);
=======
  const [mounted, setMounted] = React.useState(false);

  // After mounting, we can show the theme switcher UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
>>>>>>> 1e03dc9 (feat: add SettingsDialog component for user preferences and account management)
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

<<<<<<< HEAD
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-gray-900 dark:text-white">
=======
  // Don't render theme switch until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
>>>>>>> 1e03dc9 (feat: add SettingsDialog component for user preferences and account management)
            Settings
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="space-y-4">
<<<<<<< HEAD
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Appearance</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {theme === 'dark' ? (
                  <Moon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Sun className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
=======
            <h3 className="text-sm font-medium">Appearance</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {theme === 'dark' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                <span className="text-sm">Dark Mode</span>
>>>>>>> 1e03dc9 (feat: add SettingsDialog component for user preferences and account management)
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={handleThemeToggle}
              />
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-4">
<<<<<<< HEAD
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Push Notifications</span>
=======
            <h3 className="text-sm font-medium">Notifications</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <span className="text-sm">Push Notifications</span>
>>>>>>> 1e03dc9 (feat: add SettingsDialog component for user preferences and account management)
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
<<<<<<< HEAD
                <Bell className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Message Sounds</span>
=======
                <Bell className="h-4 w-4" />
                <span className="text-sm">Message Sounds</span>
>>>>>>> 1e03dc9 (feat: add SettingsDialog component for user preferences and account management)
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <Separator />

          {/* Privacy & Security */}
          <div className="space-y-4">
<<<<<<< HEAD
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Privacy & Security</h3>
            <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300">
=======
            <h3 className="text-sm font-medium">Privacy & Security</h3>
            <Button variant="ghost" className="w-full justify-start">
>>>>>>> 1e03dc9 (feat: add SettingsDialog component for user preferences and account management)
              <Shield className="h-4 w-4 mr-2" />
              Privacy Settings
            </Button>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
<<<<<<< HEAD
                <Shield className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Read Receipts</span>
=======
                <Shield className="h-4 w-4" />
                <span className="text-sm">Read Receipts</span>
>>>>>>> 1e03dc9 (feat: add SettingsDialog component for user preferences and account management)
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
<<<<<<< HEAD
                <Shield className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Last Seen</span>
=======
                <Shield className="h-4 w-4" />
                <span className="text-sm">Last Seen</span>
>>>>>>> 1e03dc9 (feat: add SettingsDialog component for user preferences and account management)
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <Separator />

          {/* Help & Support */}
          <div className="space-y-4">
<<<<<<< HEAD
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Help & Support</h3>
            <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300">
=======
            <h3 className="text-sm font-medium">Help & Support</h3>
            <Button variant="ghost" className="w-full justify-start">
>>>>>>> 1e03dc9 (feat: add SettingsDialog component for user preferences and account management)
              <HelpCircle className="h-4 w-4 mr-2" />
              Help Center
            </Button>
          </div>

          <Separator />

          {/* Account Actions */}
          <div className="space-y-4">
            <Button
              variant="ghost"
<<<<<<< HEAD
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
=======
              className="w-full justify-start text-destructive"
>>>>>>> 1e03dc9 (feat: add SettingsDialog component for user preferences and account management)
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

<<<<<<< HEAD
export default SettingsDialog;
=======
export default SettingsDialog;
>>>>>>> 1e03dc9 (feat: add SettingsDialog component for user preferences and account management)
