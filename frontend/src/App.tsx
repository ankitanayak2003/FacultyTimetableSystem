import { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { PrincipalDashboard } from './pages/PrincipalDashboard';
import { DeanDashboard } from './pages/DeanDashboard';
import { HODDashboard } from './pages/HODDashboard';
import { BasicScienceDashboard } from './pages/BasicScienceDashboard';
import { DepartmentCoordinatorDashboard } from './pages/DepartmentCoordinatorDashboard';
import { WorkflowProvider } from './context/WorkflowContext';
import { UserRole } from './types/auth';

export type AppView =
  | 'login'
  | 'student-dashboard'
  | 'faculty-dashboard'
  | 'principal-dashboard'
  | 'dean-dashboard'
  | 'hod-dashboard'
  | 'basic-science-dashboard'
  | 'dept-coordinator-dashboard';

function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [, setActiveRole] = useState<UserRole>('Student');

  const handleLoginSuccess = (role: UserRole) => {
    setActiveRole(role);
    switch (role) {
      case 'Principal':
        setCurrentView('principal-dashboard');
        break;
      case 'Dean':
        setCurrentView('dean-dashboard');
        break;
      case 'HOD':
        setCurrentView('hod-dashboard');
        break;
      case 'Basic Science Coordinator':
        setCurrentView('basic-science-dashboard');
        break;
      case 'Department Coordinator':
        setCurrentView('dept-coordinator-dashboard');
        break;
      case 'Faculty':
        setCurrentView('faculty-dashboard');
        break;
      case 'Student':
      default:
        setCurrentView('student-dashboard');
        break;
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
      onNavigateToClassSchedule={() => setCurrentView('student-dashboard')}
    />
  );
}

export default function App() {
  return (
    <WorkflowProvider>
      <AppContent />
    </WorkflowProvider>
  );
}
