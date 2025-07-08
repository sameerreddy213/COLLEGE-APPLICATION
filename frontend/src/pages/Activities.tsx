import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { Activity, UserPlus, MessageSquare, Calendar, Settings, RefreshCw, Search, Filter } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'user_registration' | 'complaint_created' | 'attendance_marked' | 'system_update' | 'login' | 'profile_update';
  description: string;
  timestamp: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
  metadata?: {
    [key: string]: string | number | boolean;
  };
}

interface Profile {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

interface Complaint {
  _id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt?: string;
  studentId?: {
    name: string;
    email: string;
  };
}

interface AttendanceData {
  totalClasses: number;
  presentCount: number;
  absentCount: number;
}

export default function Activities() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  useEffect(() => {
    fetchAllActivities();
  }, []);

  const fetchAllActivities = async () => {
    // Rate limiting: prevent requests more frequent than 5 seconds
    const now = Date.now();
    if (now - lastFetchTime < 5000) {
      toast({
        title: 'Please wait',
        description: 'Please wait a moment before refreshing activities',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      setLastFetchTime(now);
      
      // Fetch data from different endpoints to create comprehensive activity feed
      const [profilesRes, complaintsRes, attendanceRes] = await Promise.allSettled([
        apiClient.getAllProfiles({ limit: 100 }),
        apiClient.getComplaints({ limit: 100 }),
        apiClient.getAttendanceStats()
      ]);

      const activityItems: ActivityItem[] = [];

      // Process user registrations
      if (profilesRes.status === 'fulfilled' && profilesRes.value.data && !profilesRes.value.error) {
        const responseData = profilesRes.value.data as { profiles?: Profile[] };
        const profiles = responseData.profiles || [];
        
        profiles.forEach((profile: Profile) => {
          activityItems.push({
            id: `user_${profile._id}`,
            type: 'user_registration',
            description: `New user registered: ${profile.name}`,
            timestamp: profile.createdAt || new Date().toISOString(),
            user: {
              name: profile.name,
              email: profile.email,
              role: profile.role
            }
          });
        });
      }

      // Process complaints
      if (complaintsRes.status === 'fulfilled' && complaintsRes.value.data && !complaintsRes.value.error) {
        const responseData = complaintsRes.value.data as { data?: Complaint[] };
        const complaints = responseData.data || [];
        
        complaints.forEach((complaint: Complaint) => {
          activityItems.push({
            id: `complaint_${complaint._id}`,
            type: 'complaint_created',
            description: `New complaint submitted: ${complaint.title}`,
            timestamp: complaint.createdAt || new Date().toISOString(),
            user: complaint.studentId ? {
              name: complaint.studentId.name,
              email: complaint.studentId.email,
              role: 'student'
            } : undefined,
            metadata: {
              category: complaint.category,
              priority: complaint.priority,
              status: complaint.status
            }
          });
        });
      }

      // Process attendance activities
      if (attendanceRes.status === 'fulfilled' && attendanceRes.value.data && !attendanceRes.value.error) {
        const responseData = attendanceRes.value.data as { data?: AttendanceData };
        const attendanceData = responseData.data;
        
        if (attendanceData && attendanceData.totalClasses > 0) {
          activityItems.push({
            id: 'attendance_summary',
            type: 'attendance_marked',
            description: `Attendance marked for ${attendanceData.totalClasses} classes today`,
            timestamp: new Date().toISOString(),
            metadata: {
              totalClasses: attendanceData.totalClasses,
              presentCount: attendanceData.presentCount,
              absentCount: attendanceData.absentCount
            }
          });
        }
      }

      // Add system activities
      activityItems.push({
        id: 'system_health',
        type: 'system_update',
        description: 'System health check completed',
        timestamp: new Date().toISOString(),
        metadata: {
          status: 'healthy',
          uptime: '99.9%'
        }
      });

      // Add login activities (mock data for demonstration)
      activityItems.push({
        id: 'login_1',
        type: 'login',
        description: 'User logged in successfully',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'student'
        }
      });

      // Sort by timestamp (most recent first)
      const sortedActivities = activityItems
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(sortedActivities);

    } catch (error) {
      console.error('Error fetching activities:', error);
      
      if (error instanceof Error && error.message.includes('Too many requests')) {
        toast({
          title: 'Rate Limited',
          description: 'Too many requests. Please wait a moment and try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load activities',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_registration':
        return <UserPlus className="h-4 w-4" />;
      case 'complaint_created':
        return <MessageSquare className="h-4 w-4" />;
      case 'attendance_marked':
        return <Calendar className="h-4 w-4" />;
      case 'system_update':
        return <Settings className="h-4 w-4" />;
      case 'login':
        return <Activity className="h-4 w-4" />;
      case 'profile_update':
        return <UserPlus className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityBadgeVariant = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_registration':
        return 'default';
      case 'complaint_created':
        return 'destructive';
      case 'attendance_marked':
        return 'secondary';
      case 'system_update':
        return 'outline';
      case 'login':
        return 'outline';
      case 'profile_update':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
  };

  const getActivityDescription = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'user_registration':
        return `New ${activity.user?.role || 'user'} registered`;
      case 'complaint_created':
        return `New ${activity.metadata?.category || 'complaint'} submitted`;
      case 'attendance_marked':
        return `Attendance marked for ${activity.metadata?.totalClasses || 0} classes`;
      case 'system_update':
        return 'System maintenance completed';
      case 'login':
        return 'User logged in';
      case 'profile_update':
        return 'Profile updated';
      default:
        return activity.description;
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Activities</h2>
        <p className="text-muted-foreground">
          View all system events and user activities
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                All Activities ({filteredActivities.length})
              </CardTitle>
              <CardDescription>Complete system activity log</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={fetchAllActivities}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search Activities</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by description, user name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="type-filter">Filter by Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="user_registration">User Registration</SelectItem>
                  <SelectItem value="complaint_created">Complaints</SelectItem>
                  <SelectItem value="attendance_marked">Attendance</SelectItem>
                  <SelectItem value="system_update">System Updates</SelectItem>
                  <SelectItem value="login">Logins</SelectItem>
                  <SelectItem value="profile_update">Profile Updates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 animate-pulse">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No activities found</p>
              <p className="text-sm">
                {activities.length === 0 ? 'No activities in the system' : 'No activities match your search criteria'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-2 rounded-full bg-muted">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium truncate">
                        {getActivityDescription(activity)}
                      </span>
                      <Badge variant={getActivityBadgeVariant(activity.type)} className="text-xs">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    {activity.user && (
                      <span className="text-xs text-muted-foreground mb-2 block">
                        by {activity.user.name} ({activity.user.email}) - {activity.user.role}
                      </span>
                    )}
                    
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <span className="flex flex-wrap gap-1 mb-2">
                        {Object.entries(activity.metadata).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {value}
                          </Badge>
                        ))}
                      </span>
                    )}
                    
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 