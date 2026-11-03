export type UserRole =
  | 'Principal'
  | 'Dean'
  | 'HOD'
  | 'Basic Science Coordinator'
  | 'Department Coordinator'
  | 'Faculty'
  | 'Student';

export interface RoleOption {
  id: UserRole;
  label: string;
  description: string;
  badge: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  role: UserRole;
  rememberMe: boolean;
}

export interface StudentRegistrationData {
  fullName: string;
  email: string;
  usn: string;
  department: string;
  semester: string;
  password: string;
  confirmPassword: string;
}

export interface FormErrors {
  [key: string]: string | undefined;
}
