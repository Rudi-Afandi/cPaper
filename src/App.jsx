import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { theme } from './lib/theme';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: theme.colors.background.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 14, color: theme.colors.text.tertiary }}>Loading...</div>
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