
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuthMongo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Clock, CheckCircle } from 'lucide-react';

const complaintsData = [
  {
    id: 1,
    title: 'Water supply issue in Room 201',
    description: 'No water supply since morning',
    status: 'open',
    block: 'Block A',
    room: '201',
    date: '2024-01-15',
    priority: 'high'
  },
  {
    id: 2,
    title: 'AC not working in Room 305',
    description: 'Air conditioning unit stopped working',
    status: 'resolved',
    block: 'Block B', 
    room: '305',
    date: '2024-01-14',
    priority: 'medium'
  },
  {
    id: 3,
    title: 'WiFi connectivity issue',
    description: 'Slow internet connection in hostel',
    status: 'completed',
    block: 'Block A',
    room: '150',
    date: '2024-01-13',
    priority: 'low'
  }
];

export default function Complaints() {
  const { user } = useAuth();
  const userRole = user?.profile?.role;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'resolved': return 'secondary';
      case 'completed': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <MessageSquare className="h-4 w-4" />;
      case 'resolved': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Hostel Complaints</h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            {userRole === 'student' ? 'Your complaint history' : 'Manage hostel complaints'}
          </p>
        </div>
        {userRole === 'student' && (
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            File New Complaint
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Complaints</CardTitle>
            <MessageSquare className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {complaintsData.filter(c => c.status === 'open').length}
            </div>
            <p className="text-xs text-muted-foreground">Pending resolution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {complaintsData.filter(c => c.status === 'resolved').length}
            </div>
            <p className="text-xs text-muted-foreground">Being resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {complaintsData.filter(c => c.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {userRole === 'student' ? 'Your Complaints' : 'All Complaints'}
          </CardTitle>
          <CardDescription>
            {userRole === 'student' 
              ? 'Track the status of your submitted complaints'
              : 'Manage and resolve student complaints'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 overflow-x-auto">
            {complaintsData.map((complaint) => (
              <div key={complaint.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(complaint.status)}
                      <h3 className="font-semibold">{complaint.title}</h3>
                      <Badge variant={getStatusColor(complaint.status)}>
                        {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {complaint.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-muted-foreground">
                        {complaint.block} - {complaint.room}
                      </span>
                      <span className="text-muted-foreground">
                        {complaint.date}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {complaint.priority} priority
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {userRole === 'hostel_warden' && complaint.status === 'open' && (
                      <Button size="sm">
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
