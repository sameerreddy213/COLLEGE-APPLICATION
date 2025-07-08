import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuthMongo';

interface StudentDepartment {
  _id: string;
  name: string;
  code: string;
  description?: string;
  hod?: string;
  isActive: boolean;
  createdAt: string;
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

export default function Departments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'student' | 'faculty'>('student');
  const [studentDepartments, setStudentDepartments] = useState<StudentDepartment[]>([]);
  const [facultyDepartments, setFacultyDepartments] = useState<FacultyDepartment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [editStudentDept, setEditStudentDept] = useState<StudentDepartment | null>(null);
  const [editFacultyDept, setEditFacultyDept] = useState<FacultyDepartment | null>(null);
  const [formStudent, setFormStudent] = useState({ name: '', code: '', description: '', hod: '', isActive: true });
  const [formFaculty, setFormFaculty] = useState({ name: '', code: '', description: '', hod: '', isActive: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    const [studentRes, facultyRes] = await Promise.all([
      apiClient.getAllDepartments(),
      apiClient.getAllFacultyDepartments()
    ]);
    setStudentDepartments((studentRes.data && Array.isArray((studentRes.data as { departments?: unknown[] }).departments)
      ? (studentRes.data as { departments: StudentDepartment[] }).departments
      : []));
    setFacultyDepartments((facultyRes.data && Array.isArray((facultyRes.data as { departments?: unknown[] }).departments)
      ? (facultyRes.data as { departments: FacultyDepartment[] }).departments
      : []));
    setLoading(false);
  };

  const filteredStudent = studentDepartments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );
  const filteredFaculty = facultyDepartments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.code || '').toLowerCase().includes(search.toLowerCase())
  );

  // Handlers for Student Departments
  const openAddStudent = () => {
    setEditStudentDept(null);
    setFormStudent({ name: '', code: '', description: '', hod: '', isActive: true });
    setShowStudentModal(true);
  };
  const openEditStudent = (dept: StudentDepartment) => {
    setEditStudentDept(dept);
    setFormStudent({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      hod: dept.hod || '',
      isActive: dept.isActive
    });
    setShowStudentModal(true);
  };
  const saveStudentDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editStudentDept) {
        await apiClient.updateDepartment(editStudentDept._id, formStudent);
        toast({ title: 'Success', description: 'Student department updated.' });
      } else {
        await apiClient.createDepartment(formStudent);
        toast({ title: 'Success', description: 'Student department created.' });
      }
      setShowStudentModal(false);
      fetchDepartments();
    } catch (error: unknown) {
      let errorMsg = 'Failed to save department';
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
        errorMsg = (error.response.data as { error?: string }).error || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Handlers for Faculty Departments
  const openAddFaculty = () => {
    setEditFacultyDept(null);
    setFormFaculty({ name: '', code: '', description: '', hod: '', isActive: true });
    setShowFacultyModal(true);
  };
  const openEditFaculty = (dept: FacultyDepartment) => {
    setEditFacultyDept(dept);
    setFormFaculty({
      name: dept.name,
      code: dept.code || '',
      description: dept.description || '',
      hod: dept.hod || '',
      isActive: dept.isActive
    });
    setShowFacultyModal(true);
  };
  const saveFacultyDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editFacultyDept) {
        await apiClient.updateFacultyDepartment(editFacultyDept._id, formFaculty);
        toast({ title: 'Success', description: 'Faculty department updated.' });
      } else {
        await apiClient.createFacultyDepartment(formFaculty);
        toast({ title: 'Success', description: 'Faculty department created.' });
      }
      setShowFacultyModal(false);
      fetchDepartments();
    } catch (error: unknown) {
      let errorMsg = 'Failed to save department';
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
        errorMsg = (error.response.data as { error?: string }).error || errorMsg;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 px-0 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Departments</h1>
        <p className="text-muted-foreground text-base sm:text-lg">All academic departments in the system.</p>
      </div>
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'student' | 'faculty')}>
        <TabsList className="mb-4">
          <TabsTrigger value="student">Student Departments</TabsTrigger>
          <TabsTrigger value="faculty">Faculty Departments</TabsTrigger>
        </TabsList>
        <TabsContent value="student">
          <Card className="rounded-none shadow-none border-0 p-0 sm:rounded-lg sm:shadow-sm sm:border">
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>Student Department List ({filteredStudent.length})</span>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Input
                    placeholder="Search by name or code..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full max-w-xs sm:max-w-sm md:max-w-md"
                  />
                  {user?.profile?.role === 'super_admin' && (
                    <Button onClick={openAddStudent}>Add Department</Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading departments...</div>
              ) : filteredStudent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No student departments found.</div>
              ) : (
                <div className="overflow-x-auto w-screen -mx-4 pr-4 sm:w-full sm:mx-0 sm:pr-0">
                  <Table className="max-w-none">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-normal break-words min-w-[80px] text-xs sm:text-sm p-2">Name</TableHead>
                        <TableHead className="whitespace-normal break-words min-w-[60px] text-xs sm:text-sm p-2">Code</TableHead>
                        <TableHead className="whitespace-normal break-words min-w-[100px] text-xs sm:text-sm p-2">Description</TableHead>
                        <TableHead className="whitespace-normal break-words min-w-[80px] text-xs sm:text-sm p-2">HOD</TableHead>
                        <TableHead className="whitespace-normal break-words min-w-[60px] text-xs sm:text-sm p-2">Status</TableHead>
                        <TableHead className="whitespace-normal break-words min-w-[80px] text-xs sm:text-sm p-2">Created At</TableHead>
                        <TableHead className="whitespace-normal break-words min-w-[80px] text-xs sm:text-sm p-2">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudent.map(dept => (
                        <TableRow key={dept._id}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell>{dept.code}</TableCell>
                          <TableCell>{dept.description || '-'}</TableCell>
                          <TableCell>{dept.hod || '-'}</TableCell>
                          <TableCell>{dept.isActive ? 'Active' : 'Inactive'}</TableCell>
                          <TableCell>{new Date(dept.createdAt).toLocaleDateString()}</TableCell>
                          {user?.profile?.role === 'super_admin' && (
                            <TableCell>
                              <Button size="sm" variant="outline" onClick={() => openEditStudent(dept)}>Edit</Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="faculty">
          <Card className="rounded-none shadow-none border-0 p-0 sm:rounded-lg sm:shadow-sm sm:border">
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>Faculty Department List ({filteredFaculty.length})</span>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Input
                    placeholder="Search by name or code..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full max-w-xs sm:max-w-sm md:max-w-md"
                  />
                  {user?.profile?.role === 'super_admin' && (
                    <Button onClick={openAddFaculty}>Add Department</Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading departments...</div>
              ) : filteredFaculty.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No faculty departments found.</div>
              ) : (
                <div className="overflow-x-auto w-screen -mx-4 pr-4 sm:w-full sm:mx-0 sm:pr-0">
                  <Table className="max-w-none">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-normal break-words min-w-[80px] text-xs sm:text-sm p-2">Name</TableHead>
                        <TableHead className="whitespace-normal break-words min-w-[60px] text-xs sm:text-sm p-2">Code</TableHead>
                        <TableHead className="whitespace-normal break-words min-w-[100px] text-xs sm:text-sm p-2">Description</TableHead>
                        <TableHead className="whitespace-normal break-words min-w-[80px] text-xs sm:text-sm p-2">HOD</TableHead>
                        <TableHead className="whitespace-normal break-words min-w-[60px] text-xs sm:text-sm p-2">Status</TableHead>
                        <TableHead className="whitespace-normal break-words min-w-[80px] text-xs sm:text-sm p-2">Created At</TableHead>
                        <TableHead className="whitespace-normal break-words min-w-[80px] text-xs sm:text-sm p-2">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFaculty.map(dept => (
                        <TableRow key={dept._id}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell>{dept.code}</TableCell>
                          <TableCell>{dept.description || '-'}</TableCell>
                          <TableCell>{dept.hod || '-'}</TableCell>
                          <TableCell>{dept.isActive ? 'Active' : 'Inactive'}</TableCell>
                          <TableCell>{new Date(dept.createdAt).toLocaleDateString()}</TableCell>
                          {user?.profile?.role === 'super_admin' && (
                            <TableCell>
                              <Button size="sm" variant="outline" onClick={() => openEditFaculty(dept)}>Edit</Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Student Department Modal */}
      <Dialog open={showStudentModal} onOpenChange={setShowStudentModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editStudentDept ? 'Edit Student Department' : 'Add Student Department'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveStudentDept} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="student-name">Department Name *</label>
                <Input id="student-name" value={formStudent.name} onChange={e => setFormStudent(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label htmlFor="student-code">Department Code *</label>
                <Input id="student-code" value={formStudent.code} onChange={e => setFormStudent(f => ({ ...f, code: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label htmlFor="student-hod">Head of Department</label>
              <Input id="student-hod" value={formStudent.hod} onChange={e => setFormStudent(f => ({ ...f, hod: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="student-description">Description</label>
              <Input id="student-description" value={formStudent.description} onChange={e => setFormStudent(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowStudentModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : (editStudentDept ? 'Save Changes' : 'Add Department')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Faculty Department Modal */}
      <Dialog open={showFacultyModal} onOpenChange={setShowFacultyModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editFacultyDept ? 'Edit Faculty Department' : 'Add Faculty Department'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveFacultyDept} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="faculty-name">Department Name *</label>
                <Input id="faculty-name" value={formFaculty.name} onChange={e => setFormFaculty(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label htmlFor="faculty-code">Department Code</label>
                <Input id="faculty-code" value={formFaculty.code} onChange={e => setFormFaculty(f => ({ ...f, code: e.target.value }))} />
              </div>
            </div>
            <div>
              <label htmlFor="faculty-hod">Head of Department</label>
              <Input id="faculty-hod" value={formFaculty.hod} onChange={e => setFormFaculty(f => ({ ...f, hod: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="faculty-description">Description</label>
              <Input id="faculty-description" value={formFaculty.description} onChange={e => setFormFaculty(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowFacultyModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : (editFacultyDept ? 'Save Changes' : 'Add Department')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 