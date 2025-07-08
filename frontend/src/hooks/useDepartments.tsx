import { useState, useEffect, createContext, useContext } from 'react';
import { apiClient } from '@/lib/api';

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  hod?: string;
  isActive: boolean;
  createdAt: string;
}

interface DepartmentsContextType {
  departments: Department[];
  departmentNames: string[];
  isLoading: boolean;
  refreshDepartments: () => Promise<void>;
  addDepartment: (department: Omit<Department, '_id' | 'createdAt'>) => Promise<void>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
}

const DepartmentsContext = createContext<DepartmentsContextType | undefined>(undefined);

export function DepartmentsProvider({ children }: { children: React.ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDepartments = async () => {
    setIsLoading(true);
    const response = await apiClient.getAllDepartments();
    const departmentsArr = (response?.data && Array.isArray((response.data as { departments?: unknown[] }).departments))
      ? (response.data as { departments: Department[] }).departments
      : [];
    setDepartments(departmentsArr);
    setIsLoading(false);
  };

  const refreshDepartments = fetchDepartments;

  const addDepartment = async (department: Omit<Department, '_id' | 'createdAt'>) => {
    setIsLoading(true);
    await apiClient.createDepartment(department);
    await fetchDepartments();
    setIsLoading(false);
  };

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    setIsLoading(true);
    await apiClient.updateDepartment(id, updates);
    await fetchDepartments();
    setIsLoading(false);
  };

  const deleteDepartment = async (id: string) => {
    setIsLoading(true);
    await apiClient.deleteDepartment(id);
    await fetchDepartments();
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const departmentNames = departments.map(dept => dept.name);

  const value = {
    departments,
    departmentNames,
    isLoading,
    refreshDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment
  };

  return (
    <DepartmentsContext.Provider value={value}>
      {children}
    </DepartmentsContext.Provider>
  );
}

export function useDepartments() {
  const context = useContext(DepartmentsContext);
  if (context === undefined) {
    throw new Error('useDepartments must be used within a DepartmentsProvider');
  }
  return context;
} 