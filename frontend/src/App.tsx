import { useEffect, useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { PrincipalDashboard } from './pages/PrincipalDashboard';
import { DeanDashboard } from './pages/DeanDashboard';
import { HODDashboard } from './pages/HODDashboard';
import { BasicScienceDashboard } from './pages/BasicScienceDashboard';
import { DepartmentCoordinatorDashboard } from './pages/DepartmentCoordinatorDashboard';
import { WorkflowProvider } from './context/WorkflowContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { resolveAuthorizedView } from './utils/authMapping';

function AppContent() {
  const { currentUser, isAuthenticated, isAuthLoading, logout } = useAuth();
  const [allowPublicStudentSchedule, setAllowPublicStudentSchedule] = useState(false);
  const [pathname, setPathname] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const currentView = resolveAuthorizedView(pathname, currentUser, allowPublicStudentSchedule);

  const handleLoginSuccess = () => {
    setAllowPublicStudentSchedule(false);
  };

  const handleLogout = async () => {
    setAllowPublicStudentSchedule(false);
    await logout();
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
      setPathname('/');
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas text-ink">
        <div className="text-sm font-medium text-ink-muted">
          Verifying AQS session...
        </div>
      </div>
    );
  }

  if (currentView === 'student-dashboard') {
    return <StudentDashboard onLogout={handleLogout} />;
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToClassSchedule={() => setAllowPublicStudentSchedule(true)}
      />
    );
  }

  if (currentView === 'faculty-dashboard') {
    return <FacultyDashboard onLogout={handleLogout} />;
  }

  if (currentView === 'principal-dashboard') {
    return <PrincipalDashboard onLogout={handleLogout} />;
  }

  if (currentView === 'dean-dashboard') {
    return <DeanDashboard onLogout={handleLogout} />;
  }

  if (currentView === 'hod-dashboard') {
    return <HODDashboard onLogout={handleLogout} />;
  }

  if (currentView === 'basic-science-dashboard') {
    return <BasicScienceDashboard onLogout={handleLogout} />;
  }

  if (currentView === 'dept-coordinator-dashboard') {
    return <DepartmentCoordinatorDashboard onLogout={handleLogout} />;
  }

  return (
    <LoginPage
      onLoginSuccess={handleLoginSuccess}
      onNavigateToClassSchedule={() => setAllowPublicStudentSchedule(true)}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WorkflowProvider>
        <AppContent />
      </WorkflowProvider>
    </AuthProvider>
  );
}
