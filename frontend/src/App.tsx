import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuthMongo";
import { DepartmentsProvider } from "@/hooks/useDepartments";
import AuthPage from "@/components/auth/AuthPage";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Dashboard from "@/components/dashboard/Dashboard";
import Attendance from "@/pages/Attendance";
import Complaints from "@/pages/Complaints";
import MessMenu from "@/pages/MessMenu";
import Activities from "@/pages/Activities";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Students from "@/pages/Students";
import Faculty from "@/pages/Faculty";
import Departments from "@/pages/Departments";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import { FacultyDepartmentsProvider } from './hooks/useFacultyDepartments';
import AcademicHolidayManagement from '@/pages/AcademicHolidayManagement';
import StudentDashboard from "@/components/students/StudentDashboard";
import FacultyDashboard from "@/components/faculty/FacultyDashboard";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AcademicStaffDashboard from "@/components/dashboard/AcademicStaffDashboard";
import HostelWardenDashboard from "@/components/hostel/HostelWardenDashboard";
import MessSupervisorDashboard from "@/components/mess/MessSupervisorDashboard";
import HODDashboard from "@/components/faculty/HODDashboard";
const queryClient = new QueryClient();

// Utility to map user role to dashboard route
export function getDashboardRouteForRole(role?: string) {
  switch (role) {
    case "student":
      return "/student-dashboard";
    case "faculty":
      return "/faculty-dashboard";
    case "super_admin":
      return "/admin-dashboard";
    case "academic_staff":
      return "/academic-staff-dashboard";
    case "hostel_warden":
      return "/hostel-warden-dashboard";
    case "mess_supervisor":
      return "/mess-supervisor-dashboard";
    case "hod":
      return "/hod-dashboard";
    case "director":
      return "/director-dashboard";
    default:
      return "/dashboard";
  }
}

// RoleProtectedRoute: Only allows access if user has the required role
function RoleProtectedRoute({ allowedRole, children }: { allowedRole: string, children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (user.profile.role !== allowedRole) {
    // Redirect to the correct dashboard for this user
    return <Navigate to={getDashboardRouteForRole(user.profile.role)} replace />;
  }
  return <>{children}</>;
}

// AuthProtectedRoute: Only allows access if user is authenticated
function AuthProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AuthenticatedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/student-dashboard" element={
          <RoleProtectedRoute allowedRole="student">
            <StudentDashboard />
          </RoleProtectedRoute>
        } />
        <Route path="/faculty-dashboard" element={
          <RoleProtectedRoute allowedRole="faculty">
            <FacultyDashboard />
          </RoleProtectedRoute>
        } />
        <Route path="/admin-dashboard" element={
          <RoleProtectedRoute allowedRole="super_admin">
            <AdminDashboard />
          </RoleProtectedRoute>
        } />
        <Route path="/academic-staff-dashboard" element={
          <RoleProtectedRoute allowedRole="academic_staff">
            <AcademicStaffDashboard />
          </RoleProtectedRoute>
        } />
        <Route path="/hostel-warden-dashboard" element={
          <RoleProtectedRoute allowedRole="hostel_warden">
            <HostelWardenDashboard />
          </RoleProtectedRoute>
        } />
        <Route path="/mess-supervisor-dashboard" element={
          <RoleProtectedRoute allowedRole="mess_supervisor">
            <MessSupervisorDashboard />
          </RoleProtectedRoute>
        } />
        <Route path="/hod-dashboard" element={
          <RoleProtectedRoute allowedRole="hod">
            <HODDashboard />
          </RoleProtectedRoute>
        } />
        <Route path="/director-dashboard" element={
          <RoleProtectedRoute allowedRole="director">
            <Dashboard />
          </RoleProtectedRoute>
        } />
        <Route path="/mess-menu" element={
          <AuthProtectedRoute>
            <MessMenu />
          </AuthProtectedRoute>
        } />
        <Route path="/complaints" element={
          <AuthProtectedRoute>
            <Complaints />
          </AuthProtectedRoute>
        } />
        <Route path="/attendance" element={
          <AuthProtectedRoute>
            <Attendance />
          </AuthProtectedRoute>
        } />
        <Route path="/activities" element={<Activities />} />
        <Route path="/students" element={<Students />} />
        <Route path="/faculty" element={<Faculty />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/academic/holiday-management" element={<AcademicHolidayManagement />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </DashboardLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DepartmentsProvider>
            <FacultyDepartmentsProvider>
              <AuthenticatedApp />
            </FacultyDepartmentsProvider>
          </DepartmentsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
