const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    profile: {
      id: string;
      name: string;
      role: string;
      email: string;
    };
  };
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    this.token = localStorage.getItem('auth_token');
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle rate limiting
      if (response.status === 429) {
        return {
          error: 'Too many requests. Please wait a moment and try again.',
        };
      }

      // Handle unauthorized (force logout and reload)
      if (response.status === 401) {
        this.setToken(null);
        return { error: 'Unauthorized. Please log in again.' };
      }

      // Try to parse as JSON, fallback to text for error responses
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          // If it's not JSON, use the text as error message
          if (!response.ok) {
            return {
              error: text || `HTTP ${response.status}: ${response.statusText}`,
            };
          }
          data = { message: text };
        }
      }

      if (!response.ok) {
        return {
          error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Authentication
  async register(userData: {
    email: string;
    password: string;
    name: string;
    role: string;
    phoneNumber?: string;
    department?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });
    
    this.setToken(null);
    return response;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Profiles
  async getProfile() {
    return this.request('/profiles/me');
  }

  async updateProfile(profileData: Record<string, unknown>) {
    return this.request('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getAllProfiles(params?: {
    page?: number;
    limit?: number;
    role?: string;
    department?: string;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request(`/profiles?${searchParams.toString()}`);
  }

  async getProfileById(id: string) {
    return this.request(`/profiles/${id}`);
  }

  async updateProfileById(id: string, profileData: Record<string, unknown>) {
    return this.request(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async deleteProfile(id: string) {
    return this.request(`/profiles/${id}`, {
      method: 'DELETE',
    });
  }

  // Users
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    isEmailVerified?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request(`/users?${searchParams.toString()}`);
  }

  async getUserById(id: string) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id: string, userData: Record<string, unknown>) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Attendance
  async getAttendance(params?: {
    page?: number;
    limit?: number;
    subject?: string;
    date?: string;
    studentId?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request(`/attendance?${searchParams.toString()}`);
  }

  async markAttendance(attendanceData: {
    studentId: string;
    subject: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    date?: string;
    remarks?: string;
  }) {
    return this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  async bulkMarkAttendance(data: {
    records: Array<{
      studentId: string;
      status: 'present' | 'absent' | 'late' | 'excused';
      remarks?: string;
    }>;
    date?: string;
    subject?: string;
  }) {
    return this.request('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAttendance(id: string, attendanceData: Record<string, unknown>) {
    return this.request(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attendanceData),
    });
  }

  async deleteAttendance(id: string) {
    return this.request(`/attendance/${id}`, {
      method: 'DELETE',
    });
  }

  async getAttendanceStats(params?: {
    subject?: string;
    startDate?: string;
    endDate?: string;
    studentId?: string;
  }) {
    if (params?.studentId) {
      // Use the student-specific summary endpoint
      return this.request(`/attendance/student/${params.studentId}/summary`);
    }
    
    // For admin stats, use the stats endpoint
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && key !== 'studentId') {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request(`/attendance/stats/overview?${searchParams.toString()}`);
  }

  // Complaints
  async getComplaints(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    priority?: string;
    submittedBy?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request(`/complaints?${searchParams.toString()}`);
  }

  async getComplaintById(id: string) {
    return this.request(`/complaints/${id}`);
  }

  async createComplaint(complaintData: {
    title: string;
    description: string;
    category: 'academic' | 'hostel' | 'mess' | 'infrastructure' | 'other';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) {
    return this.request('/complaints', {
      method: 'POST',
      body: JSON.stringify(complaintData),
    });
  }

  async updateComplaint(id: string, complaintData: Record<string, unknown>) {
    return this.request(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(complaintData),
    });
  }

  async addComment(id: string, comment: string) {
    return this.request(`/complaints/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async deleteComplaint(id: string) {
    return this.request(`/complaints/${id}`, {
      method: 'DELETE',
    });
  }

  async getComplaintStats() {
    return this.request('/complaints/stats/overview');
  }

  // Timetable
  async getTimetable(params?: {
    day?: string;
    department?: string;
    semester?: number;
    section?: string;
    teacher?: string;
    branch?: string;
    year?: number;
    academicYear?: string;
    autoCreate?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request(`/timetable?${searchParams.toString()}`);
  }

  async getTimetableById(id: string) {
    return this.request(`/timetable/${id}`);
  }

  async createTimetableEntry(timetableData: {
    subject: string;
    teacher: string;
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
    startTime: string;
    endTime: string;
    room: string;
    department: string;
    semester: number;
    section?: string;
  }) {
    return this.request('/timetable', {
      method: 'POST',
      body: JSON.stringify(timetableData),
    });
  }

  async updateTimetableEntry(id: string, timetableData: Record<string, unknown>) {
    return this.request(`/timetable/class/${id}`, {
      method: 'PUT',
      body: JSON.stringify(timetableData),
    });
  }

  async updateTimetable(id: string, timetableData: Record<string, unknown>) {
    return this.request(`/timetable/${id}`, {
      method: 'PUT',
      body: JSON.stringify(timetableData),
    });
  }

  async updateTimeSlot(id: string, timeSlotData: { startTime: string; endTime: string; oldStartTime: string; oldEndTime: string }) {
    return this.request(`/timetable/time-slot/${id}`, {
      method: 'PUT',
      body: JSON.stringify(timeSlotData),
    });
  }

  async deleteTimetableEntry(id: string) {
    return this.request(`/timetable/${id}`, {
      method: 'DELETE',
    });
  }

  async getDepartmentTimetable(department: string, semester: number, section?: string) {
    const searchParams = new URLSearchParams();
    if (section) {
      searchParams.append('section', section);
    }
    
    return this.request(`/timetable/department/${department}/semester/${semester}?${searchParams.toString()}`);
  }

  async getTeacherTimetable(teacherId: string) {
    return this.request(`/timetable/teacher/${teacherId}`);
  }

  async getMySchedule(academicYear?: string) {
    const searchParams = new URLSearchParams();
    if (academicYear) {
      searchParams.append('academicYear', academicYear);
    }
    return this.request(`/timetable/my-schedule?${searchParams.toString()}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Mess Menu
  async getTodayMenu() {
    return this.request('/mess-menu/today');
  }

  async createMenu(menuData: Record<string, unknown>) {
    return this.request('/mess-menu', {
      method: 'POST',
      body: JSON.stringify(menuData),
    });
  }

  async updateMenu(id: string, menuData: Record<string, unknown>) {
    return this.request(`/mess-menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(menuData),
    });
  }

  async deleteMenu(id: string) {
    if (!id || id.trim() === '') {
      return { error: 'Invalid menu ID' };
    }
    return this.request(`/mess-menu/${id}`, {
      method: 'DELETE',
    });
  }

  async getMenuById(id: string) {
    return this.request(`/mess-menu/${id}`);
  }

  async getAllMenus(params?: {
    page?: number;
    limit?: number;
    date?: string;
    isActive?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request(`/mess-menu?${searchParams.toString()}`);
  }

  async clearAllMenus() {
    return this.request('/mess-menu/clear/all', {
      method: 'DELETE',
    });
  }

  // Departments
  async getAllDepartments() {
    return this.request('/departments');
  }

  async createDepartment(dept: {
    name: string;
    code: string;
    description?: string;
    hod?: string;
    isActive?: boolean;
  }) {
    return this.request('/departments', {
      method: 'POST',
      body: JSON.stringify(dept),
    });
  }

  async updateDepartment(id: string, dept: {
    name?: string;
    code?: string;
    description?: string;
    hod?: string;
    isActive?: boolean;
  }) {
    return this.request(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dept),
    });
  }

  async deleteDepartment(id: string) {
    return this.request(`/departments/${id}`, {
      method: 'DELETE',
    });
  }

  async getDepartmentById(id: string) {
    return this.request(`/departments/${id}`);
  }

  // Faculty Departments
  async getAllFacultyDepartments() {
    return this.request('/faculty-departments');
  }

  async createFacultyDepartment(dept: {
    name: string;
    code?: string;
    description?: string;
    isActive?: boolean;
  }) {
    return this.request('/faculty-departments', {
      method: 'POST',
      body: JSON.stringify(dept),
    });
  }

  async updateFacultyDepartment(id: string, dept: {
    name?: string;
    code?: string;
    description?: string;
    isActive?: boolean;
  }) {
    return this.request(`/faculty-departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dept),
    });
  }

  async deleteFacultyDepartment(id: string) {
    return this.request(`/faculty-departments/${id}`, {
      method: 'DELETE',
    });
  }

  async getFacultyDepartmentById(id: string) {
    return this.request(`/faculty-departments/${id}`);
  }

  async assignFacultyDepartmentHOD(departmentId: string, hodUserId: string) {
    return this.request(`/facultyDepartments/${departmentId}/hod`, {
      method: 'PUT',
      body: JSON.stringify({ hod: hodUserId }),
    });
  }

  async getAllBatches() {
    return this.request('/student-batches');
  }

  async createBatch(data: { name: string }) {
    return this.request('/student-batches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBatch(id: string, data: { name: string }) {
    return this.request(`/student-batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBatch(id: string) {
    return this.request(`/student-batches/${id}`, {
      method: 'DELETE',
    });
  }

  // Holiday Management
  async getUpcomingHolidays(params?: { days?: number; userType?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    return this.request(`/holidays/upcoming?${searchParams.toString()}`);
  }

  async createHoliday(holiday: Record<string, unknown>) {
    return this.request('/holidays', {
      method: 'POST',
      body: JSON.stringify(holiday),
    });
  }

  async updateHoliday(id: string, holiday: Record<string, unknown>) {
    return this.request(`/holidays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(holiday),
    });
  }

  async deleteHoliday(id: string) {
    return this.request(`/holidays/${id}`, {
      method: 'DELETE',
    });
  }

  // Timetable (full payload for academic staff)
  async createFullTimetableEntry(timetableData: {
    branch: string;
    section: string;
    year: number;
    semester: number;
    academicYear: string;
    classes: Array<{
      day: string;
      startTime: string;
      endTime: string;
      subject: string;
      facultyId: string;
      location: string;
    }>;
  }) {
    return this.request('/timetable', {
      method: 'POST',
      body: JSON.stringify(timetableData),
    });
  }

  async createEmptyTimetable(timetableData: {
    branch: string;
    section: string;
    year: number;
    semester: number;
    academicYear: string;
  }) {
    return this.request('/timetable/empty', {
      method: 'POST',
      body: JSON.stringify(timetableData),
    });
  }

  async getAllHolidays(params?: { startDate?: string; endDate?: string }) {
    if (params && params.startDate && params.endDate) {
      const searchParams = new URLSearchParams();
      searchParams.append('startDate', params.startDate);
      searchParams.append('endDate', params.endDate);
      return this.request(`/holidays?${searchParams.toString()}`);
    }
    return this.request('/holidays');
  }

  async getSectionsByBatch(batchId: string) {
    return this.request(`/student-batch-sections/batch/${batchId}`);
  }

  async createSection(data: { name: string; batch: string }) {
    return this.request('/student-batch-sections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSection(id: string, data: { name: string }) {
    return this.request(`/student-batch-sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSection(id: string) {
    return this.request(`/student-batch-sections/${id}`, {
      method: 'DELETE',
    });
  }

  // Subject Assignments
  async getAllSubjectAssignments(params?: {
    subject?: string;
    facultyId?: string;
    department?: string;
    academicYear?: string;
    isActive?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    return this.request(`/subject-assignments?${searchParams.toString()}`);
  }

  async getFacultyBySubject(subject: string, academicYear?: string) {
    const searchParams = new URLSearchParams();
    if (academicYear) {
      searchParams.append('academicYear', academicYear);
    }
    return this.request(`/subject-assignments/subject/${encodeURIComponent(subject)}?${searchParams.toString()}`);
  }

  async createSubjectAssignment(data: {
    subject: string;
    facultyId: string;
    department?: string;
    academicYear: string;
  }) {
    return this.request('/subject-assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubjectAssignment(id: string, data: {
    subject?: string;
    facultyId?: string;
    department?: string;
    academicYear?: string;
    isActive?: boolean;
  }) {
    return this.request(`/subject-assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSubjectAssignment(id: string) {
    return this.request(`/subject-assignments/${id}`, {
      method: 'DELETE',
    });
  }

  // Courses
  async getAllCourses(params?: {
    batch?: string;
    semester?: number;
    academicYear?: string;
    isActive?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    return this.request(`/courses?${searchParams.toString()}`);
  }

  async getCoursesByBatch(batchId: string, academicYear?: string) {
    const searchParams = new URLSearchParams();
    if (academicYear) {
      searchParams.append('academicYear', academicYear);
    }
    return this.request(`/courses/batch/${batchId}?${searchParams.toString()}`);
  }

  async getCourseById(id: string) {
    return this.request(`/courses/${id}`);
  }

  async createCourse(data: {
    name: string;
    code: string;
    description?: string;
    batch: string;
    semester: number;
    credits: number;
    academicYear: string;
  }) {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourse(id: string, data: {
    name?: string;
    code?: string;
    description?: string;
    batch?: string;
    semester?: number;
    credits?: number;
    academicYear?: string;
    isActive?: boolean;
  }) {
    return this.request(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCourse(id: string) {
    return this.request(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  // Time slot management
  async getTimeSlots(timetableId: string) {
    return this.request(`/timetable/${timetableId}/time-slots`);
  }

  async updateTimeSlots(timetableId: string, timeSlots: Array<{ id: string; startTime: string; endTime: string }>) {
    return this.request(`/timetable/${timetableId}/time-slots`, {
      method: 'PUT',
      body: JSON.stringify({ timeSlots }),
    });
  }

  async addTimeSlot(timetableId: string, data: { startTime: string; endTime: string }) {
    return this.request(`/timetable/${timetableId}/time-slots`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteTimeSlot(timetableId: string, slotId: string) {
    return this.request(`/timetable/${timetableId}/time-slots/${slotId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient; 