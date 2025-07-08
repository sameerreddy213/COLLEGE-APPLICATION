import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuthMongo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, BookOpen } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Profile {
  _id: string;
  name: string;
  email: string;
  department?: string;
  phoneNumber?: string;
  isActive: boolean;
  role: string;
}

interface FacultyDepartment {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  hod?: string;
  isActive: boolean;
  createdAt: string;
}

export default function HODDashboard() {
  const { user } = useAuth();
  const [department, setDepartment] = useState<FacultyDepartment | null>(null);
  const [students, setStudents] = useState<Profile[]>([]);
  const [faculty, setFaculty] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      // Find the department where this user is HOD
      const deptRes = await apiClient.getAllFacultyDepartments();
      const departments = (deptRes.data && Array.isArray((deptRes.data as { departments?: FacultyDepartment[] }).departments))
        ? (deptRes.data as { departments: FacultyDepartment[] }).departments
        : [];
      const myDept = departments.find(d => d.hod === user.id);
      setDepartment(myDept || null);
      if (myDept) {
        // Fetch students and faculty in this department
        const [studentsRes, facultyRes] = await Promise.all([
          apiClient.getAllProfiles({ role: 'student', department: myDept.name, limit: 1000 }),
          apiClient.getAllProfiles({ role: 'faculty', department: myDept.name, limit: 1000 })
        ]);
        setStudents((studentsRes.data as { profiles?: Profile[] }).profiles || []);
        setFaculty((facultyRes.data as { profiles?: Profile[] }).profiles || []);
      } else {
        setStudents([]);
        setFaculty([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Head of Department Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome, {user?.profile?.name || user?.email}! Here you can manage your department, view analytics, and oversee faculty and students.
        </p>
      </div>
      {loading ? (
        <div>Loading department data...</div>
      ) : department ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
              <CardDescription>
                {department.name} ({department.code})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <div className="text-lg font-semibold">{students.length}</div>
                    <div className="text-xs text-muted-foreground">Students</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <div className="text-lg font-semibold">{faculty.length}</div>
                    <div className="text-xs text-muted-foreground">Faculty</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Department Assigned</CardTitle>
            <CardDescription>
              You are not currently assigned as HOD to any department.
            </CardDescription>
          </CardHeader>
        </Card>
      )}


    </div>
  );
} 