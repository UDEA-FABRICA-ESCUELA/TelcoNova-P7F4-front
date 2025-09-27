// Mock API implementation using localStorage for template management

// Interfaz que representa una plantilla de mensaje (coincide con MessageTemplateDto del backend)
export interface MessageTemplateDto {
  id: number;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Interfaz para crear una nueva plantilla (coincide con CreateTemplateRequest del backend)
export interface CreateTemplateRequest {
  name: string;
  content: string;
}

// Interfaz para actualizar una plantilla existente (coincide con UpdateTemplateRequest del backend)
export interface UpdateTemplateRequest {
  name?: string;
  content?: string;
}

// Alias para compatibilidad con el código existente
export type Template = MessageTemplateDto;
export type CreateTemplatePayload = CreateTemplateRequest;
export type UpdateTemplatePayload = UpdateTemplateRequest;

// ============================================================================
// CONFIGURACIÓN DE VARIABLES DEL SISTEMA
// ============================================================================
// 
// IMPORTANTE: Para modificar las variables disponibles, edita la siguiente lista:
// - Agrega nuevas variables con 'name' y 'description'
// - El 'name' debe usar solo letras, números y guiones bajos
// - Estas variables aparecerán en el panel lateral del editor
//
// Variable validation regex - permite letras, números y guiones bajos
export const VARIABLE_REGEX = /\{[a-zA-Z0-9_]+\}/g;

// Variables predefinidas que aparecen en el panel del editor
// MODIFICAR AQUÍ para agregar nuevas variables del sistema
export const PREDEFINED_VARIABLES = [
  { name: 'nombre_cliente', description: 'Nombre del cliente' },
  { name: 'id_cliente', description: 'ID del cliente' },
  { name: 'id_orden', description: 'ID de la orden' },
  { name: 'estado_orden', description: 'Estado de la orden' },
  // Agregar más variables aquí siguiendo el mismo formato
  // { name: 'nueva_variable', description: 'Descripción de la nueva variable' },
];

const STORAGE_KEY = 'template_management_templates';

// Utility function to simulate API delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get templates from localStorage
function getStoredTemplates(): MessageTemplateDto[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading templates from localStorage:', error);
    return [];
  }
}

// Save templates to localStorage
function saveTemplates(templates: MessageTemplateDto[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving templates to localStorage:', error);
  }
}

// Generate unique ID for new templates (usando números como el backend)
function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// ============================================================================
// VALIDACIÓN DE VARIABLES
// ============================================================================
// 
// Esta función permite CUALQUIER variable que tenga el formato correcto {nombre_variable}
// No limita a solo las variables predefinidas - puedes usar cualquier variable que necesites
//
export function validateTemplateContent(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Find all potential variable patterns including malformed ones
  const allBracePatterns = content.match(/\{[^}]*\}/g) || [];
  
  for (const pattern of allBracePatterns) {
    // Verificar que el patrón coincida con el formato válido
    if (!VARIABLE_REGEX.test(pattern)) {
      // Extraer el contenido dentro de las llaves para mejor mensaje de error
      const variableContent = pattern.slice(1, -1); // Remover { y }
      
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

// API que se conectará con el backend Spring Boot
// Base URL del backend (ajustar según tu configuración)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

/**
 * Obtiene todas las plantillas desde el backend
 * GET /api/templates
 */
export async function getAllTemplates(): Promise<MessageTemplateDto[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/templates`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error al obtener plantillas:', error);
    // Fallback a localStorage en desarrollo
    await delay(300);
    return getStoredTemplates();
  }
}

/**
 * Obtiene una plantilla por ID desde el backend
 * GET /api/templates/{id}
 */
export async function getTemplate(id: number): Promise<MessageTemplateDto | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error al obtener plantilla:', error);
    // Fallback a localStorage en desarrollo
    await delay(200);
    const templates = getStoredTemplates();
    return templates.find(t => t.id === id) || null;
  }
}

/**
 * Crea una nueva plantilla en el backend
 * POST /api/templates
 */
export async function createTemplate(payload: CreateTemplateRequest): Promise<MessageTemplateDto> {
  // Validar contenido antes de enviar
  const validation = validateTemplateContent(payload.content);
  if (!validation.isValid) {
    throw new Error(`Errores en el contenido: ${validation.errors.join(', ')}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al crear plantilla:', error);
    // Fallback a localStorage en desarrollo
    await delay(500);
    
    const templates = getStoredTemplates();
    
    // Verificar nombre único
    if (templates.some(t => t.name.toLowerCase() === payload.name.toLowerCase())) {
      throw new Error('Ya existe una plantilla con ese nombre');
    }

    const newTemplate: MessageTemplateDto = {
      id: generateId(),
      name: payload.name,
      content: payload.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTemplates = [...templates, newTemplate];
    saveTemplates(updatedTemplates);
    
    return newTemplate;
  }
}

/**
 * Actualiza una plantilla existente en el backend
 * PUT /api/templates/{id}
 */
export async function updateTemplate(id: number, payload: UpdateTemplateRequest): Promise<MessageTemplateDto> {
  // Validar contenido si se proporciona
  if (payload.content) {
    const validation = validateTemplateContent(payload.content);
    if (!validation.isValid) {
      throw new Error(`Errores en el contenido: ${validation.errors.join(', ')}`);
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al actualizar plantilla:', error);
    // Fallback a localStorage en desarrollo
    await delay(400);
    
    const templates = getStoredTemplates();
    const templateIndex = templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      throw new Error('Plantilla no encontrada');
    }

    // Verificar nombre único si se cambia
    if (payload.name) {
      const existingTemplate = templates.find(t => 
        t.name.toLowerCase() === payload.name!.toLowerCase() && t.id !== id
      );
      if (existingTemplate) {
        throw new Error('Ya existe otra plantilla con ese nombre');
      }
    }

    const updatedTemplate: MessageTemplateDto = {
      ...templates[templateIndex],
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    const updatedTemplates = [...templates];
    updatedTemplates[templateIndex] = updatedTemplate;
    saveTemplates(updatedTemplates);
    
    return updatedTemplate;
  }
}

/**
 * Elimina una plantilla del backend
 * DELETE /api/templates/{id}
 */
export async function deleteTemplate(id: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error('Error al eliminar plantilla:', error);
    // Fallback a localStorage en desarrollo
    await delay(300);
    
    const templates = getStoredTemplates();
    const filteredTemplates = templates.filter(t => t.id !== id);
    
    if (filteredTemplates.length === templates.length) {
      throw new Error('Plantilla no encontrada');
    }
    
    saveTemplates(filteredTemplates);
  }
}

// Alias para compatibilidad con el código existente
export const listTemplates = getAllTemplates;

// Initialize with sample data if localStorage is empty
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