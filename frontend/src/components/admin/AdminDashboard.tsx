import { useAuth } from '@/hooks/useAuthMongo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Building, BarChart3, Settings, UserPlus, Calendar, MessageSquare, Utensils, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserManagementModal from './UserManagementModal';
import DepartmentManagementModal from './DepartmentManagementModal';
import StudentBatchManagementModal from './StudentBatchManagementModal';
import CourseManagementModal from './CourseManagementModal';
import SystemSettingsModal from './SystemSettingsModal';
import RecentActivities from './RecentActivities';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalBatches: 0,
    totalDepartments: 0,
    totalComplaints: 0,
    systemHealth: 0,
    totalSubjects: 0,
    totalCourses: 0
  });
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batches, setBatches] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    fetchDashboardData();
    fetchBatches();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [profilesRes, complaintsRes, healthRes, departmentsRes, batchesRes, coursesRes] = await Promise.all([
        apiClient.getAllProfiles({ limit: 1000 }),
        apiClient.getComplaintStats(),
        apiClient.healthCheck(),
        apiClient.getAllDepartments(),
        apiClient.getAllBatches(),
        apiClient.getAllCourses({ isActive: true })
      ]);
      if (profilesRes.data) {
        const responseData = profilesRes.data as { profiles?: { role: string }[] };
        const profiles = responseData.profiles || [];
        const roleCounts = profiles.reduce((acc: Record<string, number>, profile) => {
          acc[profile.role] = (acc[profile.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        setStats(prev => ({
          ...prev,
          totalUsers: profiles.length,
          totalStudents: roleCounts.student || 0,
          totalFaculty: roleCounts.faculty || 0,
        }));
      }
      if (departmentsRes.data) {
        const depts = (departmentsRes.data as { departments?: unknown[] }).departments;
        setStats(prev => ({ ...prev, totalDepartments: Array.isArray(depts) ? depts.length : 0 }));
      }
      if (batchesRes.data) {
        const batches = Array.isArray(batchesRes.data) ? batchesRes.data : (batchesRes.data as { batches?: unknown[] }).batches || [];
        setStats(prev => ({ ...prev, totalBatches: batches.length }));
      }
      if (coursesRes.data) {
        const courses = Array.isArray(coursesRes.data) ? coursesRes.data : [];
        setStats(prev => ({ ...prev, totalCourses: courses.length }));
      }
      if (complaintsRes.data) {
        const responseData = complaintsRes.data as { data?: { total?: number; byStatus?: { open?: number } } };
        const complaintData = responseData.data;
        setStats(prev => ({ ...prev, totalComplaints: complaintData?.byStatus?.open || 0 }));
      }
      setStats(prev => ({ ...prev, totalSubjects: 0 }));
      if (healthRes.data) {
        setStats(prev => ({ ...prev, systemHealth: 99 }));
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatches = async () => {
    const res = await apiClient.getAllBatches();
    if (Array.isArray(res.data)) {
      setBatches(res.data as { _id: string; name: string }[]);
    } else if (res.data && typeof res.data === 'object' && Array.isArray((res.data as { batches?: unknown[] }).batches)) {
      setBatches(((res.data as { batches: { _id: string; name: string }[] }).batches));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome, {user?.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All system users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats.totalStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats.totalFaculty.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Teaching staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Student Batches</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats.totalBatches.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total batches</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats.totalDepartments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complaints</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats.totalComplaints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Open complaints</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{isLoading ? '...' : stats.systemHealth + '%'}</div>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : stats.totalCourses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total courses</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Administrative Actions</CardTitle>
            <CardDescription>System management tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <UserManagementModal />
            <DepartmentManagementModal />
            <StudentBatchManagementModal />
            <CourseManagementModal />
            <SystemSettingsModal />
          </CardContent>
        </Card>
        <RecentActivities limit={5} />
      </div>
    </div>
  );
}
