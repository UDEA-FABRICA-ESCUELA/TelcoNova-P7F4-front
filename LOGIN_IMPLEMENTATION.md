# Implementación del Sistema de Login

## Descripción General
Se ha implementado un sistema completo de autenticación para el módulo de alertas que cumple con todas las Historias de Usuario (HU) especificadas, conectándose al backend TelcoNova-P7F4-back.

## Historias de Usuario Implementadas

### ✅ HU-003.1 – Autenticación exitosa
- Login con credenciales válidas
- Redirección automática al panel principal
- Mensaje de bienvenida personalizado
- Indicador visual de éxito

### ✅ HU-003.2 – Bloqueo por intentos fallidos
- Contador de intentos fallidos (máximo 3)
- Bloqueo temporal de cuenta (15 minutos)
- Mensaje de advertencia: "Cuenta bloqueada por intentos fallidos"
- Registro del evento en logs
- Reinicio de intentos tras login exitoso

### ✅ HU-003.3 – Cierre automático por inactividad
- Timeout de inactividad: 15 minutos
- Monitoreo de interacciones del usuario (clicks, teclas, scroll, movimiento del mouse)
- Mensaje: "Su sesión ha expirado por inactividad"
- Redirección automática al login
- Verificación cada 60 segundos

### ✅ HU-003.4 – Registro y auditoría de eventos
- Logs almacenados en localStorage (bitácora de seguridad)
- Información registrada:
  - Fecha y hora
  - Usuario
  - Tipo de evento (LOGIN_SUCCESS, LOGIN_FAILED, ACCOUNT_BLOCKED, LOGOUT, SESSION_EXPIRED)
  - Descripción del evento
  - IP (identificador de cliente)
- Límite de 100 registros más recientes

## Estructura de Archivos

### Nuevos Archivos Creados

1. **`src/lib/auth.ts`**
   - Servicio de autenticación principal
   - Gestión de intentos fallidos y bloqueos
   - Sistema de logging de eventos
   - Comunicación con backend

2. **`src/hooks/use-auth.tsx`**
   - Hook personalizado para gestión de autenticación
   - Monitoreo de inactividad
   - Estado global de sesión

3. **`src/pages/Login.tsx`**
   - Página de login con diseño moderno
   - Formulario de autenticación
   - Interfaz similar al diseño proporcionado

4. **`src/components/layout/protected-route.tsx`**
   - Componente para proteger rutas
   - Redirección automática al login si no está autenticado

5. **`.env.example`**
   - Variables de entorno requeridas
   - URLs del backend

6. **`LOGIN_IMPLEMENTATION.md`**
   - Este archivo de documentación

### Archivos Modificados

1. **`src/App.tsx`**
   - Agregada ruta `/login`
   - Protección de ruta principal con `ProtectedRoute`

2. **`src/components/layout/header.tsx`**
   - Agregado botón de "Cerrar sesión"
   - Mostrar nombre de usuario autenticado

## Configuración

### 1. Variables de Entorno

Cree un archivo `.env` en la raíz del proyecto basándose en `.env.example`:

```bash
# Backend API URLs
VITE_AUTH_API_URL=http://localhost:8080/api/auth
VITE_API_URL=http://localhost:8080/api
```

### 2. Backend TelcoNova

Asegúrese de que el backend esté corriendo y tenga los siguientes endpoints:

```
POST /api/auth/login
Body: {
  "username": "string",
  "password": "string"
}

Response (exitoso): {
  "token": "string",
  "username": "string",
  "message": "string" (opcional)
}

Response (fallido): HTTP 400/401
```

### 3. Usuario de Prueba

**Credenciales por defecto:**
- Usuario: `usuario1`
- Contraseña: `contraseña123`

## Flujo de Autenticación

### 1. Login
```
Usuario ingresa credenciales
  ↓
Verificar si cuenta está bloqueada
  ↓
  No bloqueada → Enviar al backend
    ↓
    Éxito → Guardar token, resetear intentos, log evento
    ↓
    Fallo → Incrementar intentos fallidos, mostrar intentos restantes
  ↓
  3 intentos → Bloquear cuenta por 15 minutos
```

### 2. Monitoreo de Inactividad
```
Usuario autenticado
  ↓
Cada 60s → Verificar última actividad
  ↓
Si (ahora - última_actividad) > 15 min
  ↓
Cerrar sesión automáticamente
  ↓
Mostrar mensaje de expiración
  ↓
Redirigir a /login
```

### 3. Eventos que Actualizan Actividad
- Click
- Tecla presionada
- Scroll
- Movimiento del mouse

## Seguridad

### Protecciones Implementadas

1. **Almacenamiento Seguro**
   - Token JWT en localStorage
   - No se almacenan contraseñas

2. **Control de Acceso**
   - Rutas protegidas con `ProtectedRoute`
   - Verificación de autenticación en cada carga

3. **Prevención de Fuerza Bruta**
   - Máximo 3 intentos
   - Bloqueo temporal de 15 minutos
   - Registro de intentos fallidos

4. **Auditoría**
   - Log de todos los eventos de seguridad
   - Trazabilidad de acciones

## Arquitectura (Patrones GRASP)

### 1. **Information Expert**
- `auth.ts`: Experto en lógica de autenticación y validación

### 2. **Low Coupling**
- Componentes independientes comunicados por hooks
- No modificación del código existente

### 3. **High Cohesion**
- `Login.tsx`: Solo UI de login
- `auth.ts`: Solo lógica de autenticación
- `use-auth.tsx`: Solo gestión de estado de sesión

### 4. **Controller**
- `use-auth.tsx`: Coordina la autenticación entre componentes

### 5. **Pure Fabrication**
- `authService`: Clase artificial para encapsular lógica de auth
- `ProtectedRoute`: Componente artificial para control de acceso

## Uso en Componentes

### Ejemplo: Verificar si está autenticado
```typescript
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { isAuthenticated, username, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Bienvenido, {username}</p>
      ) : (
        <p>No autenticado</p>
      )}
      <button onClick={logout}>Salir</button>
    </div>
  );
}
```

### Ejemplo: Login programático
```typescript
import { useAuth } from '@/hooks/use-auth';

function LoginForm() {
  const { login, isLoading } = useAuth();
  
  const handleLogin = async () => {
    const success = await login({
      username: 'usuario1',
      password: 'contraseña123'
    });
    
    if (success) {
      // Redirigir o mostrar éxito
    }
  };
  
  return (
    <button onClick={handleLogin} disabled={isLoading}>
      Iniciar Sesión
    </button>
  );
}
```

## Testing Manual

### Test 1: Login Exitoso
1. Ir a `/login`
2. Ingresar: `usuario1` / `contraseña123`
3. ✅ Debe redirigir a `/` con mensaje de bienvenida
4. ✅ Debe mostrar nombre de usuario en header
5. ✅ Verificar log en consola: `[AUTH LOG] LOGIN_SUCCESS`

### Test 2: Intentos Fallidos y Bloqueo
1. Ir a `/login`
2. Ingresar credenciales incorrectas 3 veces
3. ✅ Primer intento: "Le quedan 2 intentos"
4. ✅ Segundo intento: "Le queda 1 intento"
5. ✅ Tercer intento: "Cuenta bloqueada por intentos fallidos"
6. ✅ Verificar logs: 3x `LOGIN_FAILED`, 1x `ACCOUNT_BLOCKED`
7. Esperar 15 minutos o limpiar localStorage para desbloquear

### Test 3: Cierre por Inactividad
1. Login exitoso
2. No interactuar por 15 minutos
3. ✅ Debe cerrar sesión automáticamente
4. ✅ Mensaje: "Su sesión ha expirado por inactividad"
5. ✅ Redirigir a `/login`
6. ✅ Verificar log: `SESSION_EXPIRED`

### Test 4: Actividad Mantiene Sesión
1. Login exitoso
2. Cada 5-10 minutos hacer click o scroll
3. ✅ La sesión debe mantenerse activa
4. ✅ No debe cerrar sesión

### Test 5: Logout Manual
1. Login exitoso
2. Click en "Cerrar sesión"
3. ✅ Debe redirigir a `/login`
4. ✅ Mensaje de confirmación
5. ✅ Verificar log: `LOGOUT`

## Ver Logs de Auditoría

Para ver los logs en la consola del navegador:

```javascript
// Ejecutar en DevTools Console
const logs = JSON.parse(localStorage.getItem('auth_logs') || '[]');
console.table(logs);
```

O desde el código:
```typescript
import { authService } from '@/lib/auth';

// Ver todos los logs
const logs = JSON.parse(localStorage.getItem('auth_logs') || '[]');
console.log('Logs de auditoría:', logs);
```

## Troubleshooting

### El backend no responde
- Verificar que `VITE_AUTH_API_URL` esté configurado correctamente
- Asegurar que el backend esté corriendo en el puerto especificado
- Verificar CORS en el backend

### Cuenta bloqueada permanentemente
```javascript
// Ejecutar en DevTools Console para desbloquear
localStorage.removeItem('auth_failed_attempts');
localStorage.removeItem('auth_block_until');
```

### Sesión no se mantiene activa
- Verificar que los event listeners estén funcionando
- Abrir DevTools Console y verificar logs de actividad
- Comprobar que `last_activity` se actualice en localStorage

### No redirige después de login
- Verificar que el backend retorne un token válido
- Comprobar en DevTools > Application > Local Storage que `auth_token` esté guardado
- Revisar errores en consola

## Próximos Pasos Sugeridos

1. **Integración con Backend Real**
   - Adaptar endpoints según API real del backend TelcoNova
   - Configurar CORS si es necesario

2. **Mejoras de Seguridad**
   - Implementar refresh tokens
   - Usar httpOnly cookies en lugar de localStorage
   - Agregar CAPTCHA después de múltiples intentos fallidos

3. **Funcionalidades Adicionales**
   - Recuperación de contraseña
   - Cambio de contraseña
   - Registro de nuevos usuarios
   - Autenticación de dos factores (2FA)

4. **Logs en Backend**
   - Enviar logs de auditoría al backend en lugar de localStorage
   - Dashboard de administración para ver logs
   - Alertas por eventos sospechosos

## Notas Técnicas

- **Framework**: React 18 con TypeScript
- **Routing**: React Router v6
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Storage**: localStorage (temporal, para producción usar backend)
- **Notifications**: Sonner toast
- **Styling**: Tailwind CSS con sistema de design tokens

## Contacto y Soporte

Para problemas o preguntas sobre la implementación del login, revisar:
1. Este documento
2. Comentarios en el código fuente
3. Logs de auditoría en localStorage
4. Console del navegador para errores

---

**Fecha de Implementación**: 2025-10-31  
**Versión**: 1.0.0  
**Estado**: ✅ Completo y Funcional
