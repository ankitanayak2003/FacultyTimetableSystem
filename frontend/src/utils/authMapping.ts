import type { UserRole } from '../types/auth';

export type AppView =
  | 'login'
  | 'student-dashboard'
  | 'faculty-dashboard'
  | 'principal-dashboard'
  | 'dean-dashboard'
  | 'hod-dashboard'
  | 'basic-science-dashboard'
  | 'dept-coordinator-dashboard';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  displayName: string;
  backendRole: string;
  role: UserRole;
  departmentId: string | null;
  departmentCode: string | null;
  departmentName: string | null;
  isActive: boolean;
  assignedRoles?: string[];
}

export const BACKEND_TO_UI_ROLE: Record<string, UserRole> = {
  DEAN: 'Dean',
  PRINCIPAL: 'Principal',
  HOD: 'HOD',
  DEPARTMENT_COORDINATOR: 'Department Coordinator',
  BASIC_SCIENCE_COORDINATOR: 'Basic Science Coordinator',
  FACULTY: 'Faculty',
  STUDENT_VIEWER: 'Student',
  STUDENT: 'Student',
  ADMIN: 'Dean',
  CHIEF_COORDINATOR: 'Dean',
};

export const UI_TO_BACKEND_ROLE: Record<UserRole, string> = {
  Principal: 'PRINCIPAL',
  Dean: 'DEAN',
  HOD: 'HOD',
  'Department Coordinator': 'DEPARTMENT_COORDINATOR',
  'Basic Science Coordinator': 'BASIC_SCIENCE_COORDINATOR',
  Faculty: 'FACULTY',
  Student: 'STUDENT_VIEWER',
};

export function mapBackendRoleToUiRole(backendRole?: string | null): UserRole | null {
  if (!backendRole) return null;
  const normalized = backendRole.trim().toUpperCase();
  return BACKEND_TO_UI_ROLE[normalized] ?? null;
}

export function mapUiRoleToBackendRole(uiRole?: UserRole | string | null): string | null {
  if (!uiRole) return null;
  if (uiRole in UI_TO_BACKEND_ROLE) {
    return UI_TO_BACKEND_ROLE[uiRole as UserRole];
  }
  const normalized = uiRole.toString().trim().toUpperCase().replace(/\s+/g, '_');
  if (BACKEND_TO_UI_ROLE[normalized]) {
    return normalized === 'STUDENT' ? 'STUDENT_VIEWER' : normalized;
  }
  return null;
}

export function getDashboardViewForRole(role: UserRole): AppView {
  switch (role) {
    case 'Principal':
      return 'principal-dashboard';
    case 'Dean':
      return 'dean-dashboard';
    case 'HOD':
      return 'hod-dashboard';
    case 'Basic Science Coordinator':
      return 'basic-science-dashboard';
    case 'Department Coordinator':
      return 'dept-coordinator-dashboard';
    case 'Faculty':
      return 'faculty-dashboard';
    case 'Student':
    default:
      return 'student-dashboard';
  }
}

const PATH_TO_VIEW: Record<string, AppView> = {
  '/': 'login',
  '/login': 'login',
  '/student': 'student-dashboard',
  '/faculty': 'faculty-dashboard',
  '/principal': 'principal-dashboard',
  '/dean': 'dean-dashboard',
  '/hod': 'hod-dashboard',
  '/basic-science': 'basic-science-dashboard',
  '/coordinator': 'dept-coordinator-dashboard',
};

/**
 * Resolves the authorized view for a given URL path and verified user.
 * Prevents direct URL access to unauthorized dashboards by failing closed
 * to either 'login' (when unauthenticated/inactive) or the user's own
 * authorized dashboard.
 */
export function resolveAuthorizedView(
  pathname: string,
  user: AuthenticatedUser | null,
  allowPublicStudentSchedule: boolean = false
): AppView {
  const cleanPath = (pathname || '/').replace(/\/+$/, '') || '/';
  const requestedView = PATH_TO_VIEW[cleanPath];

  if (!user || !user.isActive) {
    if (allowPublicStudentSchedule && requestedView === 'student-dashboard') {
      return 'student-dashboard';
    }
    return 'login';
  }

  const authorizedView = getDashboardViewForRole(user.role);
  if (requestedView && requestedView !== authorizedView) {
    return authorizedView;
  }
  return authorizedView;
}

export function sanitizeFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : '';

  // 1. Exact backend role validation messages - preserve verbatim
  if (
    message.includes('The selected institutional role does not match your assigned role') ||
    message.includes('You do not have access to the selected institutional portal')
  ) {
    return message;
  }

  // 2. Inactive account message
  if (
    message.includes('Your account is inactive') ||
    message.toLowerCase().includes('account is inactive') ||
    code === 'auth/user-disabled'
  ) {
    return 'Your account is inactive. Please contact the administrator.';
  }

  // 3. Invalid credentials
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many failed sign-in attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error while contacting authentication service. Please check your connection.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled before completion.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in popup is already open. Please complete or close it.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Redirecting to Google Sign-In...';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    default:
      break;
  }

  if (message.includes('401') && (message.toLowerCase().includes('credential') || message.toLowerCase().includes('password'))) {
    return 'Invalid email or password.';
  }

  if (message.includes('401') || message.toLowerCase().includes('not found in system database')) {
    return 'Your account is not provisioned for AQS access. Please contact your administrator.';
  }
  if (message.includes('403') || message.toLowerCase().includes('disabled')) {
    return 'Your account is inactive. Please contact the administrator.';
  }
  if (message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('network')) {
    return 'Unable to reach the AQS verification server. Please ensure the backend is running.';
  }

  return message || 'Authentication failed. Please try again.';
}
