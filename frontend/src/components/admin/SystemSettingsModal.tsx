import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Database, Shield, Bell, Globe, Server, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface SystemConfig {
  // General Settings
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  
  // Email Settings
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  
  // Security Settings
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireEmailVerification: boolean;
  
  // Database Settings
  backupFrequency: string;
  autoBackup: boolean;
  backupRetention: number;
  
  // Notification Settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  systemAlerts: boolean;
}

const defaultConfig: SystemConfig = {
  siteName: 'IIIT Manipur Digital Campus',
  siteDescription: 'Digital Campus Management System',
  maintenanceMode: false,
  allowRegistration: false,
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  fromEmail: 'noreply@iiitmanipur.ac.in',
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  requireEmailVerification: true,
  backupFrequency: 'daily',
  autoBackup: true,
  backupRetention: 30,
  emailNotifications: true,
  pushNotifications: false,
  systemAlerts: true,
};

export default function SystemSettingsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadSystemConfig();
    }
  }, [isOpen]);

  const loadSystemConfig = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would call a system config API
      // For now, we'll use the default config
      setConfig(defaultConfig);
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading system config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load system configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (key: keyof SystemConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveConfig = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would call a save config API
      console.log('Saving config:', config);
      
      toast({
        title: 'Success',
        description: 'System settings saved successfully',
      });
      
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving system config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save system configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetConfig = () => {
    if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      setConfig(defaultConfig);
      setHasChanges(true);
    }
  };

  const handleTestEmail = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would call a test email API
      toast({
        title: 'Test Email Sent',
        description: 'Test email has been sent to verify SMTP configuration',
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupNow = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would call a backup API
      toast({
        title: 'Backup Started',
        description: 'Database backup has been initiated',
      });
    } catch (error) {
      console.error('Error starting backup:', error);
      toast({
        title: 'Error',
        description: 'Failed to start backup',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full justify-start" variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          System Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Basic system configuration and appearance settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={config.siteName}
                      onChange={(e) => handleConfigChange('siteName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Input
                      id="siteDescription"
                      value={config.siteDescription}
                      onChange={(e) => handleConfigChange('siteDescription', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable maintenance mode to restrict access
                      </p>
                    </div>
                    <Switch
                      checked={config.maintenanceMode}
                      onCheckedChange={(checked) => handleConfigChange('maintenanceMode', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow User Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to register accounts
                      </p>
                    </div>
                    <Switch
                      checked={config.allowRegistration}
                      onCheckedChange={(checked) => handleConfigChange('allowRegistration', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Configure SMTP settings for email notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={config.smtpHost}
                      onChange={(e) => handleConfigChange('smtpHost', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={config.smtpPort}
                      onChange={(e) => handleConfigChange('smtpPort', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpUser">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      value={config.smtpUser}
                      onChange={(e) => handleConfigChange('smtpUser', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={config.smtpPassword}
                      onChange={(e) => handleConfigChange('smtpPassword', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={config.fromEmail}
                    onChange={(e) => handleConfigChange('fromEmail', e.target.value)}
                  />
                </div>

                <Button onClick={handleTestEmail} disabled={isLoading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test Email Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure security and authentication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={config.sessionTimeout}
                      onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={config.maxLoginAttempts}
                      onChange={(e) => handleConfigChange('maxLoginAttempts', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={config.passwordMinLength}
                      onChange={(e) => handleConfigChange('passwordMinLength', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Require users to verify their email address
                    </p>
                  </div>
                  <Switch
                    checked={config.requireEmailVerification}
                    onCheckedChange={(checked) => handleConfigChange('requireEmailVerification', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Database Settings
                </CardTitle>
                <CardDescription>
                  Configure database backup and maintenance settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select 
                      value={config.backupFrequency} 
                      onValueChange={(value) => handleConfigChange('backupFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="backupRetention">Backup Retention (days)</Label>
                    <Input
                      id="backupRetention"
                      type="number"
                      value={config.backupRetention}
                      onChange={(e) => handleConfigChange('backupRetention', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Backup</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically backup database at scheduled intervals
                    </p>
                  </div>
                  <Switch
                    checked={config.autoBackup}
                    onCheckedChange={(checked) => handleConfigChange('autoBackup', checked)}
                  />
                </div>

                <Button onClick={handleBackupNow} disabled={isLoading}>
                  <Database className="mr-2 h-4 w-4" />
                  Backup Now
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure system notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={config.emailNotifications}
                      onCheckedChange={(checked) => handleConfigChange('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send push notifications to users
                      </p>
                    </div>
                    <Switch
                      checked={config.pushNotifications}
                      onCheckedChange={(checked) => handleConfigChange('pushNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>System Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Show system alerts and warnings
                      </p>
                    </div>
                    <Switch
                      checked={config.systemAlerts}
                      onCheckedChange={(checked) => handleConfigChange('systemAlerts', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={handleResetConfig} disabled={isLoading}>
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig} disabled={isLoading || !hasChanges}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 