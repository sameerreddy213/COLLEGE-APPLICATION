import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuthMongo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ClipboardList, MessageSquare, Utensils, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '@/lib/api';

interface AttendanceStats {
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  attendancePercentage: number;
}

interface TodayClass {
  subject: string;
  startTime: string;
  endTime: string;
  room: string;
  teacher: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
}

interface Complaint {
  _id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

interface MessMenu {
  breakfast: {
    veg: { items: Array<{ name: string; description?: string }> };
    nonVeg: { items: Array<{ name: string; description?: string }> };
  };
  lunch: {
    veg: { items: Array<{ name: string; description?: string }> };
    nonVeg: { items: Array<{ name: string; description?: string }> };
  };
  dinner: {
    veg: { items: Array<{ name: string; description?: string }> };
    nonVeg: { items: Array<{ name: string; description?: string }> };
  };
  snacks: { items: Array<{ name: string; description?: string }> };
  isSpecialDay: boolean;
  specialDayName?: string;
}

interface AttendanceStatsResponse {
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  attendancePercentage: number;
}

interface StudentAttendanceSummary {
  studentId: string;
  overallPercentage: string;
  totalClasses: number;
  totalPresent: number;
  subjectStats: Record<string, unknown>;
  recentRecords: unknown[];
}

interface RecentActivity {
  type: 'attendance' | 'complaint' | 'timetable';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // State for dashboard data
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    totalClasses: 0,
    presentClasses: 0,
    absentClasses: 0,
    attendancePercentage: 0
  });
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [todayMenu, setTodayMenu] = useState<MessMenu | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all data in parallel
      const [attendanceRes, complaintsRes, menuRes] = await Promise.allSettled([
        apiClient.getAttendanceStats({ studentId: user?.profile?.id }),
        apiClient.getComplaints({ submittedBy: user?.profile?.id }),
        apiClient.getTodayMenu()
      ]);

      // Handle attendance data
      if (attendanceRes.status === 'fulfilled' && attendanceRes.value && attendanceRes.value.data) {
        const responseData = attendanceRes.value.data as { data?: StudentAttendanceSummary } | StudentAttendanceSummary;
        const stats = 'data' in responseData ? responseData.data : responseData;
        
        if (stats && 'totalClasses' in stats) {
          setAttendanceStats({
            totalClasses: stats.totalClasses || 0,
            presentClasses: stats.totalPresent || 0,
            absentClasses: (stats.totalClasses || 0) - (stats.totalPresent || 0),
            attendancePercentage: parseFloat(stats.overallPercentage || '0')
          });
        }
      } else if (attendanceRes.status === 'rejected') {
        console.error('Attendance API error:', attendanceRes.reason);
        // Set default values if attendance data fails to load
        setAttendanceStats({
          totalClasses: 0,
          presentClasses: 0,
          absentClasses: 0,
          attendancePercentage: 0
        });
      }

      // Handle complaints data
      if (complaintsRes.status === 'fulfilled' && complaintsRes.value && complaintsRes.value.data) {
        setComplaints(complaintsRes.value.data as Complaint[]);
      } else if (complaintsRes.status === 'rejected') {
        console.error('Complaints API error:', complaintsRes.reason);
        setComplaints([]);
      }

      // Handle mess menu data
      if (menuRes.status === 'fulfilled' && menuRes.value && menuRes.value.data) {
        const responseData = menuRes.value.data as { data: MessMenu } | MessMenu;
        const menuData = 'data' in responseData ? responseData.data : responseData;
        setTodayMenu(menuData);
      } else if (menuRes.status === 'rejected') {
        console.error('Mess menu API error:', menuRes.reason);
        setTodayMenu(null);
      }

      // Generate recent activities
      generateRecentActivities();

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecentActivities = () => {
    const activities: RecentActivity[] = [];
    
    // Add attendance activities
    if (attendanceStats.totalClasses > 0) {
      activities.push({
        type: 'attendance',
        title: 'Attendance Updated',
        description: `${attendanceStats.attendancePercentage}% overall attendance`,
        timestamp: new Date().toISOString(),
        status: attendanceStats.attendancePercentage >= 75 ? 'good' : 'warning'
      });
    }

    // Add complaint activities
    (Array.isArray(complaints) ? complaints : []).slice(0, 2).forEach(complaint => {
      activities.push({
        type: 'complaint',
        title: complaint.title,
        description: `Status: ${complaint.status.replace('_', ' ')}`,
        timestamp: complaint.createdAt,
        status: complaint.status
      });
    });

    // Add timetable activities
    if (todayClasses.length > 0) {
      activities.push({
        type: 'timetable',
        title: 'Today\'s Classes',
        description: `${todayClasses.length} classes scheduled`,
        timestamp: new Date().toISOString()
      });
    }

    setRecentActivities(activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 5));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
      case 'warning':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'warning':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getClassStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Student Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {user?.profile?.name || user?.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.attendancePercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {attendanceStats.presentClasses} present / {attendanceStats.totalClasses} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayClasses.length}</div>
            <p className="text-xs text-muted-foreground">Classes scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complaints</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(Array.isArray(complaints) ? complaints : []).length}</div>
            <p className="text-xs text-muted-foreground">
              {(Array.isArray(complaints) ? complaints : []).filter(c => c.status === 'pending' || c.status === 'in_progress').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mess Menu</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {todayMenu ? (
              <div>
                <div className="text-sm font-medium">
                  {todayMenu.isSpecialDay ? todayMenu.specialDayName : 'Regular Menu'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {todayMenu.breakfast.veg.items.length + todayMenu.breakfast.nonVeg.items.length} breakfast items
                </p>
              </div>
            ) : (
              <div>
                <div className="text-sm font-medium">No Menu</div>
                <p className="text-xs text-muted-foreground">No menu for today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              className="w-full justify-start" 
              onClick={() => navigate('/attendance')}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              View Attendance
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/complaints')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              File Complaint
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/mess-menu')}
            >
              <Utensils className="mr-2 h-4 w-4" />
              View Mess Menu
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Classes</CardTitle>
            <CardDescription>Your schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todayClasses.length > 0 ? (
              <div className="space-y-3">
                {todayClasses.map((class_, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{class_.subject}</div>
                      <div className="text-xs text-muted-foreground">
                        {class_.startTime} - {class_.endTime} • Room {class_.room}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {class_.teacher}
                      </div>
                    </div>
                    <Badge className={getClassStatusColor(class_.status)}>
                      {class_.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No classes scheduled for today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Your latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    {getStatusIcon(activity.status || 'default')}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activities</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Complaints</CardTitle>
            <CardDescription>Your ongoing issues</CardDescription>
          </CardHeader>
          <CardContent>
            {(Array.isArray(complaints) ? complaints : []).filter(c => c.status === 'pending' || c.status === 'in_progress').length > 0 ? (
              <div className="space-y-3">
                {(Array.isArray(complaints) ? complaints : [])
                  .filter(c => c.status === 'pending' || c.status === 'in_progress')
                  .slice(0, 3)
                  .map((complaint) => (
                    <div key={complaint._id} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{complaint.title}</div>
                        <div className="text-xs text-muted-foreground">
                          Priority: {complaint.priority}
                        </div>
                      </div>
                      <Badge className={getStatusColor(complaint.status)}>
                        {complaint.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active complaints</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
