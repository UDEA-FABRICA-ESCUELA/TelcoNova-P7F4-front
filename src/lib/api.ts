// Mock API implementation using localStorage for template management

export interface Template {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplatePayload {
  name: string;
  content: string;
}

export interface UpdateTemplatePayload {
  name?: string;
  content?: string;
}

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
  { name: 'id_orden', description: 'ID de la orden' },
  { name: 'fecha_entrega', description: 'Fecha de entrega' },
  { name: 'producto', description: 'Nombre del producto' },
  { name: 'cantidad', description: 'Cantidad del producto' },
  { name: 'precio_total', description: 'Precio total' },
  { name: 'direccion', description: 'Dirección de entrega' },
  { name: 'telefono', description: 'Teléfono de contacto' },
  { name: 'email', description: 'Correo electrónico' },
  { name: 'estado_orden', description: 'Estado de la orden' },
  // Agregar más variables aquí siguiendo el mismo formato
  // { name: 'nueva_variable', description: 'Descripción de la nueva variable' },
];

const STORAGE_KEY = 'template_management_templates';

// Utility function to simulate API delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get templates from localStorage
function getStoredTemplates(): Template[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading templates from localStorage:', error);
    return [];
  }
}

// Save templates to localStorage
function saveTemplates(templates: Template[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving templates to localStorage:', error);
  }
}

// Generate unique ID for new templates
function generateId(): string {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

// API Functions

export async function listTemplates(): Promise<Template[]> {
  await delay(300); // Simulate network delay
  return getStoredTemplates();
}

export async function getTemplate(id: string): Promise<Template | null> {
  await delay(200);
  const templates = getStoredTemplates();
  return templates.find(template => template.id === id) || null;
}

export async function createTemplate(payload: CreateTemplatePayload): Promise<Template> {
  await delay(500);
  
  // Validate template content
  const validation = validateTemplateContent(payload.content);
  if (!validation.isValid) {
    throw new Error(`Errores de validación: ${validation.errors.join(', ')}`);
  }

  const templates = getStoredTemplates();
  
  // Check for duplicate names
  if (templates.some(template => template.name.toLowerCase() === payload.name.toLowerCase())) {
    throw new Error('Ya existe una plantilla con ese nombre');
  }

  const newTemplate: Template = {
    id: generateId(),
    name: payload.name.trim(),
    content: payload.content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedTemplates = [...templates, newTemplate];
  saveTemplates(updatedTemplates);

  return newTemplate;
}

export async function updateTemplate(id: string, payload: UpdateTemplatePayload): Promise<Template> {
  await delay(400);
  
  const templates = getStoredTemplates();
  const templateIndex = templates.findIndex(template => template.id === id);
  
  if (templateIndex === -1) {
    throw new Error('Plantilla no encontrada');
  }

  // Validate content if provided
  if (payload.content !== undefined) {
    const validation = validateTemplateContent(payload.content);
    if (!validation.isValid) {
      throw new Error(`Errores de validación: ${validation.errors.join(', ')}`);
    }
  }

  // Check for duplicate names if name is being updated
  if (payload.name && payload.name !== templates[templateIndex].name) {
    if (templates.some(template => template.id !== id && template.name.toLowerCase() === payload.name!.toLowerCase())) {
      throw new Error('Ya existe una plantilla con ese nombre');
    }
  }

  const updatedTemplate: Template = {
    ...templates[templateIndex],
    ...payload,
    name: payload.name?.trim() || templates[templateIndex].name,
    updatedAt: new Date().toISOString(),
  };

  templates[templateIndex] = updatedTemplate;
  saveTemplates(templates);

  return updatedTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
  await delay(300);
  
  const templates = getStoredTemplates();
  const filteredTemplates = templates.filter(template => template.id !== id);
  
  if (filteredTemplates.length === templates.length) {
    throw new Error('Plantilla no encontrada');
  }

  saveTemplates(filteredTemplates);
}

// Initialize with sample data if localStorage is empty
export function initializeSampleData(): void {
  const templates = getStoredTemplates();
  
  if (templates.length === 0) {
    const sampleTemplates: Template[] = [
      {
        id: 'sample_1',
        name: 'Confirmación de Pedido',
        content: 'Hola {nombre_cliente}, tu pedido #{id_orden} ha sido confirmado. El producto {producto} será entregado el {fecha_entrega} en {direccion}. Total a pagar: {precio_total}.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'sample_2',
        name: 'Actualización de Estado',
        content: 'Estimado/a {nombre_cliente}, el estado de tu orden #{id_orden} ha cambiado a: {estado_orden}. Puedes contactarnos al {telefono} para más información.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    
    saveTemplates(sampleTemplates);
  }
}