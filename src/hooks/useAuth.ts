import { useState, useEffect, createContext, useContext } from 'react';
import { useWebSocket } from './useWebSocket';

interface User {
  id: string;
  name: string;
  isHost: boolean;
  isCommentator: boolean;
}

interface AuthHook {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthHook | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { sendMessage, lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'auth_success') {
        setUser(lastMessage.user);
      } else if (lastMessage.type === 'auth_error') {
        setUser(null);
      }
      setLoading(false);
    }
  }, [lastMessage]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    sendMessage({
      type: 'login',
      username,
      password,
    });
  };

  const logout = () => {
    setUser(null);
    sendMessage({ type: 'logout' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 