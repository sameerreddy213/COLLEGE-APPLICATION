import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Trash2, Plus, Search, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Course {
  _id: string;
  name: string;
  code: string;
  description?: string;
  batch: {
    _id: string;
    name: string;
  };
  semester: number;
  credits: number;
  academicYear: string;
  isActive: boolean;
  createdAt: string;
}

interface Batch {
  _id: string;
  name: string;
}

export default function CourseManagementModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Form states
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    description: '',
    batch: 'placeholder',
    semester: 1,
    credits: 3,
    academicYear: new Date().getFullYear().toString()
  });

  // Edit states
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
      fetchBatches();
    }
  }, [isOpen, selectedBatch]);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const params: { isActive: boolean; batch?: string } = { isActive: true };
      if (selectedBatch && selectedBatch !== 'all') params.batch = selectedBatch;
      
      const res = await apiClient.getAllCourses(params);
      console.log('Courses API response:', res);
      
      // Handle different response structures
      let coursesData: Course[] = [];
      
      if (res.data) {
        if (Array.isArray(res.data)) {
          coursesData = res.data;
        } else if (typeof res.data === 'object' && 'data' in res.data) {
          const nestedData = (res.data as { data: Course[] }).data;
          if (Array.isArray(nestedData)) {
            coursesData = nestedData;
          }
        }
      }
      
      console.log('Extracted courses:', coursesData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({ title: 'Error', description: 'Failed to fetch courses', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await apiClient.getAllBatches();
      if (res.data && typeof res.data === 'object' && 'batches' in res.data && Array.isArray((res.data as { batches: Batch[] }).batches)) {
        setBatches((res.data as { batches: Batch[] }).batches);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch batches', variant: 'destructive' });
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseForm.name || !courseForm.code || !courseForm.batch || courseForm.batch === 'placeholder') {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    // Validate that batch is a valid MongoDB ObjectId
    if (!courseForm.batch.match(/^[0-9a-fA-F]{24}$/)) {
      toast({ title: 'Error', description: 'Please select a valid batch', variant: 'destructive' });
      return;
    }

    try {
      const courseData = {
        name: courseForm.name,
        code: courseForm.code,
        description: courseForm.description,
        batch: courseForm.batch,
        semester: courseForm.semester,
        credits: courseForm.credits,
        academicYear: courseForm.academicYear
      };

      const res = await apiClient.createCourse(courseData);
      console.log('Create course response:', res);
      if (res.error) {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Course created successfully' });
        setCourseForm({
          name: '',
          code: '',
          description: '',
          batch: 'placeholder',
          semester: 1,
          credits: 3,
          academicYear: new Date().getFullYear().toString()
        });
        setActiveTab('list');
        fetchCourses();
      }
    } catch (error) {
      console.error('Error creating course:', error);
      toast({ title: 'Error', description: 'Failed to create course', variant: 'destructive' });
    }
  };

  const handleEditCourse = (course: Course) => {
    console.log('Editing course:', course);
    setEditingCourse(course);
    setCourseForm({
      name: course.name,
      code: course.code,
      description: course.description || '',
      batch: course.batch._id,
      semester: course.semester,
      credits: course.credits,
      academicYear: course.academicYear
    });
    setIsEditing(true);
    setActiveTab('create'); // Switch to create tab to show the form
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCourse) return;

    try {
      const courseData = {
        name: courseForm.name,
        code: courseForm.code,
        description: courseForm.description,
        batch: courseForm.batch,
        semester: courseForm.semester,
        credits: courseForm.credits,
        academicYear: courseForm.academicYear
      };

      const res = await apiClient.updateCourse(editingCourse._id, courseData);
      console.log('Update course response:', res);
      if (res.error) {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Course updated successfully' });
        setIsEditing(false);
        setEditingCourse(null);
        // Reset form to empty values
        setCourseForm({
          name: '',
          code: '',
          description: '',
          batch: 'placeholder',
          semester: 1,
          credits: 3,
          academicYear: new Date().getFullYear().toString()
        });
        fetchCourses();
      }
    } catch (error) {
      console.error('Error updating course:', error);
      toast({ title: 'Error', description: 'Failed to update course', variant: 'destructive' });
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    try {
      const res = await apiClient.deleteCourse(id);
      if (res.error) {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Course deleted successfully' });
        fetchCourses();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete course', variant: 'destructive' });
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mb-2 justify-start">
          <BookOpen className="mr-2 h-4 w-4" />Manage Courses
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Course Management
          </DialogTitle>
          <DialogDescription>
            Create and manage courses for different student batches.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'list' | 'create')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="list"><BookOpen className="mr-2 h-4 w-4" />List</TabsTrigger>
            <TabsTrigger value="create"><Plus className="mr-2 h-4 w-4" />Create</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Courses</CardTitle>
                <CardDescription>Manage all courses for different batches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end mb-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Search Courses</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by course name or code..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="batch-filter">Filter by Batch</Label>
                    <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All batches" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All batches</SelectItem>
                        {batches.map(batch => (
                          <SelectItem key={batch._id} value={batch._id}>{batch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="text-center py-4">Loading courses...</div>
                ) : (
                  <Table>
                    <TableHeader>
                                              <TableRow>
                          <TableHead>Course Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead>Semester</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses.map(course => (
                        <TableRow key={course._id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">
                            <div>
                              <div>{course.name}</div>
                              {course.description && (
                                <div className="text-xs text-muted-foreground">{course.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{course.code}</Badge>
                          </TableCell>
                          <TableCell>{course.batch.name}</TableCell>
                          <TableCell>Sem {course.semester}</TableCell>
                          <TableCell>{course.credits}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="outline" onClick={() => handleEditCourse(course)}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Course</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteCourse(course._id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete Course</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="create">
            {isEditing && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">Editing Course</h3>
                    <p className="text-sm text-blue-700">Modify the course details below</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingCourse(null);
                      setCourseForm({
                        name: '',
                        code: '',
                        description: '',
                        batch: 'placeholder',
                        semester: 1,
                        credits: 3,
                        academicYear: new Date().getFullYear().toString()
                      });
                    }}
                  >
                    Cancel Edit
                  </Button>
                </div>
              </div>
            )}
            <form onSubmit={isEditing ? handleUpdateCourse : handleCreateCourse} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="course-name">Course Name *</Label>
                  <Input
                    id="course-name"
                    value={courseForm.name}
                    onChange={e => setCourseForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="e.g., Computer Science Engineering"
                  />
                </div>
                <div>
                  <Label htmlFor="course-code">Course Code *</Label>
                  <Input
                    id="course-code"
                    value={courseForm.code}
                    onChange={e => setCourseForm(prev => ({ ...prev, code: e.target.value }))}
                    required
                    placeholder="e.g., CSE"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="course-description">Description</Label>
                <Textarea
                  id="course-description"
                  value={courseForm.description}
                  onChange={e => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Course description..."
                />
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="batch">Batch *</Label>
                  <Select value={courseForm.batch} onValueChange={value => setCourseForm(prev => ({ ...prev, batch: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled>Select a batch</SelectItem>
                      {batches.map(batch => (
                        <SelectItem key={batch._id} value={batch._id}>{batch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="semester">Semester *</Label>
                  <Select value={courseForm.semester.toString()} onValueChange={value => setCourseForm(prev => ({ ...prev, semester: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="credits">Credits *</Label>
                  <Select value={courseForm.credits.toString()} onValueChange={value => setCourseForm(prev => ({ ...prev, credits: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(credit => (
                        <SelectItem key={credit} value={credit.toString()}>{credit} Credits</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="academic-year">Academic Year *</Label>
                  <Input
                    id="academic-year"
                    value={courseForm.academicYear}
                    onChange={e => setCourseForm(prev => ({ ...prev, academicYear: e.target.value }))}
                    required
                    placeholder="e.g., 2024"
                  />
                </div>
              </div>
              

              
              <div className="flex justify-end gap-2">
                {isEditing && (
                  <Button type="button" variant="outline" onClick={() => {
                    setIsEditing(false);
                    setEditingCourse(null);
                    setCourseForm({
                      name: '',
                      code: '',
                      description: '',
                      batch: 'placeholder',
                      semester: 1,
                      credits: 3,
                      academicYear: new Date().getFullYear().toString()
                    });
                  }}>
                    Cancel Edit
                  </Button>
                )}
                <Button type="submit">
                  {isEditing ? 'Update Course' : 'Create Course'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 