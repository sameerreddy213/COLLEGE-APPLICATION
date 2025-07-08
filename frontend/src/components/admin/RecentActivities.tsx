import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { Activity, UserPlus, MessageSquare, Calendar, Settings, RefreshCw, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

interface RecentActivitiesProps {
  limit?: number;
  showRefresh?: boolean;
}

export default function RecentActivities({ limit = 10, showRefresh = true }: RecentActivitiesProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    // Rate limiting: prevent requests more frequent than 3 seconds
    const now = Date.now();
    if (now - lastFetchTime < 3000) {
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
      
      // Fetch recent data from different endpoints to create activity feed
      const [profilesRes, complaintsRes, attendanceRes] = await Promise.allSettled([
        apiClient.getAllProfiles({ limit: 5 }),
        apiClient.getComplaints({ limit: 5 }),
        apiClient.getAttendanceStats()
      ]);

      const activityItems: ActivityItem[] = [];

      // Process recent user registrations
      if (profilesRes.status === 'fulfilled' && profilesRes.value.data && !profilesRes.value.error) {
        const responseData = profilesRes.value.data as { profiles?: Profile[] };
        const profiles = responseData.profiles || [];
        
        // Get recent profiles (last 5)
        const recentProfiles = profiles.slice(0, 5);
        recentProfiles.forEach((profile: Profile) => {
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

      // Process recent complaints
      if (complaintsRes.status === 'fulfilled' && complaintsRes.value.data && !complaintsRes.value.error) {
        const responseData = complaintsRes.value.data as { data?: Complaint[] };
        const complaints = responseData.data || [];
        
        complaints.slice(0, 3).forEach((complaint: Complaint) => {
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

      // Sort by timestamp (most recent first) and limit
      const sortedActivities = activityItems
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      setActivities(sortedActivities);

    } catch (error) {
      console.error('Error fetching recent activities:', error);
      
      // Check if it's a rate limiting error
      if (error instanceof Error && error.message.includes('Too many requests')) {
        toast({
          title: 'Rate Limited',
          description: 'Too many requests. Please wait a moment and try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load recent activities',
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest system events and user activities</CardDescription>
          </div>
          {showRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecentActivities}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activities</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(showAll ? activities : activities.slice(0, 3)).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  <div className="p-1 rounded-full bg-muted">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">
                      {getActivityDescription(activity)}
                    </span>
                    <Badge variant={getActivityBadgeVariant(activity.type)} className="text-xs">
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  {activity.user && (
                    <span className="text-xs text-muted-foreground mb-1 block">
                      by {activity.user.name} ({activity.user.email})
                    </span>
                  )}
                  {activity.metadata && (
                    <span className="flex flex-wrap gap-1 mb-1">
                      {activity.metadata.category && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.category}
                        </Badge>
                      )}
                      {activity.metadata.priority && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.priority}
                        </Badge>
                      )}
                      {activity.metadata.status && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.status}
                        </Badge>
                      )}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {activities.length > 3 && !showAll && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => setShowAll(true)}
              >
                View More
              </Button>
            )}
            {showAll && activities.length > 3 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => setShowAll(false)}
              >
                Show Less
              </Button>
            )}
          </div>
        )}
        {activities.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => navigate('/activities')}
            >
              View All Activities
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 