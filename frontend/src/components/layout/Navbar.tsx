import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuthMongo';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DrawerTrigger } from '@/components/ui/drawer';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const userRole = user?.profile?.role;
  const { toast } = useToast();
  const navigate = useNavigate();

  const getRoleDisplayName = (role: string | null) => {
    const roleMap: Record<string, string> = {
      'super_admin': 'Super Admin',
      'academic_staff': 'Academic Section',
      'faculty': 'Faculty',
      'student': 'Student',
      'mess_supervisor': 'Mess Supervisor',
      'hostel_warden': 'Hostel Warden',
      'hod': 'Head of Department',
      'director': 'Director',
    };
    return roleMap[role || ''] || role || 'Unknown';
  };

  const handleSignOut = async () => {
    try {
      console.log('Navbar: Starting sign out process...');
      
      // Add a timeout for the entire sign out process
      const signOutTimeout = setTimeout(() => {
        console.log('Navbar: Sign out taking too long, forcing page reload...');
        window.location.reload();
      }, 3000);
      
      await signOut();
      clearTimeout(signOutTimeout);
      
      console.log('Navbar: Sign out completed, showing toast...');
      
      toast({
        title: 'Signed out successfully',
        description: 'You have been signed out of your account.',
      });
      
      // Redirect to login page
      navigate('/', { replace: true });
      
    } catch (error) {
      console.error('Navbar: Sign out error:', error);
      toast({
        title: 'Error signing out',
        description: 'There was an error signing you out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Hamburger for mobile */}
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 md:hidden" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </DrawerTrigger>
            <h1 className="text-xl font-bold text-blue-700">
              IIIT Manipur Digital Campus
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user?.email}</p>
                    <p className="text-sm text-gray-500">
                      {getRoleDisplayName(userRole)}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
