import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, LoginRequest, LoginResponse, AuthError } from '@/lib/auth';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [username, setUsername] = useState(authService.getUsername());
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Verificar inactividad
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkInactivity = () => {
      const lastActivity = authService.getLastActivity();
      const now = Date.now();
      
      if (now - lastActivity > INACTIVITY_TIMEOUT) {
        toast.error('Su sesión ha expirado por inactividad');
        authService.logoutByInactivity(username || undefined);
        setIsAuthenticated(false);
        setUsername(null);
        navigate('/login');
      }
    };

    // Verificar cada minuto
    const interval = setInterval(checkInactivity, 60000);

    // Actualizar actividad en eventos del usuario
    const updateActivity = () => {
      authService.updateActivity();
    };

    window.addEventListener('click', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('mousemove', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('mousemove', updateActivity);
    };
  }, [isAuthenticated, navigate, username]);

  const login = useCallback(async (credentials: LoginRequest): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response: LoginResponse = await authService.login(credentials);
      setIsAuthenticated(true);
      setUsername(credentials.username);
      toast.success(response.message || `¡Bienvenido de vuelta, ${credentials.username}!`);
      return true;
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout(username || undefined);
    setIsAuthenticated(false);
    setUsername(null);
    navigate('/login');
    toast.info('Ha cerrado sesión correctamente');
  }, [navigate, username]);

  return {
    isAuthenticated,
    username,
    isLoading,
    login,
    logout
  };
};
