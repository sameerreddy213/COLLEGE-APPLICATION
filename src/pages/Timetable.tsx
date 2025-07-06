
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const timeSlots = [
  '09:00 - 10:00',
  '10:00 - 11:00', 
  '11:15 - 12:15',
  '12:15 - 13:15',
  '14:15 - 15:15',
  '15:15 - 16:15',
  '16:30 - 17:30'
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const sampleTimetable = {
  Monday: {
    '09:00 - 10:00': { subject: 'Mathematics', room: 'Room 101', faculty: 'Dr. Smith' },
    '10:00 - 11:00': { subject: 'Physics', room: 'Room 102', faculty: 'Dr. Johnson' },
    '11:15 - 12:15': { subject: 'Chemistry', room: 'Lab 1', faculty: 'Dr. Brown' },
    '14:15 - 15:15': { subject: 'Computer Science', room: 'Lab 2', faculty: 'Dr. Davis' }
  },
  Tuesday: {
    '09:00 - 10:00': { subject: 'English', room: 'Room 201', faculty: 'Prof. Wilson' },
    '11:15 - 12:15': { subject: 'Mathematics', room: 'Room 101', faculty: 'Dr. Smith' },
    '15:15 - 16:15': { subject: 'Physics Lab', room: 'Physics Lab', faculty: 'Dr. Johnson' }
  }
};

export default function Timetable() {
  const { userRole } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Timetable</h2>
        <p className="text-muted-foreground">
          {userRole === 'student' ? 'Your class schedule' : 'Teaching schedule'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>
            CSE 3rd Year - Section A
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-50 text-left font-medium">Time</th>
                  {days.map(day => (
                    <th key={day} className="border p-2 bg-gray-50 text-left font-medium min-w-32">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(timeSlot => (
                  <tr key={timeSlot}>
                    <td className="border p-2 font-medium bg-gray-50">{timeSlot}</td>
                    {days.map(day => {
                      const classInfo = sampleTimetable[day as keyof typeof sampleTimetable]?.[timeSlot];
                      return (
                        <td key={`${day}-${timeSlot}`} className="border p-2">
                          {classInfo ? (
                            <div className="bg-blue-50 p-2 rounded border-l-4 border-blue-500">
                              <div className="font-medium text-sm">{classInfo.subject}</div>
                              <div className="text-xs text-gray-600">{classInfo.room}</div>
                              <div className="text-xs text-gray-500">{classInfo.faculty}</div>
                            </div>
                          ) : (
                            <div className="h-16"></div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
