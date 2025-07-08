
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuthMongo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Calendar } from 'lucide-react';

const attendanceData = [
  { date: '2024-01-15', subject: 'Mathematics', status: 'Present', faculty: 'Dr. Smith' },
  { date: '2024-01-15', subject: 'Physics', status: 'Present', faculty: 'Dr. Johnson' },
  { date: '2024-01-14', subject: 'Chemistry', status: 'Absent', faculty: 'Dr. Brown' },
  { date: '2024-01-14', subject: 'Computer Science', status: 'Present', faculty: 'Dr. Davis' },
  { date: '2024-01-13', subject: 'Mathematics', status: 'Present', faculty: 'Dr. Smith' },
  { date: '2024-01-13', subject: 'English', status: 'Present', faculty: 'Prof. Wilson' },
];

export default function Attendance() {
  const { user } = useAuth();
  const userRole = user?.profile?.role;

  const overallAttendance = Math.round(
    (attendanceData.filter(record => record.status === 'Present').length / attendanceData.length) * 100
  );

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Attendance</h2>
        <p className="text-muted-foreground text-base sm:text-lg">
          {userRole === 'student' ? 'Your attendance records' : 'Mark student attendance'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallAttendance}%</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Attended</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {attendanceData.filter(record => record.status === 'Present').length}
            </div>
            <p className="text-xs text-muted-foreground">Out of {attendanceData.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Missed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {attendanceData.filter(record => record.status === 'Absent').length}
            </div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>Recent attendance history</CardDescription>
        </CardHeader>
        <CardContent>
          {userRole === 'faculty' && (
            <div className="mb-4">
              <Button>Mark Today's Attendance</Button>
            </div>
          )}
          <div className="space-y-2 overflow-x-auto">
            {attendanceData.map((record, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{record.subject}</p>
                    <Badge variant={record.status === 'Present' ? 'default' : 'destructive'}>
                      {record.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{record.faculty}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{record.date}</p>
                  {record.status === 'Present' ? (
                    <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
