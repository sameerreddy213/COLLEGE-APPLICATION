import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Plus, Edit, Trash2, Search, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDepartments } from '@/hooks/useDepartments';
import { apiClient } from '@/lib/api';
import { useFacultyDepartments } from '@/hooks/useFacultyDepartments';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  hod?: string;
  isActive: boolean;
  createdAt: string;
}

interface NewDepartmentData {
  name: string;
  code: string;
  description: string;
  hod: string;
}

// Define Profile type locally for type safety
interface Profile {
  _id: string;
  name: string;
  role: string;
  email: string;
  department?: string;
  phoneNumber?: string;
  isActive: boolean;
  userId: {
    _id: string;
    email: string;
    isEmailVerified: boolean;
    lastLogin?: string;
  };
}

const defaultDepartments = [
  'Computer Science Engineering',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Data Science',
  'Artificial Intelligence',
];

export default function DepartmentManagementModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('student');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isEditingDepartment, setIsEditingDepartment] = useState(false);
  const [editDepartmentData, setEditDepartmentData] = useState<Partial<Department>>({});
  const { toast } = useToast();
  const { departments, isLoading, addDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const { facultyDepartments, isLoading: isFacultyLoading, addFacultyDepartment, updateFacultyDepartment, deleteFacultyDepartment } = useFacultyDepartments();
  const [activeFacultyTab, setActiveFacultyTab] = useState<'list' | 'create'>('list');
  const [newFacultyDepartment, setNewFacultyDepartment] = useState({ name: '', code: '', description: '', hod: '' });
  const [selectedFacultyDepartment, setSelectedFacultyDepartment] = useState(null);
  const [isEditingFacultyDepartment, setIsEditingFacultyDepartment] = useState(false);
  const [editFacultyDepartmentData, setEditFacultyDepartmentData] = useState({ name: '', code: '', description: '', hod: '' });
  const [isCreatingFacultyDepartment, setIsCreatingFacultyDepartment] = useState(false);
  const [facultyUsers, setFacultyUsers] = useState<Pick<Profile, '_id' | 'name' | 'email'>[]>([]);

  // New department form state
  const [newDepartment, setNewDepartment] = useState<NewDepartmentData>({
    name: '',
    code: '',
    description: '',
    hod: '',
  });

  const [activeStudentTab, setActiveStudentTab] = useState<'list' | 'create'>('list');
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);

  useEffect(() => {
    // Fetch all faculty users for HOD dropdown
    apiClient.getAllProfiles({ role: 'faculty', limit: 1000 }).then(res => {
      if (res.data && Array.isArray((res.data as { profiles?: Profile[] }).profiles)) {
        setFacultyUsers(
          ((res.data as { profiles: Profile[] }).profiles).map(u => ({ _id: u._id, name: u.name, email: u.email }))
        );
      }
    });
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDepartment.name || !newDepartment.code) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      addDepartment({
        name: newDepartment.name,
        code: newDepartment.code.toUpperCase(),
        description: newDepartment.description,
        hod: newDepartment.hod,
        isActive: true
      });
      
      toast({
        title: 'Success',
        description: 'Department created successfully',
      });
      
      // Reset form
      setNewDepartment({
        name: '',
        code: '',
        description: '',
        hod: '',
      });
      
      setActiveTab('student');
    } catch (error) {
      console.error('Error creating department:', error);
      toast({
        title: 'Error',
        description: 'Failed to create department',
        variant: 'destructive',
      });
    }
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setEditDepartmentData({
      name: department.name,
      code: department.code,
      description: department.description || '',
      hod: department.hod || '',
    });
    setIsEditingDepartment(true);
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) return;

    try {
      updateDepartment(selectedDepartment._id, editDepartmentData);
      
      toast({
        title: "Success",
        description: "Department updated successfully",
      });
      
      setIsEditingDepartment(false);
      setSelectedDepartment(null);
      setEditDepartmentData({});
    } catch (error) {
      console.error('Error updating department:', error);
      toast({
        title: "Error",
        description: "Failed to update department. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      deleteDepartment(departmentId);
      
      toast({
        title: 'Success',
        description: 'Department deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete department',
        variant: 'destructive',
      });
    }
  };

  const filteredDepartments = departments.filter(department => 
    department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full justify-start" variant="outline">
          <Building className="mr-2 h-4 w-4" />
          Manage Departments
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Department Management
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">Student Departments</TabsTrigger>
            <TabsTrigger value="faculty">Faculty Departments</TabsTrigger>
          </TabsList>

          <TabsContent value="student" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Departments</CardTitle>
                <CardDescription>Manage all student academic departments and their details</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeStudentTab} onValueChange={v => setActiveStudentTab(v as 'list' | 'create')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="list">List</TabsTrigger>
                    <TabsTrigger value="create">Create</TabsTrigger>
                  </TabsList>
                  <TabsContent value="list">
                    <div className="flex gap-4 items-end mb-4">
                      <div className="flex-1">
                        <Label htmlFor="search">Search Student Departments</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="search"
                            placeholder="Search by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>HOD</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDepartments.map((department) => (
                          <TableRow key={department._id}>
                            <TableCell className="font-medium">{department.name}</TableCell>
                            <TableCell><Badge variant="outline">{department.code}</Badge></TableCell>
                            <TableCell>{department.hod || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={department.isActive ? 'default' : 'secondary'}>
                                {department.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditDepartment(department)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteDepartment(department._id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  <TabsContent value="create">
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setIsCreatingDepartment(true);
                      try {
                        const response = await addDepartment({
                          name: newDepartment.name,
                          code: newDepartment.code.toUpperCase(),
                          description: newDepartment.description,
                          hod: newDepartment.hod,
                          isActive: true
                        });
                        setNewDepartment({ name: '', code: '', description: '', hod: '' });
                        toast({ title: 'Success', description: 'Student department created successfully.' });
                        setActiveStudentTab('list');
                      } catch (error: unknown) {
                        let errorMsg = 'Failed to create student department';
                        if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
                          errorMsg = (error.response.data as { error?: string }).error || errorMsg;
                        } else if (error instanceof Error) {
                          errorMsg = error.message;
                        }
                        toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
                      } finally {
                        setIsCreatingDepartment(false);
                      }
                    }} className="space-y-4 mt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Department Name *</Label>
                          <Input
                            id="name"
                            value={newDepartment.name}
                            onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                            required
                            placeholder="e.g., Computer Science Engineering"
                          />
                        </div>
                        <div>
                          <Label htmlFor="code">Department Code *</Label>
                          <Input
                            id="code"
                            value={newDepartment.code}
                            onChange={(e) => setNewDepartment({ ...newDepartment, code: e.target.value })}
                            required
                            placeholder="e.g., CSE"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={newDepartment.description}
                          onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                          placeholder="Brief description of the department"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hod">Head of Department</Label>
                        <Input
                          id="hod"
                          value={newDepartment.hod}
                          onChange={(e) => setNewDepartment({ ...newDepartment, hod: e.target.value })}
                          placeholder="Name of the HOD"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="submit" disabled={isLoading || isCreatingDepartment}>
                          {isLoading || isCreatingDepartment ? 'Creating...' : 'Create Student Department'}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            <Dialog open={isEditingDepartment} onOpenChange={setIsEditingDepartment}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Edit Student Department
                  </DialogTitle>
                </DialogHeader>
                {selectedDepartment && (
                  <form onSubmit={handleUpdateDepartment} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-name">Department Name *</Label>
                        <Input
                          id="edit-name"
                          value={editDepartmentData.name || ''}
                          onChange={(e) => setEditDepartmentData({ ...editDepartmentData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-code">Department Code *</Label>
                        <Input
                          id="edit-code"
                          value={editDepartmentData.code || ''}
                          onChange={(e) => setEditDepartmentData({ ...editDepartmentData, code: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-description">Description</Label>
                      <Input
                        id="edit-description"
                        value={editDepartmentData.description || ''}
                        onChange={(e) => setEditDepartmentData({ ...editDepartmentData, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-hod">Head of Department</Label>
                      <Input
                        id="edit-hod"
                        value={editDepartmentData.hod || ''}
                        onChange={(e) => setEditDepartmentData({ ...editDepartmentData, hod: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditingDepartment(false)}>Cancel</Button>
                      <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="faculty" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Faculty Departments</CardTitle>
                <CardDescription>Manage all faculty departments and their details</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeFacultyTab} onValueChange={v => setActiveFacultyTab(v as 'list' | 'create')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="list">List</TabsTrigger>
                    <TabsTrigger value="create">Create</TabsTrigger>
                  </TabsList>
                  <TabsContent value="list">
                    {isFacultyLoading ? (
                      <div className="text-center py-8">Loading faculty departments...</div>
                    ) : facultyDepartments.length === 0 ? (
                      <div className="text-center py-8">
                        <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground mb-2">No faculty departments found</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>HOD</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {facultyDepartments.map((dept) => (
                            <TableRow key={dept._id}>
                              <TableCell>{dept.name}</TableCell>
                              <TableCell>{dept.code}</TableCell>
                              <TableCell>{dept.hod || '-'}</TableCell>
                              <TableCell>{dept.description || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={dept.isActive ? 'default' : 'secondary'}>
                                  {dept.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => { setSelectedFacultyDepartment(dept); setEditFacultyDepartmentData({ name: dept.name, code: dept.code || '', description: dept.description || '', hod: dept.hod || '' }); setIsEditingFacultyDepartment(true); }}>
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => deleteFacultyDepartment(dept._id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                  <TabsContent value="create">
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setIsCreatingFacultyDepartment(true);
                      try {
                        await addFacultyDepartment({ ...newFacultyDepartment, isActive: true });
                        setNewFacultyDepartment({ name: '', code: '', description: '', hod: '' });
                        toast({ title: 'Success', description: 'Faculty department created successfully.' });
                        setActiveFacultyTab('list');
                      } catch (error) {
                        toast({ title: 'Error', description: 'Failed to create faculty department', variant: 'destructive' });
                      } finally {
                        setIsCreatingFacultyDepartment(false);
                      }
                    }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="faculty-name">Department Name *</Label>
                          <Input id="faculty-name" value={newFacultyDepartment.name} onChange={e => setNewFacultyDepartment({ ...newFacultyDepartment, name: e.target.value })} required />
                        </div>
                        <div>
                          <Label htmlFor="faculty-code">Department Code</Label>
                          <Input id="faculty-code" value={newFacultyDepartment.code} onChange={e => setNewFacultyDepartment({ ...newFacultyDepartment, code: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="faculty-hod">Head of Department</Label>
                        <Select
                          value={newFacultyDepartment.hod}
                          onValueChange={val => setNewFacultyDepartment({ ...newFacultyDepartment, hod: val })}
                        >
                          <SelectTrigger id="faculty-hod">
                            <SelectValue placeholder="Select HOD (faculty)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {facultyUsers.map(user => (
                              <SelectItem key={user._id} value={user._id}>{user.name} ({user.email})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="faculty-description">Description</Label>
                        <Input id="faculty-description" value={newFacultyDepartment.description} onChange={e => setNewFacultyDepartment({ ...newFacultyDepartment, description: e.target.value })} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setActiveFacultyTab('list')}>Cancel</Button>
                        <Button type="submit" disabled={isFacultyLoading || isCreatingFacultyDepartment}>
                          {isFacultyLoading || isCreatingFacultyDepartment ? 'Creating...' : 'Create Faculty Department'}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            <Dialog open={isEditingFacultyDepartment} onOpenChange={setIsEditingFacultyDepartment}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Edit Faculty Department
                  </DialogTitle>
                </DialogHeader>
                {selectedFacultyDepartment && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    await updateFacultyDepartment(selectedFacultyDepartment._id, editFacultyDepartmentData);
                    // If HOD changed, call assignFacultyDepartmentHOD
                    await apiClient.assignFacultyDepartmentHOD(selectedFacultyDepartment._id, editFacultyDepartmentData.hod === 'none' ? '' : editFacultyDepartmentData.hod);
                    setIsEditingFacultyDepartment(false);
                    setSelectedFacultyDepartment(null);
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-faculty-name">Department Name *</Label>
                        <Input id="edit-faculty-name" value={editFacultyDepartmentData.name} onChange={e => setEditFacultyDepartmentData({ ...editFacultyDepartmentData, name: e.target.value })} required />
                      </div>
                      <div>
                        <Label htmlFor="edit-faculty-code">Department Code</Label>
                        <Input id="edit-faculty-code" value={editFacultyDepartmentData.code} onChange={e => setEditFacultyDepartmentData({ ...editFacultyDepartmentData, code: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-faculty-hod">Head of Department</Label>
                      <Select
                        value={editFacultyDepartmentData.hod}
                        onValueChange={val => setEditFacultyDepartmentData({ ...editFacultyDepartmentData, hod: val })}
                      >
                        <SelectTrigger id="edit-faculty-hod">
                          <SelectValue placeholder="Select HOD (faculty)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {facultyUsers.map(user => (
                            <SelectItem key={user._id} value={user._id}>{user.name} ({user.email})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-faculty-description">Description</Label>
                      <Input id="edit-faculty-description" value={editFacultyDepartmentData.description} onChange={e => setEditFacultyDepartmentData({ ...editFacultyDepartmentData, description: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditingFacultyDepartment(false)}>Cancel</Button>
                      <Button type="submit" disabled={isFacultyLoading}>{isFacultyLoading ? 'Saving...' : 'Save Changes'}</Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 