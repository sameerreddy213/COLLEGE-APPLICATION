import { useState, useEffect, createContext, useContext } from 'react';
import { apiClient } from '@/lib/api';

export interface FacultyDepartment {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  hod?: string;
  isActive: boolean;
  createdAt: string;
}

interface FacultyDepartmentsContextType {
  facultyDepartments: FacultyDepartment[];
  isLoading: boolean;
  refreshFacultyDepartments: () => Promise<void>;
  addFacultyDepartment: (department: Omit<FacultyDepartment, '_id' | 'createdAt'>) => Promise<void>;
  updateFacultyDepartment: (id: string, updates: Partial<FacultyDepartment>) => Promise<void>;
  deleteFacultyDepartment: (id: string) => Promise<void>;
}

const FacultyDepartmentsContext = createContext<FacultyDepartmentsContextType | undefined>(undefined);

export function FacultyDepartmentsProvider({ children }: { children: React.ReactNode }) {
  const [facultyDepartments, setFacultyDepartments] = useState<FacultyDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFacultyDepartments = async () => {
    setIsLoading(true);
    const response = await apiClient.getAllFacultyDepartments();
    const departmentsArr = (response?.data && Array.isArray((response.data as { departments?: unknown[] }).departments))
      ? (response.data as { departments: FacultyDepartment[] }).departments
      : [];
    setFacultyDepartments(departmentsArr);
    setIsLoading(false);
  };

  const refreshFacultyDepartments = fetchFacultyDepartments;

  const addFacultyDepartment = async (department: Omit<FacultyDepartment, '_id' | 'createdAt'>) => {
    setIsLoading(true);
    await apiClient.createFacultyDepartment(department);
    await fetchFacultyDepartments();
    setIsLoading(false);
  };

  const updateFacultyDepartment = async (id: string, updates: Partial<FacultyDepartment>) => {
    setIsLoading(true);
    await apiClient.updateFacultyDepartment(id, updates);
    await fetchFacultyDepartments();
    setIsLoading(false);
  };

  const deleteFacultyDepartment = async (id: string) => {
    setIsLoading(true);
    await apiClient.deleteFacultyDepartment(id);
    await fetchFacultyDepartments();
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFacultyDepartments();
  }, []);

  const value = {
    facultyDepartments,
    isLoading,
    refreshFacultyDepartments,
    addFacultyDepartment,
    updateFacultyDepartment,
    deleteFacultyDepartment
  };

  return (
    <FacultyDepartmentsContext.Provider value={value}>
      {children}
    </FacultyDepartmentsContext.Provider>
  );
}

export function useFacultyDepartments() {
  const context = useContext(FacultyDepartmentsContext);
  if (context === undefined) {
    throw new Error('useFacultyDepartments must be used within a FacultyDepartmentsProvider');
  }
  return context;
} 