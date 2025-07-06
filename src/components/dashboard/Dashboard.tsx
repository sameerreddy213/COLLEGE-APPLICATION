
import { useAuth } from '@/hooks/useAuth';
import DashboardStats from './DashboardStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { userRole } = useAuth();

  const getRoleSpecificContent = () => {
    switch (userRole) {
      case 'student':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>Your classes for today</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No classes scheduled for today.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
                <CardDescription>Your attendance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">85%</p>
                <p className="text-sm text-muted-foreground">Overall attendance</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'faculty':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Today's Classes</CardTitle>
                <CardDescription>Your teaching schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  3 classes scheduled today
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pending Attendance</CardTitle>
                <CardDescription>Classes requiring attendance marking</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">2</p>
                <p className="text-sm text-muted-foreground">Classes pending</p>
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your digital campus portal
        </p>
      </div>
      
      <DashboardStats />
      
      {getRoleSpecificContent()}
    </div>
  );
}
