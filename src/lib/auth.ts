// auth.ts

import { storeToken, removeToken, getToken, API_BASE_URL, authFetch } from './api'; // Se importa authFetch

// URL para el endpoint de autenticación, construida con la base
const AUTH_ENDPOINT = `${API_BASE_URL}/auth`;
// Modo mock para pruebas sin backend (se recomienda dejar inactivo en integración real)
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH !== 'false';

// ============================================================================
// INTERFACES (COINCIDENCIA EXACTA CON DTOs DEL BACKEND)
// ============================================================================

export interface LoginRequest {
    username: string;
    password: string;
}

export interface AuthResponse {
    jwtToken: string;
    welcomeMessage: string;
    expirationTime: string;
}

export interface AuthError {
    message: string;
    remainingAttempts?: number;
    isBlocked?: boolean;
}

// ============================================================================
// LÓGICA DE SEGURIDAD Y INTENTOS FALLIDOS (IMPLEMENTA HU-003.2)
// ============================================================================

// Gestión de intentos fallidos
const FAILED_ATTEMPTS_KEY = 'auth_failed_attempts';
const BLOCK_UNTIL_KEY = 'auth_block_until';
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos

class AuthService {
    private failedAttempts: Map<string, number> = new Map();
    private blockUntil: Map<string, number> = new Map();

    constructor() {
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
            ip: 'client'
        };

        const logs = JSON.parse(localStorage.getItem('auth_logs') || '[]');
        logs.push(event);
        if (logs.length > 100) logs.shift();
        localStorage.setItem('auth_logs', JSON.stringify(logs));

        console.log('[AUTH LOG]', event);
    }

    private async mockLogin(credentials: LoginRequest): Promise<AuthResponse> {
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 500));

        // Usuarios válidos en modo mock
        const validUsers: Record<string, string> = {
            'admin': 'admin123',
            'supervisor': 'supervisor123',
            'usuario1': 'contraseña123'
        };

        // Validar credenciales
        if (validUsers[credentials.username] && validUsers[credentials.username] === credentials.password) {
            // Login exitoso
            const mockToken = `mock_jwt_token_${Date.now()}_${credentials.username}`;
            this.resetFailedAttempts(credentials.username);
            storeToken(mockToken);
            localStorage.setItem('auth_username', credentials.username);
            localStorage.setItem('last_activity', Date.now().toString());
            this.logEvent('LOGIN_SUCCESS', credentials.username, 'Inicio de sesión exitoso (MODO MOCK)');

            return {
                jwtToken: mockToken,
                welcomeMessage: `¡Bienvenido, ${credentials.username}! (Modo desarrollo)`,
                expirationTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
            };
        } else {
            // Credenciales incorrectas
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
    }

    async login(credentials: LoginRequest): Promise<AuthResponse> {
        if (this.isBlocked(credentials.username)) {
            const timeRemaining = Math.ceil(this.getBlockTimeRemaining(credentials.username) / 60000);
            throw {
                message: `Cuenta bloqueada por intentos fallidos. Intente nuevamente en ${timeRemaining} minutos.`,
                isBlocked: true
            } as AuthError;
        }

        // 🟢 MODO MOCK: Si está activado, usar autenticación mock
        if (USE_MOCK_AUTH) {
            return this.mockLogin(credentials);
        }

        try {
            const response = await fetch(`${AUTH_ENDPOINT}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: credentials.username,
                    password: credentials.password
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText || 'Error de red' }));

                const attempts = this.recordFailedAttempt(credentials.username);
                const remaining = MAX_ATTEMPTS - attempts;

                if (remaining > 0) {
                    throw {
                        message: errorData.message || `Credenciales incorrectas. Le quedan ${remaining} intento${remaining > 1 ? 's' : ''}.`,
                        remainingAttempts: remaining
                    } as AuthError;
                } else {
                    throw {
                        message: errorData.message || 'Cuenta bloqueada por intentos fallidos.',
                        isBlocked: true,
                        remainingAttempts: 0
                    } as AuthError;
                }
            }

            const responseData: AuthResponse = await response.json();

            if (!responseData.jwtToken) {
                console.error('❌ No se recibió jwtToken del backend. Estructura recibida:', responseData);
                throw new Error('No se recibió token JWT del servidor en el formato esperado.');
            }

            this.resetFailedAttempts(credentials.username);
            storeToken(responseData.jwtToken);
            localStorage.setItem('auth_username', credentials.username);
            localStorage.setItem('last_activity', Date.now().toString());

            this.logEvent('LOGIN_SUCCESS', credentials.username, 'Inicio de sesión exitoso');

            return responseData;

        } catch (error) {
            if ((error as AuthError).message) {
                throw error;
            }

            this.recordFailedAttempt(credentials.username);
            throw {
                message: 'Error de conexión. El servidor no está disponible.',
                remainingAttempts: this.getRemainingAttempts(credentials.username)
            } as AuthError;
        }
    }

    // 🟢 FUNCIÓN LOGOUT MODIFICADA PARA REVOCAR TOKEN EN EL SERVIDOR
    async logout(username?: string) {
        const user = username || localStorage.getItem('auth_username') || 'unknown';

        // 1. Llamada al backend para invalidar el token (RevocationService)
        try {
            // Usamos authFetch, que automáticamente agrega el token JWT al header
            // El backend recibe el token y lo revoca.
            await authFetch(`${AUTH_ENDPOINT}/logout`, {
                method: 'POST',
                // No se necesita body ni Content-Type, solo el token en el header
            });
            console.log('✅ Token JWT revocado en el servidor.');
        } catch (error) {
            // Advertencia: si el token ya expiró, esta llamada fallará (ej. 401/403).
            // Esto es normal y la limpieza local debe continuar.
            console.warn('Advertencia al revocar token (posiblemente ya expirado):', error);
        }

        // 2. Limpieza local (remover token, usuario, etc.)
        removeToken();
        localStorage.removeItem('auth_username');
        localStorage.removeItem('last_activity');

        this.logEvent('LOGOUT', user, 'Cierre de sesión');
    }

    // ... (El resto de funciones auxiliares)

    logoutByInactivity(username?: string) {
        const user = username || localStorage.getItem('auth_username') || 'unknown';
        this.logout(username);
        this.logEvent('SESSION_EXPIRED', user, 'Sesión cerrada por inactividad');
    }

    isAuthenticated(): boolean {
        return !!getToken();
    }

    getUsername(): string | null {
        return localStorage.getItem('auth_username');
    }

    getToken(): string | null {
        return getToken();
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