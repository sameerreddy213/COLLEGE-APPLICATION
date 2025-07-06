
import { useAuth } from '@/hooks/useAuth';
import StudentDashboard from '@/components/students/StudentDashboard';
import FacultyDashboard from '@/components/faculty/FacultyDashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';
import HostelWardenDashboard from '@/components/hostel/HostelWardenDashboard';
import MessSupervisorDashboard from '@/components/mess/MessSupervisorDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { userRole } = useAuth();

  const renderDashboard = () => {
    switch (userRole) {
      case 'student':
        return <StudentDashboard />;
      case 'faculty':
        return <FacultyDashboard />;
      case 'super_admin':
      case 'academic_staff':
        return <AdminDashboard />;
      case 'hostel_warden':
        return <HostelWardenDashboard />;
      case 'mess_supervisor':
        return <MessSupervisorDashboard />;
      case 'hod':
      case 'director':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Leadership Dashboard</h2>
              <p className="text-muted-foreground">
                Welcome to your executive overview
              </p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>
                  Department-wide insights and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Advanced analytics features coming soon...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to IIIT Manipur Digital Campus</CardTitle>
              <CardDescription>
                Your role: {userRole?.replace('_', ' ').toUpperCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use the sidebar to navigate through the available features.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return renderDashboard();
}
