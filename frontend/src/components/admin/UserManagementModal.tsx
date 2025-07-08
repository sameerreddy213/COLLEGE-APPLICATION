import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useDepartments } from '@/hooks/useDepartments';
import { useFacultyDepartments } from '@/hooks/useFacultyDepartments';
import { apiClient } from '@/lib/api';
import { UserPlus, Users, Search, Edit, Trash2, Eye, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuthMongo';
import DepartmentManagementModal from './DepartmentManagementModal';
import { useStudentBatches, useBatchSections } from '@/hooks/useStudentBatches';

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
  batch?: string;
  batchName?: string;
  section?: string;
}

interface User {
  _id: string;
  email: string;
  isEmailVerified: boolean;
  lastLogin?: string;
  profile: {
    _id: string;
    name: string;
    role: string;
    email: string;
    department?: string;
    phoneNumber?: string;
    isActive: boolean;
  };
}

interface NewUserData {
  name: string;
  email: string;
  password: string;
  role: string;
  department?: string;
  phoneNumber?: string;
  batch?: string;
  section?: string;
}

const roleOptions = [
  { value: 'student', label: 'Student' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'academic_staff', label: 'Academic Section' },
  { value: 'hod', label: 'Head of Department' },
  { value: 'director', label: 'Director' },
  { value: 'hostel_warden', label: 'Hostel Warden' },
  { value: 'mess_supervisor', label: 'Mess Supervisor' },
];

export default function UserManagementModal() {
  const { toast } = useToast();
  const { departmentNames } = useDepartments();
  const { facultyDepartments } = useFacultyDepartments();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isViewingUser, setIsViewingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserData, setEditUserData] = useState<Partial<Profile>>({});
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  // New user form state
  const [newUser, setNewUser] = useState<NewUserData>({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    phoneNumber: '',
  });

  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const { batches } = useStudentBatches();
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const { sections: batchSections } = useBatchSections(selectedBatchId);
  const [editSelectedBatchId, setEditSelectedBatchId] = useState<string>('');
  const { sections: editBatchSections } = useBatchSections(editSelectedBatchId);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    // Rate limiting: prevent requests more frequent than 2 seconds
    const now = Date.now();
    if (now - lastFetchTime < 2000) {
      toast({
        title: 'Please wait',
        description: 'Please wait a moment before making another request',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      setLastFetchTime(now);
      
      const response = await apiClient.getAllProfiles({ limit: 1000 });
      
      if (response.error) {
        toast({
          title: 'Error',
          description: response.error,
          variant: 'destructive',
        });
        return;
      }
      
      if (response.data) {
        // The profiles API returns { profiles: [...], totalPages, currentPage, total }
        const data = response.data as { profiles?: Profile[] };
        
        if (data.profiles && Array.isArray(data.profiles)) {
          // Map batch to _id if populated
          setProfiles(data.profiles.map(profile => {
            let batchId = '';
            let batchName = '';
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (profile.batch != null) {
              if (typeof profile.batch === 'object' && '_id' in profile.batch) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                batchId = (profile.batch as any)._id;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                batchName = (profile.batch as any).name;
              } else if (typeof profile.batch === 'string') {
                batchId = profile.batch;
              }
            }
            return {
              ...profile,
              batch: batchId,
              batchName: batchName
            };
          }));
        } else {
          setProfiles([]);
        }
      } else {
        setProfiles([]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const userPayload = {
        ...newUser,
        ...(newUser.role === 'student' && { batch: newUser.batch || undefined }),
      };
      const response = await apiClient.register(userPayload);

      if (response.error) {
        toast({
          title: 'Error',
          description: response.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'User created successfully',
        });
        
        // Reset form
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'student',
          department: '',
          phoneNumber: '',
        });
        
        // Refresh user list
        await fetchUsers();
        setActiveTab('list');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.deleteProfile(profileId);
      
      if (response.error) {
        toast({
          title: 'Error',
          description: response.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'User deleted successfully',
        });
        await fetchUsers();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUser = (profile: Profile) => {
    setSelectedUser(profile);
    setIsViewingUser(true);
  };

  const handleEditUser = (profile: Profile) => {
    setSelectedUser(profile);
    setEditUserData({
      name: profile.name,
      role: profile.role,
      department: profile.department || '',
      phoneNumber: profile.phoneNumber || '',
      isActive: profile.isActive,
      batch: profile.batch || '',
      section: profile.section || '',
    });
    if (profile.role === 'student' && profile.batch) {
      const batchObj = batches.find(b => b.name === profile.batch);
      setEditSelectedBatchId(batchObj?._id || '');
    } else {
      setEditSelectedBatchId('');
    }
    setIsEditingUser(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      const response = await apiClient.updateProfileById(selectedUser._id, editUserData);
      
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "User updated successfully",
        });
        
        // Update the local state
        setProfiles(profiles.map(profile => 
          profile._id === selectedUser._id 
            ? { ...profile, ...editUserData }
            : profile
        ));
        
        setIsEditingUser(false);
        setSelectedUser(null);
        setEditUserData({});
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.userId.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || profile.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'faculty':
        return 'default';
      case 'student':
        return 'secondary';
      case 'academic_staff':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full justify-start">
            <UserPlus className="mr-2 h-4 w-4" />
            Add New User
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">User List</TabsTrigger>
              <TabsTrigger value="create">Create User</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="search">Search Users</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Label htmlFor="role-filter">Filter by Role</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Users ({filteredProfiles.length})
                  </CardTitle>
                  <CardDescription>
                    Manage all system users and their permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">Loading users...</div>
                  ) : filteredProfiles.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground mb-2">
                        {profiles.length === 0 ? 'No users found in the system' : 'No users match your search criteria'}
                      </p>
                      {profiles.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Create your first user using the "Create User" tab
                        </p>
                      )}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProfiles.map((profile) => (
                          <TableRow key={profile._id}>
                            <TableCell className="font-medium">
                              {profile.name}
                            </TableCell>
                            <TableCell>{profile.userId.email}</TableCell>
                            <TableCell>
                              <Badge variant={getRoleBadgeVariant(profile.role)}>
                                {roleOptions.find(r => r.value === profile.role)?.label || profile.role}
                              </Badge>
                            </TableCell>
                            <TableCell>{profile.department || '-'}</TableCell>
                            <TableCell>
                              <span className="flex flex-col gap-1">
                                <Badge variant={profile.userId.isEmailVerified ? 'default' : 'secondary'}>
                                  {profile.userId.isEmailVerified ? 'Verified' : 'Unverified'}
                                </Badge>
                                <Badge variant={profile.isActive ? 'default' : 'destructive'}>
                                  {profile.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleViewUser(profile)}>
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleEditUser(profile)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(profile._id)}
                                  disabled={profile.role === 'super_admin'}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create New User</CardTitle>
                  <CardDescription>
                    Add a new user to the system with appropriate role and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role *</Label>
                        <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {newUser.role === 'student' && (
                        <>
                          <div>
                            <Label htmlFor="department">Department</Label>
                            <Select value={newUser.department} onValueChange={(value) => setNewUser({ ...newUser, department: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                {departmentNames.map((dept) => (
                                  <SelectItem key={dept} value={dept}>
                                    {dept}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="batch">Batch</Label>
                            <Select
                              value={newUser.batch || ''}
                              onValueChange={value => {
                                setNewUser({ ...newUser, batch: value, section: '' });
                                setSelectedBatchId(value);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select batch" />
                              </SelectTrigger>
                              <SelectContent>
                                {batches.map(batch => (
                                  <SelectItem key={batch._id} value={batch._id}>
                                    {batch.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {selectedBatchId && (
                            <div>
                              <Label htmlFor="section">Section</Label>
                              <Select
                                value={newUser.section || ''}
                                onValueChange={value => setNewUser({ ...newUser, section: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select section" />
                                </SelectTrigger>
                                <SelectContent>
                                  {batchSections.map(section => (
                                    <SelectItem key={section._id} value={section.name}>
                                      {section.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </>
                      )}
                      {newUser.role === 'faculty' && (
                        <div>
                          <Label htmlFor="faculty-department">Faculty Department</Label>
                          <Select value={newUser.department} onValueChange={(value) => setNewUser({ ...newUser, department: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select faculty department" />
                            </SelectTrigger>
                            <SelectContent>
                              {facultyDepartments.map((dept) => (
                                <SelectItem key={dept._id} value={dept.name}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={newUser.phoneNumber}
                          onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setActiveTab('list')}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create User'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* View User Modal */}
      <Dialog open={isViewingUser} onOpenChange={setIsViewingUser}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              User Details
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                  <p className="text-lg font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-lg">{selectedUser.userId.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                  <Badge variant={getRoleBadgeVariant(selectedUser.role)} className="mt-1">
                    {roleOptions.find(r => r.value === selectedUser.role)?.label || selectedUser.role}
                  </Badge>
                </div>
                {selectedUser.role === 'student' && (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                      <p className="text-lg">{selectedUser.department || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Batch</Label>
                      <p className="text-lg">{batches.find(b => b._id === selectedUser.batch)?.name || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Section</Label>
                      <p className="text-lg">{selectedUser.section || 'Not specified'}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                  <p className="text-lg">{selectedUser.phoneNumber || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Login</Label>
                  <p className="text-lg">{selectedUser.userId.lastLogin ? new Date(selectedUser.userId.lastLogin).toLocaleString() : 'Never'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <div className="flex gap-2">
                  <Badge variant={selectedUser.userId.isEmailVerified ? 'default' : 'secondary'}>
                    {selectedUser.userId.isEmailVerified ? 'Email Verified' : 'Email Unverified'}
                  </Badge>
                  <Badge variant={selectedUser.isActive ? 'default' : 'destructive'}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsViewingUser(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditingUser} onOpenChange={setIsEditingUser}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit User
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input
                    id="edit-name"
                    value={editUserData.name || ''}
                    onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role">Role *</Label>
                  <Select 
                    value={editUserData.role || ''} 
                    onValueChange={(value) => setEditUserData({ ...editUserData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {editUserData.role === 'student' && (
                  <>
                    <div>
                      <Label htmlFor="edit-department">Department</Label>
                      <Select
                        value={editUserData.department || ''}
                        onValueChange={value => setEditUserData({ ...editUserData, department: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departmentNames.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-batch">Batch</Label>
                      <Select
                        value={editUserData.batch || ''}
                        onValueChange={value => {
                          setEditUserData({ ...editUserData, batch: value, section: '' });
                          setEditSelectedBatchId(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select batch" />
                        </SelectTrigger>
                        <SelectContent>
                          {batches.map(batch => (
                            <SelectItem key={batch._id} value={batch._id}>
                              {batch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {editSelectedBatchId && (
                      <div>
                        <Label htmlFor="edit-section">Section</Label>
                        <Select
                          value={editUserData.section || ''}
                          onValueChange={value => setEditUserData({ ...editUserData, section: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                          <SelectContent>
                            {editBatchSections.map(section => (
                              <SelectItem key={section._id} value={section.name}>
                                {section.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}
                {editUserData.role === 'faculty' && (
                  <div>
                    <Label htmlFor="edit-faculty-department">Faculty Department</Label>
                    <Select
                      value={editUserData.department || ''}
                      onValueChange={value => setEditUserData({ ...editUserData, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select faculty department" />
                      </SelectTrigger>
                      <SelectContent>
                        {facultyDepartments.map((dept) => (
                          <SelectItem key={dept._id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    value={editUserData.phoneNumber || ''}
                    onChange={(e) => setEditUserData({ ...editUserData, phoneNumber: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={editUserData.isActive?.toString() || 'true'} 
                  onValueChange={(value) => setEditUserData({ ...editUserData, isActive: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditingUser(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {showDepartmentModal && (
        <DepartmentManagementModal />
      )}
    </>
  );
} 