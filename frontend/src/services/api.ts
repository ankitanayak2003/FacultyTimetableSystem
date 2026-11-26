/**
 * AQS Backend API Client
 * Connects frontend components and WorkflowContext to FastAPI endpoints.
 * Includes graceful fallback to local data when backend is not running.
 */

export function resolveApiBaseUrl(envUrl?: string): string {
  const configured = (envUrl ?? import.meta.env?.VITE_API_BASE_URL ?? '').trim();
  if (!configured) {
    return 'http://127.0.0.1:8001/api/v1';
  }
  const clean = configured.replace(/\/+$/, '');
  return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
}

export const API_BASE_URL = resolveApiBaseUrl();

export function resolveRealtimeStreamUrl(base = API_BASE_URL): string {
  return `${base}/realtime/stream`;
}

export interface ApiFetchOptions extends RequestInit {
  role?: string;
}

let activeTokenGetter: (() => Promise<string | null>) | null = null;
let cachedInMemoryToken: string | null = null;
let activeRoleGetter: (() => string | null) | null = null;
let cachedActiveRole: string | null = null;

export function registerAuthTokenGetter(getter: (() => Promise<string | null>) | null) {
  activeTokenGetter = getter;
}

export function setInMemoryAuthToken(token: string | null) {
  cachedInMemoryToken = token;
}

export function registerActiveRoleGetter(getter: (() => string | null) | null) {
  activeRoleGetter = getter;
}

export function setActiveRole(role: string | null) {
  cachedActiveRole = role;
  if (typeof window !== 'undefined') {
    if (role) {
      window.sessionStorage.setItem('aqs_active_role', role);
    } else {
      window.sessionStorage.removeItem('aqs_active_role');
    }
  }
}

export function getActiveRole(): string | null {
  if (activeRoleGetter) {
    try {
      const r = activeRoleGetter();
      if (r) return r;
    } catch {
      // Fall through
    }
  }
  if (cachedActiveRole) return cachedActiveRole;
  if (typeof window !== 'undefined') {
    return window.sessionStorage.getItem('aqs_active_role');
  }
  return null;
}

export async function getActiveBearerToken(): Promise<string | null> {
  if (activeTokenGetter) {
    try {
      const liveToken = await activeTokenGetter();
      if (liveToken) {
        cachedInMemoryToken = liveToken;
        return liveToken;
      }
    } catch {
      // Fall through to cached token
    }
  }
  if (cachedInMemoryToken) return cachedInMemoryToken;
  if (typeof window !== 'undefined') {
    return window.sessionStorage.getItem('aqs_auth_token') || window.localStorage.getItem('aqs_auth_token');
  }
  return null;
}

/**
 * Standard fetch wrapper that attaches verified Firebase ID Bearer credentials.
 */
export async function apiRequest<T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('Authorization')) {
    const token = await getActiveBearerToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  if (!headers.has('X-AQS-Active-Role')) {
    const activeRole = getActiveRole();
    if (activeRole) {
      headers.set('X-AQS-Active-Role', activeRole);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      setInMemoryAuthToken(null);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('aqs_auth_token');
      }
    }
    let errorDetail = `API Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// =====================================================================
// Domain API Functions
// =====================================================================

export interface TimetableDraftPlacement {
  day: string;
  start_period: number;
  duration?: number;
  subject_code?: string;
  subject_name?: string;
  faculty_name?: string;
  room?: string;
  is_locked?: boolean;
  is_practical?: boolean;
  batch?: string;
  lock_reason?: string;
}

export interface TimetableDraftPayload {
  timetable_id: string;
  academic_year?: string;
  semester: number;
  semester_type?: string;
  department_id?: string | null;
  section: string;
  cycle?: string;
  status?: string;
  placements: TimetableDraftPlacement[];
}

export const aqsApi = {
  // System & Excel Import
  getSystemInfo: () => apiRequest<any>('/system/info'),
  inspectExcel: () => apiRequest<any>('/system/excel-inspect', { role: 'admin' }),
  importExcel: (dryRun: boolean = true, overwrite: boolean = false) =>
    apiRequest<any>('/system/import-excel', {
      method: 'POST',
      body: JSON.stringify({ dry_run: dryRun, overwrite_existing: overwrite }),
      role: 'admin',
    }),

  // Departments
  getDepartments: (category?: string) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return apiRequest<any[]>(`/departments${q}`);
  },

  // Faculty
  getFaculty: (departmentId?: string, limit: number = 500) => {
    const params = new URLSearchParams();
    if (departmentId) params.append('department_id', departmentId);
    if (limit) params.append('limit', limit.toString());
    const q = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any[]>(`/faculty${q}`, { role: 'admin' });
  },
  createFaculty: (payload: any) =>
    apiRequest<any>('/faculty/', {
      method: 'POST',
      body: JSON.stringify(payload),
      role: 'coordinator',
    }),
  updateFaculty: (id: string, payload: any) =>
    apiRequest<any>(`/faculty/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      role: 'coordinator',
    }),
  deleteFaculty: (id: string) =>
    apiRequest<any>(`/faculty/${id}`, {
      method: 'DELETE',
      role: 'admin',
    }),
  provisionFacultyLogin: (facultyId: string, enableLogin: boolean = true, password?: string) =>
    apiRequest<any>(`/faculty/${facultyId}/provision-login`, {
      method: 'POST',
      body: JSON.stringify({ enable_login: enableLogin, password: password || '123456' }),
      role: 'coordinator',
    }),

  // Subjects
  getSubjects: (departmentId?: string, semester?: number) => {
    const params = new URLSearchParams();
    if (departmentId) params.append('department_id', departmentId);
    if (semester) params.append('semester', semester.toString());
    const q = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any[]>(`/subjects${q}`, { role: 'admin' });
  },
  createSubject: (payload: any, role: string = 'coordinator') =>
    apiRequest<any>('/subjects/', {
      method: 'POST',
      body: JSON.stringify(payload),
      role,
    }),
  updateSubject: (id: string, payload: any, role: string = 'coordinator') =>
    apiRequest<any>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      role,
    }),
  deleteSubject: (id: string, role: string = 'coordinator') =>
    apiRequest<any>(`/subjects/${id}`, {
      method: 'DELETE',
      role,
    }),

  // Rooms and Labs
  getRooms: () => apiRequest<any[]>('/rooms', { role: 'admin' }),
  getLabs: (departmentId?: string) => {
    const q = departmentId ? `?department_id=${encodeURIComponent(departmentId)}` : '';
    return apiRequest<any[]>(`/labs${q}`, { role: 'admin' });
  },

  // Allotments
  getAllotments: (params?: { academicYear?: string; departmentId?: string; semester?: number; section?: string }) => {
    const query = new URLSearchParams();
    if (params?.academicYear) query.append('academic_year', params.academicYear);
    if (params?.departmentId) query.append('department_id', params.departmentId);
    if (params?.semester) query.append('semester', params.semester.toString());
    if (params?.section) query.append('section', params.section);
    const q = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<any[]>(`/allotments${q}`, { role: 'admin' });
  },
  createAllotment: (payload: any, role: string = 'coordinator') =>
    apiRequest<any>('/allotments/', {
      method: 'POST',
      body: JSON.stringify(payload),
      role,
    }),
  upsertAllotment: (payload: any, role: string = 'coordinator') =>
    apiRequest<any>('/allotments/upsert', {
      method: 'PUT',
      body: JSON.stringify(payload),
      role,
    }),
  updateAllotment: (id: string, payload: any, role: string = 'coordinator') =>
    apiRequest<any>(`/allotments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      role,
    }),
  deleteAllotment: (id: string, role: string = 'admin') =>
    apiRequest<any>(`/allotments/${id}`, {
      method: 'DELETE',
      role,
    }),

  lockAllotment: (id: string, reason?: string) =>
    apiRequest<any>(`/allotments/${id}/lock`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      role: 'dean',
    }),

  unlockAllotment: (id: string) =>
    apiRequest<any>(`/allotments/${id}/unlock`, {
      method: 'POST',
      role: 'dean',
    }),

  // Workload Records
  getWorkloadRecords: (academicYear?: string, facultyId?: string) => {
    const query = new URLSearchParams();
    if (academicYear) query.append('academic_year', academicYear);
    if (facultyId) query.append('faculty_id', facultyId);
    const q = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<any[]>(`/workload-records${q}`, { role: 'admin' });
  },

  // Preferences
  getPreferences: (departmentId?: string) => {
    const q = departmentId ? `?department_id=${encodeURIComponent(departmentId)}` : '';
    return apiRequest<any[]>(`/preferences${q}`, { role: 'admin' });
  },
  submitPreferences: (payload: any) =>
    apiRequest<any>('/preferences/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
      role: 'faculty',
    }),
  reviewPreference: (id: string, payload: { status: string; hod_comments?: string }) =>
    apiRequest<any>(`/preferences/${id}/hod-review`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      role: 'hod',
    }),
  finalizePreference: (id: string, finalizedBy?: string) =>
    apiRequest<any>(`/preferences/${id}/finalize`, {
      method: 'POST',
      body: JSON.stringify({ finalized_by: finalizedBy }),
      role: 'hod',
    }),
  getFinalizedPreferences: (departmentId: string, academicYear: string, semester: number) => {
    const q = `?department_id=${encodeURIComponent(departmentId)}&academic_year=${encodeURIComponent(academicYear)}&semester=${semester}`;
    return apiRequest<any[]>(`/preferences/coordinator/finalized${q}`, { role: 'coordinator' });
  },

  // Sections
  getSections: (departmentId?: string, studentYear?: string) => {
    const params = new URLSearchParams();
    if (departmentId) params.append('department_id', departmentId);
    if (studentYear) params.append('student_year', studentYear);
    const q = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any[]>(`/sections${q}`, { role: 'admin' });
  },

  // Timetables & CP-SAT Generator
  getTimetables: (departmentId?: string, semester?: number, section?: string) => {
    const params = new URLSearchParams();
    if (departmentId) params.append('department_id', departmentId);
    if (semester !== undefined) params.append('semester', String(semester));
    if (section) params.append('section', section);
    const q = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any[]>(`/timetables${q}`, { role: 'admin' });
  },
  getTimetableSlots: (paramsOrTimetableId?: string | { timetable_id?: string; limit?: number }, limit?: number) => {
    const params = new URLSearchParams();
    if (typeof paramsOrTimetableId === 'string') {
      if (paramsOrTimetableId) params.append('timetable_id', paramsOrTimetableId);
      if (limit) params.append('limit', String(limit));
    } else if (paramsOrTimetableId && typeof paramsOrTimetableId === 'object') {
      if (paramsOrTimetableId.timetable_id) params.append('timetable_id', paramsOrTimetableId.timetable_id);
      if (paramsOrTimetableId.limit) params.append('limit', String(paramsOrTimetableId.limit));
    }
    const q = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any[]>(`/timetable-slots${q}`, { role: 'admin' });
  },
  generateTimetable: (payload: {
    academic_year?: string;
    semester: number;
    department_id: string;
    section: string;
    student_count?: number;
    batch_count?: number;
    periods_per_day?: number;
    lunch_period?: number;
  }) =>
    apiRequest<any>('/timetables/generate', {
      method: 'POST',
      body: JSON.stringify({
        academic_year: payload.academic_year || '2026-2027',
        semester: payload.semester,
        department_id: payload.department_id,
        section: payload.section,
        student_count: payload.student_count || 60,
        batch_count: payload.batch_count || 2,
        periods_per_day: payload.periods_per_day || 7,
        lunch_period: payload.lunch_period || 5,
      }),
      role: 'coordinator',
    }),

  validateTimetable: (timetableId: string) =>
    apiRequest<any>(`/timetables/${timetableId}/validate`, {
      method: 'POST',
      role: 'coordinator',
    }),

  getFacultyTimetable: (facultyId: string) =>
    apiRequest<any[]>(`/timetables/faculty/${encodeURIComponent(facultyId)}`),

  getDepartmentTimetables: (departmentId: string, academicYear?: string) => {
    const q = academicYear ? `?academic_year=${encodeURIComponent(academicYear)}` : '';
    return apiRequest<any[]>(`/timetables/department/${encodeURIComponent(departmentId)}${q}`);
  },

  createTimetable: (payload: any) =>
    apiRequest<any>('/timetables/', {
      method: 'POST',
      body: JSON.stringify(payload),
      role: 'coordinator',
    }),

  saveTimetableDraft: (payload: TimetableDraftPayload) =>
    apiRequest<any>('/timetables/draft', {
      method: 'POST',
      body: JSON.stringify(payload),
      role: 'coordinator',
    }),

  updateTimetable: (id: string, payload: any) =>
    apiRequest<any>(`/timetables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      role: 'coordinator',
    }),

  publishTimetable: (id: string) =>
    apiRequest<any>(`/timetables/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'PUBLISHED' }),
      role: 'coordinator',
    }),

  deleteTimetable: (id: string) =>
    apiRequest<any>(`/timetables/${id}`, {
      method: 'DELETE',
      role: 'coordinator',
    }),

  // Fixed Classrooms
  getFixedClassrooms: (params?: { departmentId?: string; academicYear?: string; semester?: number; section?: string }) => {
    const query = new URLSearchParams();
    if (params?.departmentId) query.append('department_id', params.departmentId);
    if (params?.academicYear) query.append('academic_year', params.academicYear);
    if (params?.semester) query.append('semester', params.semester.toString());
    if (params?.section) query.append('section', params.section);
    const q = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<any[]>(`/fixed-classrooms${q}`, { role: 'admin' });
  },

  updateFixedClassroom: (id: string, updates: any) =>
    apiRequest<any>(`/fixed-classrooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      role: 'coordinator',
    }),

  // Authentication & Identity
  getAuthenticatedMe: (bearerToken?: string, activeRole?: string) => {
    const headers: Record<string, string> = {};
    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }
    if (activeRole) {
      headers['X-AQS-Active-Role'] = activeRole;
    }
    return apiRequest<{
      uid: string;
      email: string;
      display_name: string;
      role: string;
      department_id: string | null;
      department_code: string | null;
      department_name: string | null;
      is_active: boolean;
      assigned_roles: string[];
      portal_view?: string;
    }>('/auth/me', { headers });
  },

  validateSelectedRole: (selectedRole: string, bearerToken?: string) => {
    const headers: Record<string, string> = {
      'X-AQS-Active-Role': selectedRole,
    };
    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }
    return apiRequest<{
      uid: string;
      email: string;
      display_name: string;
      active_role: string;
      department_id: string | null;
      department_code: string | null;
      department_name: string | null;
      is_active: boolean;
      assigned_roles: string[];
      portal_view: string;
      message: string;
    }>('/auth/validate-role', {
      method: 'POST',
      body: JSON.stringify({ selected_role: selectedRole }),
      headers,
    });
  },
};
