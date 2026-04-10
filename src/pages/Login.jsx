import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { theme } from '../lib/theme';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, color: theme.colors.text.primary }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>CPAPER</h1>
          <p style={{ opacity: theme.opacity.disabled, fontSize: 14 }}>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: `${theme.spacing.md}px ${theme.spacing.lg}px`, borderRadius: theme.radius.md, border: `1px solid ${theme.colors.border.primary}`, background: theme.colors.background.secondary, color: theme.colors.text.primary, fontSize: 14, outline: 'none' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: `${theme.spacing.md}px ${theme.spacing.lg}px`, borderRadius: theme.radius.md, border: `1px solid ${theme.colors.border.primary}`, background: theme.colors.background.secondary, color: theme.colors.text.primary, fontSize: 14, outline: 'none' }}
          />
          {error && (
            <p style={{ color: theme.colors.text.danger, fontSize: 13 }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            style={{ padding: `${theme.spacing.md}px`, borderRadius: theme.radius.md, border: 'none', background: theme.colors.button.primary, color: theme.colors.text.inverse, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: isLoading ? theme.opacity.disabled : 1 }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}