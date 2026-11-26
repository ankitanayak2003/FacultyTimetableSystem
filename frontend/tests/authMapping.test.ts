import test from 'node:test';
import assert from 'node:assert/strict';
import {
  type AuthenticatedUser,
  getDashboardViewForRole,
  mapBackendRoleToUiRole,
  mapUiRoleToBackendRole,
  resolveAuthorizedView,
  sanitizeFirebaseAuthError,
} from '../src/utils/authMapping.ts';

const makeUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  uid: 'uid_1',
  email: 'user@aqs.test',
  displayName: 'Test User',
  backendRole: 'FACULTY',
  role: 'Faculty',
  departmentId: 'dept_cse',
  departmentCode: 'CSE',
  departmentName: 'Computer Science & Engineering',
  isActive: true,
  ...overrides,
});

test('1. mapBackendRoleToUiRole maps all AQS roles and rejects unknown roles', () => {
  assert.equal(mapBackendRoleToUiRole('DEAN'), 'Dean');
  assert.equal(mapBackendRoleToUiRole('DEPARTMENT_COORDINATOR'), 'Department Coordinator');
  assert.equal(mapBackendRoleToUiRole('BASIC_SCIENCE_COORDINATOR'), 'Basic Science Coordinator');
  assert.equal(mapBackendRoleToUiRole('HOD'), 'HOD');
  assert.equal(mapBackendRoleToUiRole('FACULTY'), 'Faculty');
  assert.equal(mapBackendRoleToUiRole('PRINCIPAL'), 'Principal');
  assert.equal(mapBackendRoleToUiRole('STUDENT_VIEWER'), 'Student');
  assert.equal(mapBackendRoleToUiRole('UNKNOWN_ROLE'), null);
  assert.equal(mapBackendRoleToUiRole(null), null);
});

test('2. resolveAuthorizedView prevents direct URL access to unauthorized dashboards', () => {
  // Unauthenticated caller visiting /dean or /coordinator -> login
  assert.equal(resolveAuthorizedView('/dean', null), 'login');
  assert.equal(resolveAuthorizedView('/coordinator', null), 'login');

  // Inactive user -> login
  const inactiveDean = makeUser({ backendRole: 'DEAN', role: 'Dean', isActive: false });
  assert.equal(resolveAuthorizedView('/dean', inactiveDean), 'login');

  // Authenticated Faculty attempting to open /dean -> forced to faculty-dashboard
  const facultyUser = makeUser({ backendRole: 'FACULTY', role: 'Faculty' });
  assert.equal(resolveAuthorizedView('/dean', facultyUser), 'faculty-dashboard');
  assert.equal(resolveAuthorizedView('/coordinator', facultyUser), 'faculty-dashboard');

  // Authenticated Dean visiting /dean -> dean-dashboard
  const deanUser = makeUser({ backendRole: 'DEAN', role: 'Dean', departmentId: null });
  assert.equal(resolveAuthorizedView('/dean', deanUser), getDashboardViewForRole('Dean'));
});

test('3. sanitizeFirebaseAuthError returns safe user-facing messages without leaking internals', () => {
  assert.equal(
    sanitizeFirebaseAuthError({ code: 'auth/invalid-credential' }),
    'Invalid email or password.'
  );
  assert.equal(
    sanitizeFirebaseAuthError({ code: 'auth/user-disabled' }),
    'Your account is inactive. Please contact the administrator.'
  );
  assert.match(
    sanitizeFirebaseAuthError({ code: 'auth/popup-closed-by-user' }),
    /cancelled/i
  );
  assert.match(
    sanitizeFirebaseAuthError(new Error('API Error 401: User profile for UID xyz was not found in system database')),
    /not provisioned/i
  );
});

test('4. mapUiRoleToBackendRole maps UI roles to backend canonical roles', () => {
  assert.equal(mapUiRoleToBackendRole('Dean'), 'DEAN');
  assert.equal(mapUiRoleToBackendRole('Department Coordinator'), 'DEPARTMENT_COORDINATOR');
  assert.equal(mapUiRoleToBackendRole('Basic Science Coordinator'), 'BASIC_SCIENCE_COORDINATOR');
  assert.equal(mapUiRoleToBackendRole('Faculty'), 'FACULTY');
  assert.equal(mapUiRoleToBackendRole('HOD'), 'HOD');
  assert.equal(mapUiRoleToBackendRole('Principal'), 'PRINCIPAL');
  assert.equal(mapUiRoleToBackendRole('Student'), 'STUDENT_VIEWER');
});

test('5. sanitizeFirebaseAuthError strictly preserves exact institutional role error messages', () => {
  const singleMismatch = 'The selected institutional role does not match your assigned role. Please select the correct role.';
  const multiMismatch = 'You do not have access to the selected institutional portal. Please select one of your assigned roles.';
  const inactiveAcc = 'Your account is inactive. Please contact the administrator.';
  const invalidCred = 'Invalid email or password.';

  assert.equal(sanitizeFirebaseAuthError(new Error(singleMismatch)), singleMismatch);
  assert.equal(sanitizeFirebaseAuthError(new Error(multiMismatch)), multiMismatch);
  assert.equal(sanitizeFirebaseAuthError(new Error(inactiveAcc)), inactiveAcc);
  assert.equal(sanitizeFirebaseAuthError({ code: 'auth/wrong-password' }), invalidCred);
});
