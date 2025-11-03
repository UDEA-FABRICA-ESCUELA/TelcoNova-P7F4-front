// api.ts

// ============================================================================
// CONFIGURACIÓN DE BASE URL Y AUTHENTICACIÓN
// ============================================================================

// Exportar la API_BASE_URL para que auth.ts y otros módulos puedan usarla.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const TOKEN_STORAGE_KEY = 'telconova_auth_token';

// ============================================================================
// GESTIÓN DE TOKEN JWT
// ============================================================================

// Guardar token en localStorage
export function storeToken(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

// Obtener token desde localStorage
export function getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
}

// Eliminar token (para logout)
export function removeToken(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
}

// Verificar si hay un token guardado
export function hasToken(): boolean {
    return getToken() !== null;
}

// ============================================================================
// FUNCIÓN UTILITARIA PARA FETCH CON AUTENTICACIÓN (authFetch)
// ============================================================================
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getToken();

    // Solución al error de ESLint: definir headers como Record<string, string>
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    // Agregar Authorization header si existe el token
    if (token) {
        // Formato requerido: Bearer [token]
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Manejo de expiración de sesión/token revocado (HU-003.3)
    // Limpiar sesión local si el token es rechazado
    if (response.status === 401 || response.status === 403) {
        removeToken();
    }

    return response;
}


// ============================================================================
// INTERFACES HU-02: PLANTILLAS (MessageTemplateController)
// ============================================================================

// Coincide con MessageTemplateDto del backend
export interface MessageTemplateDto {
    id: number;
    name: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

// Coincide con CreateTemplateRequest del backend
export interface CreateTemplateRequest {
    name: string;
    content: string;
}

// Coincide con UpdateTemplateRequest del backend
export interface UpdateTemplateRequest {
    name?: string;
    content?: string;
}

// Alias para compatibilidad
export type Template = MessageTemplateDto;
export type CreateTemplatePayload = CreateTemplateRequest;
export type UpdateTemplatePayload = UpdateTemplateRequest;


// ============================================================================
// INTERFACES HU-04: NOTIFICACIONES Y ALERTAS (AlertRuleController & NotificationController)
// ============================================================================

// Tipo para los estados de notificación (coincide con el Enum del backend)
export type NotificationStatusDTO = 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED';

// Coincide con AlertRuleDto del backend
export interface AlertRuleDto {
    id: number;
    name: string;
    description: string;
    triggerEvent: string; // Ej: 'ORDER_STATUS_CHANGED'
    channel: string; // Ej: 'EMAIL', 'SMS', 'WHATSAPP'
    templateId: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    targetAudience: string;
}

// Coincide con CreateAlertRuleRequest del backend
export interface CreateAlertRuleRequest {
    name: string;
    description: string;
    eventTrigger: string;
    templateId: number;
    targetAudience: string;
    channel: string;
}

// Coincide con NotificationDTO del backend
export interface NotificationDTO {
    id: number;
    recipient: string;
    subject: string;
    content: string;
    channel: string;
    status: NotificationStatusDTO; // Usamos el tipo definido arriba
    sentAt: string;
    alertRuleId: number | null;
}


// ============================================================================
// CONFIGURACIÓN DE VARIABLES DEL SISTEMA (HU-001)
// ============================================================================

// Variable validation regex - permite letras, números y guiones bajos
export const VARIABLE_REGEX = /\{[a-zA-Z0-9_]+\}/g;

// Variables predefinidas que aparecen en el panel del editor
export const PREDEFINED_VARIABLES = [
    { name: 'nombre_cliente', description: 'Nombre del cliente' },
    { name: 'id_cliente', description: 'ID del cliente' },
    { name: 'id_orden', description: 'ID de la orden' },
    { name: 'estado_orden', description: 'Estado de la orden' },
];

const STORAGE_KEY = 'template_management_templates';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Funciones utilitarias de LocalStorage (Mantener)
function getStoredTemplates(): MessageTemplateDto[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error reading templates from localStorage:', error);
        return [];
    }
}

function saveTemplates(templates: MessageTemplateDto[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
        console.error('Error saving templates to localStorage:', error);
    }
}

function generateId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// ============================================================================
// VALIDACIÓN DE VARIABLES (HU-001)
// ============================================================================
export function validateTemplateContent(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const allBracePatterns = content.match(/\{[^}]*\}/g) || [];

    for (const pattern of allBracePatterns) {
        if (!VARIABLE_REGEX.test(pattern)) {
            const variableContent = pattern.slice(1, -1);
            if (variableContent === '') {
                errors.push(`Variable vacía: ${pattern}. Las variables no pueden estar vacías.`);
            } else if (!/^[a-zA-Z0-9_]+$/.test(variableContent)) {
                errors.push(`Variable inválida: ${pattern}. Las variables solo pueden contener letras, números y guiones bajos.`);
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}


// ============================================================================
// FUNCIONES API DE GESTIÓN DE PLANTILLAS (HU-002)
// ============================================================================

/**
 * Obtiene todas las plantillas desde el backend (GET /api/v1/templates)
 */
export async function getAllTemplates(): Promise<MessageTemplateDto[]> {
    try {
        const response = await authFetch(`${API_BASE_URL}/templates`);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error al obtener plantillas:', error);
        throw error;
    }
}

/**
 * Obtiene una plantilla por ID desde el backend (GET /api/v1/templates/{id})
 */
export async function getTemplate(id: number): Promise<MessageTemplateDto | null> {
    try {
        const response = await authFetch(`${API_BASE_URL}/templates/${id}`);
        if (response.status === 404) {
            return null;
        }
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error al obtener plantilla:', error);
        throw error;
    }
}

/**
 * Crea una nueva plantilla en el backend (POST /api/v1/templates)
 */
export async function createTemplate(payload: CreateTemplateRequest): Promise<MessageTemplateDto> {
    const validation = validateTemplateContent(payload.content);
    if (!validation.isValid) {
        throw new Error(`Errores en el contenido: ${validation.errors.join(', ')}`);
    }

    try {
        const response = await authFetch(`${API_BASE_URL}/templates`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error al crear plantilla:', error);
        throw error;
    }
}

/**
 * Actualiza una plantilla existente en el backend (PUT /api/v1/templates/{id})
 */
export async function updateTemplate(id: number, payload: UpdateTemplateRequest): Promise<MessageTemplateDto> {
    if (payload.content) {
        const validation = validateTemplateContent(payload.content);
        if (!validation.isValid) {
            throw new Error(`Errores en el contenido: ${validation.errors.join(', ')}`);
        }
    }

    try {
        const response = await authFetch(`${API_BASE_URL}/templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error al actualizar plantilla:', error);
        throw error;
    }
}

/**
 * Elimina una plantilla del backend (DELETE /api/v1/templates/{id})
 */
export async function deleteTemplate(id: number): Promise<void> {
    try {
        const response = await authFetch(`${API_BASE_URL}/templates/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('Error al eliminar plantilla:', error);
        throw error;
    }
}

// Alias para compatibilidad con el código existente
export const listTemplates = getAllTemplates;


// ============================================================================
// FUNCIONES API HU-04: GESTIÓN DE REGLAS DE ALERTA (AlertRuleController)
// ============================================================================

const ALERTS_ENDPOINT = `${API_BASE_URL}/alert-rules`;

/**
 * Obtiene todas las reglas de alerta. (HU-04)
 * GET /api/v1/alert-rules
 */
export async function getAllAlertRules(): Promise<AlertRuleDto[]> {
    try {
        const response = await authFetch(ALERTS_ENDPOINT);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error al obtener reglas de alerta:', error);
        throw error;
    }
}

/**
 * Crea una nueva regla de alerta. (HU-04)
 * POST /api/v1/alert-rules
 */
export async function createAlertRule(payload: CreateAlertRuleRequest): Promise<AlertRuleDto> {
    try {
        const response = await authFetch(ALERTS_ENDPOINT, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error al crear regla de alerta:', error);
        throw error;
    }
}

/**
 * Elimina una regla de alerta por ID. (HU-04)
 * DELETE /api/v1/alert-rules/{id}
 */
export async function deleteAlertRule(id: number): Promise<void> {
    try {
        const response = await authFetch(`${ALERTS_ENDPOINT}/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('Error al eliminar regla de alerta:', error);
        throw error;
    }
}

export async function updateAlertRule(id: number, payload: CreateAlertRuleRequest): Promise<AlertRuleDto> {
    try {
        const response = await authFetch(`${ALERTS_ENDPOINT}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error al actualizar regla de alerta:', error);
        throw error;
    }
}

export async function activateAlertRule(id: number): Promise<AlertRuleDto> {
    try {
        const response = await authFetch(`${ALERTS_ENDPOINT}/${id}/activate`, {
            method: 'PATCH',
            // PATCH no requiere body, pero algunos backends lo exigen.
            // Para un PATCH de activación/desactivación, un body vacío o nulo suele ser suficiente.
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error al activar regla de alerta:', error);
        throw error;
    }
}

/**
 * Desactiva una regla de alerta por ID. (HU-04)
 * PATCH /api/v1/alert-rules/{id}/deactivate
 */
export async function deactivateAlertRule(id: number): Promise<AlertRuleDto> {
    try {
        const response = await authFetch(`${ALERTS_ENDPOINT}/${id}/deactivate`, {
            method: 'PATCH',
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error al desactivar regla de alerta:', error);
        throw error;
    }
}


// ============================================================================
// FUNCIONES API HU-04: HISTORIAL DE NOTIFICACIONES (NotificationsController)
// ============================================================================

const NOTIFICATIONS_ENDPOINT = `${API_BASE_URL}/notifications`;

/**
 * Obtiene el historial de notificaciones enviadas. (HU-04)
 * GET /api/v1/notifications
 */
export async function getNotificationHistory(): Promise<NotificationDTO[]> {
    try {
        const response = await authFetch(NOTIFICATIONS_ENDPOINT);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error al obtener historial de notificaciones:', error);
        throw error;
    }
}


// ============================================================================
// INICIALIZACIÓN DE DATOS (Opcional en entorno de desarrollo)
// ============================================================================

// Inicialización de datos de muestra (útil en desarrollo)
export function initializeSampleData(): void {
    const templates = getStoredTemplates();

    if (templates.length === 0) {
        const sampleTemplates: MessageTemplateDto[] = [
            {
                id: 1,
                name: 'Confirmación de Pedido',
                content: 'Hola {nombre_cliente}, tu pedido #{id_orden} ha sido confirmado. El estado actual es: {estado_orden}.',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 2,
                name: 'Actualización de Estado',
                content: 'Estimado/a {nombre_cliente} (ID: {id_cliente}), el estado de tu orden #{id_orden} ha cambiado a: {estado_orden}.',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ];

        saveTemplates(sampleTemplates);
    }
}

// ============================================================================
// FUNCIONES API HU-04: ESTADÍSTICAS DE NOTIFICACIONES (NotificationsController)
// ============================================================================

// 🟢 CORRECCIÓN CLAVE: La interfaz debe reflejar los nombres que el Backend realmente devuelve.
// Coincide con NotificationStatusDTO del backend
export interface NotificationStatsDto {
    totalEnviado: number; // Coincide con el Backend
    totalPendiente: number; // Coincide con el Backend
    totalFallido: number; // Coincide con el Backend
    totalProcesando: number; // Coincide con el Backend
    tazaExito: number; // Coincide con el Backend
}

/**
 * Obtiene las estadísticas de la cola de notificaciones. (HU-04)
 * GET /api/v1/notifications/stats
 */
export async function getNotificationStats(): Promise<NotificationStatsDto> {
    try {
        const response = await authFetch(`${NOTIFICATIONS_ENDPOINT}/stats`);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error al obtener estadísticas de notificación:', error);
        throw error;
    }
}
