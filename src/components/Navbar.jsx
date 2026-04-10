import { Button } from '@heroui/react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <div className="h-12 w-full flex items-center justify-between px-4 zed-bg-secondary border-b border-zed-border">
      <div className="flex items-center gap-4">
        <span className="zed-text-secondary text-sm font-mono">
          {user?.email}
        </span>
      </div>
      <Button
        variant="flat"
        color="danger"
        size="sm"
        onPress={logout}
        className="zed-button danger"
      >
        Logout
      </Button>
    </div>
  );
}
