import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Spinner } from '@heroui/react';
import { theme } from './lib/theme';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: theme.colors.background.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <div style={{ minHeight: '100vh', background: theme.colors.background.primary, color: theme.colors.text.primary }}>
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;