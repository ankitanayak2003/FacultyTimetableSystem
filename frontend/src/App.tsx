import { useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';

export default function App() {
  const [currentView, setCurrentView] = useState<'student-dashboard' | 'login'>('student-dashboard');

  if (currentView === 'student-dashboard') {
    return <StudentDashboard onLogout={() => setCurrentView('login')} />;
  }

  return (
    <LoginPage
      onLoginAsStudent={() => setCurrentView('student-dashboard')}
    />
  );
}
