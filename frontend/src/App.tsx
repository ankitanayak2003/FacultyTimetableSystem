import { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { RoleDashboardPlaceholder } from './pages/RoleDashboardPlaceholder';
import { UserRole } from './types/auth';

export default function App() {
  const [currentView, setCurrentView] = useState<'login' | 'student-dashboard' | 'faculty-dashboard' | 'role-placeholder'>('login');
  const [activeRole, setActiveRole] = useState<UserRole>('Faculty');

  const handleLoginSuccess = (role: UserRole) => {
    setActiveRole(role);
    if (role === 'Student') {
      setCurrentView('student-dashboard');
    } else if (role === 'Faculty') {
      setCurrentView('faculty-dashboard');
    } else {
      setCurrentView('role-placeholder');
    }
  };

  const handleLogout = () => {
    setCurrentView('login');
  };

  if (currentView === 'student-dashboard') {
    return <StudentDashboard onLogout={handleLogout} />;
  }

  if (currentView === 'faculty-dashboard') {
    return <FacultyDashboard onLogout={handleLogout} />;
  }

  if (currentView === 'role-placeholder') {
    return (
      <RoleDashboardPlaceholder
        role={activeRole}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <LoginPage
      onLoginSuccess={handleLoginSuccess}
      onNavigateToClassSchedule={() => setCurrentView('student-dashboard')}
    />
  );
}
