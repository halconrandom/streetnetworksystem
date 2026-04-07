import { createContext, useContext, useMemo } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';

interface AuthUser {
  username: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();

  const user = useMemo<AuthUser | null>(() => {
    if (!clerkUser) return null;
    return {
      username: clerkUser.username || clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress || 'admin',
      role: 'admin',
    };
  }, [clerkUser]);

  const logout = async () => {
    await signOut({ redirectUrl: '/sign-in' });
  };

  return (
    <AuthContext.Provider value={{ user, loading: !isLoaded, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
