import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { aqsApi, registerAuthTokenGetter, setInMemoryAuthToken, setActiveRole } from '../services/api';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createGoogleAuthProvider,
  getFirebaseAuth,
  getRedirectResult,
  isFirebaseClientConfigured,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  FirebaseUser,
} from '../services/firebase';
import {
  AuthenticatedUser,
  mapBackendRoleToUiRole,
  mapUiRoleToBackendRole,
  sanitizeFirebaseAuthError,
} from '../utils/authMapping';
import { UserRole } from '../types/auth';

interface AuthContextType {
  currentUser: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithEmailPassword: (
    email: string,
    password: string,
    rememberMe?: boolean,
    selectedRole?: UserRole
  ) => Promise<AuthenticatedUser>;
  loginWithGoogle: (selectedRole?: UserRole) => Promise<AuthenticatedUser | null>;
  logout: () => Promise<void>;
  switchActiveRole?: (newRole: UserRole) => Promise<AuthenticatedUser>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearLocalAuthStorage() {
  setInMemoryAuthToken(null);
  setActiveRole(null);
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('aqs_auth_token');
    window.sessionStorage.removeItem('aqs_auth_token');
    window.sessionStorage.removeItem('aqs_active_role');
    window.sessionStorage.removeItem('aqs_selected_ui_role');
    window.localStorage.removeItem('aqs_user_department_id');
  }
}

function persistDisplayDepartmentScope(departmentId: string | null) {
  if (typeof window === 'undefined') return;
  if (departmentId) {
    window.localStorage.setItem('aqs_user_department_id', departmentId);
  } else {
    window.localStorage.removeItem('aqs_user_department_id');
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(isFirebaseClientConfigured);
  const [authError, setAuthError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const manualSignInInProgressRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const verifyBackendIdentity = useCallback(
    async (fbUser: FirebaseUser, selectedUiRole?: UserRole): Promise<AuthenticatedUser> => {
      const idToken = await fbUser.getIdToken();
      setInMemoryAuthToken(idToken);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('aqs_auth_token', idToken);
      }

      // Candidate role from explicit login selection or stored active session
      const candidateUiRole =
        selectedUiRole ||
        (typeof window !== 'undefined'
          ? (window.sessionStorage.getItem('aqs_selected_ui_role') as UserRole | null)
          : null);

      const candidateBackendRole = candidateUiRole ? mapUiRoleToBackendRole(candidateUiRole) : null;
      if (candidateBackendRole) {
        setActiveRole(candidateBackendRole);
      }

      const me = await aqsApi.getAuthenticatedMe(idToken, candidateBackendRole || undefined);
      const uiRole = mapBackendRoleToUiRole(me.role);
      if (!me.is_active || !uiRole) {
        throw new Error('Your account is inactive. Please contact the administrator.');
      }

      // Establish verified active role in session
      setActiveRole(me.role);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('aqs_selected_ui_role', uiRole);
      }

      const verifiedUser: AuthenticatedUser = {
        uid: me.uid,
        email: me.email,
        displayName: me.display_name || fbUser.displayName || me.email,
        backendRole: me.role,
        role: uiRole,
        departmentId: me.department_id ?? null,
        departmentCode: me.department_code ?? null,
        departmentName: me.department_name ?? null,
        isActive: me.is_active,
        assignedRoles: me.assigned_roles,
      };

      // Display/scope convenience only — backend never trusts localStorage
      persistDisplayDepartmentScope(verifiedUser.departmentId);
      return verifiedUser;
    },
    []
  );

  const safeSignOutAndReset = useCallback(async () => {
    clearLocalAuthStorage();
    if (isFirebaseClientConfigured) {
      try {
        await signOut(getFirebaseAuth());
      } catch {
        // Ignore signOut errors during cleanup
      }
    }
    if (isMountedRef.current) {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseClientConfigured) {
      registerAuthTokenGetter(null);
      setIsAuthLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    registerAuthTokenGetter(async () => {
      if (!auth.currentUser) return null;
      return auth.currentUser.getIdToken();
    });

    // Handle redirect sign-in result if popup fallback triggered a redirect
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          try {
            const verified = await verifyBackendIdentity(result.user);
            if (isMountedRef.current) {
              setCurrentUser(verified);
              setAuthError(null);
            }
          } catch (err) {
            await safeSignOutAndReset();
            if (isMountedRef.current) {
              setAuthError(sanitizeFirebaseAuthError(err));
            }
          }
        }
      })
      .catch((err) => {
        if (isMountedRef.current) {
          setAuthError(sanitizeFirebaseAuthError(err));
        }
      });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (manualSignInInProgressRef.current) {
        return;
      }
      if (!fbUser) {
        clearLocalAuthStorage();
        if (isMountedRef.current) {
          setCurrentUser(null);
          setIsAuthLoading(false);
        }
        return;
      }

      try {
        const verified = await verifyBackendIdentity(fbUser);
        if (isMountedRef.current) {
          setCurrentUser(verified);
          setAuthError(null);
        }
      } catch (err) {
        await safeSignOutAndReset();
        if (isMountedRef.current) {
          setAuthError(sanitizeFirebaseAuthError(err));
        }
      } finally {
        if (isMountedRef.current) {
          setIsAuthLoading(false);
        }
      }
    });

    return () => {
      unsubscribe();
      registerAuthTokenGetter(null);
    };
  }, [verifyBackendIdentity, safeSignOutAndReset]);

  const loginWithEmailPassword = useCallback(
    async (
      email: string,
      password: string,
      rememberMe = false,
      selectedRole?: UserRole
    ): Promise<AuthenticatedUser> => {
      setAuthError(null);
      manualSignInInProgressRef.current = true;
      try {
        const auth = getFirebaseAuth();
        await setPersistence(
          auth,
          rememberMe ? browserLocalPersistence : browserSessionPersistence
        );
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const verified = await verifyBackendIdentity(credential.user, selectedRole);
        if (isMountedRef.current) {
          setCurrentUser(verified);
          setIsAuthLoading(false);
        }
        return verified;
      } catch (err) {
        await safeSignOutAndReset();
        const safeMsg = sanitizeFirebaseAuthError(err);
        if (isMountedRef.current) {
          setAuthError(safeMsg);
          setIsAuthLoading(false);
        }
        throw new Error(safeMsg);
      } finally {
        manualSignInInProgressRef.current = false;
      }
    },
    [verifyBackendIdentity, safeSignOutAndReset]
  );

  const loginWithGoogle = useCallback(
    async (selectedRole?: UserRole): Promise<AuthenticatedUser | null> => {
      setAuthError(null);
      manualSignInInProgressRef.current = true;
      try {
        const auth = getFirebaseAuth();
        const provider = createGoogleAuthProvider();
        try {
          const credential = await signInWithPopup(auth, provider);
          const verified = await verifyBackendIdentity(credential.user, selectedRole);
          if (isMountedRef.current) {
            setCurrentUser(verified);
            setIsAuthLoading(false);
          }
          return verified;
        } catch (popupErr: any) {
          if (popupErr?.code === 'auth/popup-blocked') {
            if (selectedRole && typeof window !== 'undefined') {
              window.sessionStorage.setItem('aqs_selected_ui_role', selectedRole);
            }
            await signInWithRedirect(auth, provider);
            return null;
          }
          throw popupErr;
        }
      } catch (err) {
        await safeSignOutAndReset();
        const safeMsg = sanitizeFirebaseAuthError(err);
        if (isMountedRef.current) {
          setAuthError(safeMsg);
          setIsAuthLoading(false);
        }
        throw new Error(safeMsg);
      } finally {
        manualSignInInProgressRef.current = false;
      }
    },
    [verifyBackendIdentity, safeSignOutAndReset]
  );

  const switchActiveRole = useCallback(
    async (newRole: UserRole): Promise<AuthenticatedUser> => {
      const auth = getFirebaseAuth();
      if (!auth.currentUser) {
        throw new Error('No authenticated user session found.');
      }
      const verified = await verifyBackendIdentity(auth.currentUser, newRole);
      if (isMountedRef.current) {
        setCurrentUser(verified);
      }
      return verified;
    },
    [verifyBackendIdentity]
  );

  const logout = useCallback(async () => {
    setAuthError(null);
    await safeSignOutAndReset();
  }, [safeSignOutAndReset]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser && currentUser.isActive),
        isAuthLoading,
        authError,
        clearAuthError: () => setAuthError(null),
        loginWithEmailPassword,
        loginWithGoogle,
        logout,
        switchActiveRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
