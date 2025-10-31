// Servicio de autenticación para conectar con el backend TelcoNova
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8080/api/auth';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  message?: string;
}

export interface AuthError {
  message: string;
  remainingAttempts?: number;
  isBlocked?: boolean;
}

// Gestión de intentos fallidos
const FAILED_ATTEMPTS_KEY = 'auth_failed_attempts';
const BLOCK_UNTIL_KEY = 'auth_block_until';
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos

class AuthService {
  private failedAttempts: Map<string, number> = new Map();
  private blockUntil: Map<string, number> = new Map();

  constructor() {
    // Cargar intentos fallidos desde localStorage
    const stored = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    if (stored) {
      this.failedAttempts = new Map(JSON.parse(stored));
    }
    const blocked = localStorage.getItem(BLOCK_UNTIL_KEY);
    if (blocked) {
      this.blockUntil = new Map(JSON.parse(blocked));
    }
  }

  private saveState() {
    localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify([...this.failedAttempts]));
    localStorage.setItem(BLOCK_UNTIL_KEY, JSON.stringify([...this.blockUntil]));
  }

  isBlocked(username: string): boolean {
    const blockTime = this.blockUntil.get(username);
    if (blockTime && Date.now() < blockTime) {
      return true;
    }
    if (blockTime && Date.now() >= blockTime) {
      // Desbloquear
      this.blockUntil.delete(username);
      this.failedAttempts.delete(username);
      this.saveState();
    }
    return false;
  }

  getBlockTimeRemaining(username: string): number {
    const blockTime = this.blockUntil.get(username);
    if (!blockTime) return 0;
    return Math.max(0, blockTime - Date.now());
  }

  private recordFailedAttempt(username: string) {
    const attempts = (this.failedAttempts.get(username) || 0) + 1;
    this.failedAttempts.set(username, attempts);
    
    if (attempts >= MAX_ATTEMPTS) {
      this.blockUntil.set(username, Date.now() + BLOCK_DURATION);
      this.logEvent('ACCOUNT_BLOCKED', username, 'Cuenta bloqueada por intentos fallidos');
    } else {
      this.logEvent('LOGIN_FAILED', username, `Intento fallido ${attempts}/${MAX_ATTEMPTS}`);
    }
    
    this.saveState();
    return attempts;
  }

  private resetFailedAttempts(username: string) {
    this.failedAttempts.delete(username);
    this.blockUntil.delete(username);
    this.saveState();
  }

  getRemainingAttempts(username: string): number {
    const attempts = this.failedAttempts.get(username) || 0;
    return Math.max(0, MAX_ATTEMPTS - attempts);
  }

  private logEvent(eventType: string, username: string, description: string) {
    const event = {
      fecha: new Date().toISOString(),
      hora: new Date().toLocaleTimeString('es-ES'),
      usuario: username,
      tipoEvento: eventType,
      descripcion: description,
      ip: 'client' // En producción, esto vendría del backend
    };

    // Guardar en localStorage (en producción sería enviado al backend)
    const logs = JSON.parse(localStorage.getItem('auth_logs') || '[]');
    logs.push(event);
    // Mantener solo los últimos 100 registros
    if (logs.length > 100) logs.shift();
    localStorage.setItem('auth_logs', JSON.stringify(logs));

    console.log('[AUTH LOG]', event);
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Verificar si la cuenta está bloqueada
    if (this.isBlocked(credentials.username)) {
      const timeRemaining = Math.ceil(this.getBlockTimeRemaining(credentials.username) / 60000);
      throw {
        message: `Cuenta bloqueada por intentos fallidos. Intente nuevamente en ${timeRemaining} minutos.`,
        isBlocked: true
      } as AuthError;
    }

    try {
      const response = await fetch(`${AUTH_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        // Login fallido
        const attempts = this.recordFailedAttempt(credentials.username);
        const remaining = MAX_ATTEMPTS - attempts;
        
        if (remaining > 0) {
          throw {
            message: `Credenciales incorrectas. Le quedan ${remaining} intento${remaining > 1 ? 's' : ''}.`,
            remainingAttempts: remaining
          } as AuthError;
        } else {
          throw {
            message: 'Cuenta bloqueada por intentos fallidos.',
            isBlocked: true,
            remainingAttempts: 0
          } as AuthError;
        }
      }

      const data: LoginResponse = await response.json();
      
      // Login exitoso - resetear intentos fallidos
      this.resetFailedAttempts(credentials.username);
      
      // Guardar token y usuario
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_username', credentials.username);
      localStorage.setItem('last_activity', Date.now().toString());
      
      this.logEvent('LOGIN_SUCCESS', credentials.username, 'Inicio de sesión exitoso');
      
      return data;
    } catch (error) {
      if ((error as AuthError).message) {
        throw error;
      }
      // Error de red o del servidor
      this.recordFailedAttempt(credentials.username);
      throw {
        message: 'Error al conectar con el servidor. Intente nuevamente.',
        remainingAttempts: this.getRemainingAttempts(credentials.username)
      } as AuthError;
    }
  }

  logout(username?: string) {
    const user = username || localStorage.getItem('auth_username') || 'unknown';
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('last_activity');
    
    this.logEvent('LOGOUT', user, 'Cierre de sesión');
  }

  logoutByInactivity(username?: string) {
    const user = username || localStorage.getItem('auth_username') || 'unknown';
    this.logout(username);
    this.logEvent('SESSION_EXPIRED', user, 'Sesión cerrada por inactividad');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getUsername(): string | null {
    return localStorage.getItem('auth_username');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  updateActivity() {
    localStorage.setItem('last_activity', Date.now().toString());
  }

  getLastActivity(): number {
    const activity = localStorage.getItem('last_activity');
    return activity ? parseInt(activity) : 0;
  }
}

export const authService = new AuthService();
