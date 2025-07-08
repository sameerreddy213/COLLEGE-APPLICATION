import { useAuth } from '@/hooks/useAuthMongo';
import { useLocation, Link } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  ClipboardList, 
  MessageSquare, 
  Utensils,
  Building,
  BarChart3,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  href: string;
}

const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    icon: Home,
    roles: ['super_admin', 'academic_staff', 'faculty', 'student', 'mess_supervisor', 'hostel_warden', 'hod', 'director'],
    href: '/dashboard'
  },
  {
    label: 'Students',
    icon: Users,
    roles: ['super_admin', 'academic_staff', 'faculty', 'hod', 'director'],
    href: '/students'
  },
  {
    label: 'Faculty',
    icon: Users,
    roles: ['super_admin', 'academic_staff', 'hod', 'director'],
    href: '/faculty'
  },
  {
    label: 'Attendance',
    icon: ClipboardList,
    roles: ['faculty', 'student', 'hod', 'director'],
    href: '/attendance'
  },

  {
    label: 'Departments',
    icon: Building,
    roles: ['super_admin', 'academic_staff', 'hod', 'director'],
    href: '/departments'
  },
  {
    label: 'Hostel Complaints',
    icon: MessageSquare,
    roles: ['student', 'hostel_warden', 'director'],
    href: '/complaints'
  },
  {
    label: 'Mess Menu',
    icon: Utensils,
    roles: ['mess_supervisor', 'student', 'director'],
    href: '/mess-menu'
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    roles: ['hod', 'director', 'super_admin'],
    href: '/analytics'
  },
  {
    label: 'Settings',
    icon: Settings,
    roles: ['super_admin'],
    href: '/settings'
  },
];

interface SidebarProps {
  closeDrawer?: () => void;
}

export default function Sidebar({ closeDrawer }: SidebarProps) {
  const { user } = useAuth();
  const userRole = user?.profile?.role;
  const location = useLocation();

  const visibleItems = sidebarItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  // Helper to detect mobile
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

  return (
    <div className="w-64 bg-white shadow-sm border-r min-h-screen max-w-full">
      <div className="p-4">
        <nav className="space-y-2">
          {visibleItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left",
                "hover:bg-blue-50 hover:text-blue-700",
                location.pathname === item.href && "bg-blue-50 text-blue-700 font-medium"
              )}
              asChild
              onClick={() => { if (isMobile && closeDrawer) closeDrawer(); }}
            >
              <Link to={item.href}>
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
}
