import { useAuth } from '@/hooks/useAuthMongo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import DepartmentManagementModal from '@/components/admin/DepartmentManagementModal';
import StudentBatchManagementModal from '@/components/admin/StudentBatchManagementModal';
import CourseManagementModal from '@/components/admin/CourseManagementModal';

export default function AcademicStaffDashboard() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<{ name: string; code: string }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSection, setSelectedSection] = useState('A');
  const [showTimetableForm, setShowTimetableForm] = useState<{day: string, slot: string} | null>(null);
  const [holidays, setHolidays] = useState<{date: string, reason: string}[]>([]);
  const [holidayForm, setHolidayForm] = useState({date: '', reason: ''});
  const [faculty, setFaculty] = useState<{ _id: string; name: string; email: string }[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const { toast } = useToast();
  const [timetableForm, setTimetableForm] = useState({
    startTime: '',
    endTime: '',
    subject: '',
    facultyId: '',
    location: ''
  });

  useEffect(() => {
    apiClient.getAllDepartments().then(res => {
      const data = res.data as { departments?: { name: string; code: string }[] };
      if (data && Array.isArray(data.departments)) {
        setBranches(data.departments);
        if (data.departments.length > 0) {
          setSelectedBranch(data.departments[0].name);
        }
      }
    });
    apiClient.getAllProfiles({ role: 'faculty', limit: 1000 }).then(res => {
      const data = res.data as { profiles?: { _id: string; name: string; email: string }[] };
      if (data && Array.isArray(data.profiles)) {
        setFaculty(data.profiles);
      }
    });
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Academic Section Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome, {user?.profile?.name || user?.email}
        </p>
      </div>

      {/* Remove timetable management UI, add link instead */}
      {/* Remove the Go to Timetable Management button and its Link */}

      {/* Holiday Management */}
      <div className="my-8">
        <Link to="/academic/holiday-management">
          <Button variant="outline">Go to Holiday Management</Button>
        </Link>
      </div>

      {/* Administrative Actions */}
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Administrative Actions</CardTitle>
            <CardDescription>Academic management tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <DepartmentManagementModal />
            <StudentBatchManagementModal />
            <CourseManagementModal />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 