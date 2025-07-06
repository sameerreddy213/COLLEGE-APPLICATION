
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  Users, 
  Calendar, 
  ClipboardList, 
  MessageSquare, 
  Utensils,
  Building,
  BookOpen,
  BarChart3,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  href?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    icon: Home,
    roles: ['super_admin', 'academic_staff', 'faculty', 'student', 'mess_supervisor', 'hostel_warden', 'hod', 'director'],
  },
  {
    label: 'Students',
    icon: Users,
    roles: ['super_admin', 'academic_staff', 'faculty', 'hod', 'director'],
  },
  {
    label: 'Faculty',
    icon: Users,
    roles: ['super_admin', 'academic_staff', 'hod', 'director'],
  },
  {
    label: 'Timetable',
    icon: Calendar,
    roles: ['super_admin', 'academic_staff', 'faculty', 'student'],
  },
  {
    label: 'Attendance',
    icon: ClipboardList,
    roles: ['faculty', 'student', 'hod', 'director'],
  },
  {
    label: 'Subjects',
    icon: BookOpen,
    roles: ['super_admin', 'academic_staff', 'faculty', 'student'],
  },
  {
    label: 'Departments',
    icon: Building,
    roles: ['super_admin', 'academic_staff', 'hod', 'director'],
  },
  {
    label: 'Hostel Complaints',
    icon: MessageSquare,
    roles: ['student', 'hostel_warden', 'director'],
  },
  {
    label: 'Mess Menu',
    icon: Utensils,
    roles: ['mess_supervisor', 'student', 'director'],
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    roles: ['hod', 'director', 'super_admin'],
  },
  {
    label: 'Settings',
    icon: Settings,
    roles: ['super_admin'],
  },
];

export default function Sidebar() {
  const { userRole } = useAuth();

  const visibleItems = sidebarItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  return (
    <div className="w-64 bg-white shadow-sm border-r min-h-screen">
      <div className="p-4">
        <nav className="space-y-2">
          {visibleItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left",
                "hover:bg-blue-50 hover:text-blue-700"
              )}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.label}
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
}
