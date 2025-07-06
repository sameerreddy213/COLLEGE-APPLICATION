
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data integrity
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'academic_staff', 
  'faculty',
  'student',
  'mess_supervisor',
  'hostel_warden',
  'hod',
  'director'
);

CREATE TYPE blood_group AS ENUM (
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
);

CREATE TYPE complaint_status AS ENUM (
  'open',
  'resolved',
  'completed'
);

CREATE TYPE meal_type AS ENUM (
  'breakfast',
  'lunch', 
  'dinner'
);

CREATE TYPE mess_type AS ENUM (
  'veg',
  'non_veg'
);

-- Create departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT,
  blood_group blood_group,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  roll_number TEXT UNIQUE NOT NULL,
  branch TEXT NOT NULL,
  batch_year INTEGER NOT NULL,
  hostel_room_no TEXT,
  hostel_block_number TEXT,
  department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create faculty table
CREATE TABLE public.faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  designation TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id),
  semester INTEGER NOT NULL,
  credits INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create timetables table
CREATE TABLE public.timetables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE CASCADE,
  branch TEXT NOT NULL,
  section TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  classroom TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  is_present BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, subject_id, attendance_date)
);

-- Create hostel complaints table
CREATE TABLE public.hostel_complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status complaint_status DEFAULT 'open',
  warden_id UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mess menu table
CREATE TABLE public.mess_menu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_date DATE NOT NULL,
  meal_type meal_type NOT NULL,
  mess_type mess_type NOT NULL,
  items TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(menu_date, meal_type, mess_type)
);

-- Create holidays table
CREATE TABLE public.holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can delete profiles" ON public.profiles
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'super_admin');

-- RLS Policies for departments table
CREATE POLICY "Everyone can view departments" ON public.departments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins and academic staff can manage departments" ON public.departments
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('super_admin', 'academic_staff'));

-- RLS Policies for students table
CREATE POLICY "Students can view their own record" ON public.students
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Faculty can view students in their department" ON public.students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.faculty f 
      WHERE f.user_id = auth.uid() 
      AND f.department_id = students.department_id
    )
  );

CREATE POLICY "Admins and academic staff can manage students" ON public.students
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('super_admin', 'academic_staff'));

-- RLS Policies for faculty table
CREATE POLICY "Faculty can view their own record" ON public.faculty
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Everyone can view faculty info" ON public.faculty
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage faculty" ON public.faculty
  FOR ALL USING (public.get_user_role(auth.uid()) = 'super_admin');

-- RLS Policies for subjects table
CREATE POLICY "Everyone can view subjects" ON public.subjects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Academic staff can manage subjects" ON public.subjects
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('super_admin', 'academic_staff'));

-- RLS Policies for timetables table
CREATE POLICY "Everyone can view timetables" ON public.timetables
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Academic staff can manage timetables" ON public.timetables
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('super_admin', 'academic_staff'));

-- RLS Policies for attendance table
CREATE POLICY "Students can view their own attendance" ON public.attendance
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Faculty can view and manage attendance for their subjects" ON public.attendance
  FOR ALL USING (
    faculty_id IN (
      SELECT id FROM public.faculty WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "HODs and directors can view department attendance" ON public.attendance
  FOR SELECT USING (public.get_user_role(auth.uid()) IN ('hod', 'director'));

-- RLS Policies for hostel complaints table
CREATE POLICY "Students can manage their own complaints" ON public.hostel_complaints
  FOR ALL USING (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Wardens can view and manage all complaints" ON public.hostel_complaints
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('hostel_warden', 'super_admin', 'director'));

-- RLS Policies for mess menu table
CREATE POLICY "Everyone can view mess menu" ON public.mess_menu
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Mess supervisors can manage menu" ON public.mess_menu
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('mess_supervisor', 'super_admin'));

-- RLS Policies for holidays table
CREATE POLICY "Everyone can view holidays" ON public.holidays
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Academic staff can manage holidays" ON public.holidays
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('super_admin', 'academic_staff'));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample departments
INSERT INTO public.departments (name, code) VALUES
  ('Computer Science and Engineering', 'CSE'),
  ('Electronics and Communication Engineering', 'ECE'),
  ('Mathematics and Computing', 'MNC');
