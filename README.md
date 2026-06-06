# Plataforma de Gestión de Activos Tecnológicos - DAE ACTIVA

Esta plataforma es una solución empresarial avanzada desarrollada para la gestión de activos fijos de hardware. El objetivo primordial es erradicar la "responsabilidad difusa" mediante un control exhaustivo de transiciones de estado inmutables y la aplicación de reglas financieras directas (D1, D2 y D3).

---

## Stack Tecnológico

* **Frontend:** Next.js (React 18) con Tailwind CSS para una interfaz premium de modo oscuro y micro-animaciones.
* **Backend:** Flask (Python) con control rígido de estados y trazabilidad.
* **Persistencia:** Archivo JSON estructurado (`backend/database.json`) para inspección inmediata de persistencia física en tiempo real.

---

## Estructura del Ciclo de Vida del Activo (Trazabilidad Inmutable)

El sistema hace un seguimiento de los activos separando explícitamente el **Custodio Físico** (posesión material) del **Responsable Administrativo** (responsabilidad civil/legal) en cada transición.

### Estados Soportados:
1. `En Bodega` &rarr; Stock inicial
2. `En Tránsito (Bodega-TI)` &rarr; Despachado por Bodega (D1)
3. `En Configuración` &rarr; Recibido físicamente por Técnico
4. `Listo para Entrega` &rarr; Preparación técnica finalizada
5. `Pendiente de Recepción Formal` &rarr; Alerta de retiro enviada (con validación de timeout de retorno automático)
6. `Asignado` &rarr; Colaborador firma acta digital legal
7. `En Diagnóstico` &rarr; Falla física reportada
8. `Pendiente de Decisión` &rarr; Retenido por compuerta D2 (Costo reparación > Nuevo O Vida útil < 6 meses)
9. `Asignado (Extendido)` &rarr; Finanzas aprueba D3 (Extensión de 1 año con control de salud de batería y fallas previas)
10. `Pendiente de Devolución` &rarr; Devolución solicitada por cese de funciones
11. `En Validación Técnica` &rarr; Técnico recibe y formatea
12. `Disponible para Reasignación` &rarr; Activo sanitizado listo para retornar a stock
13. `Incidente Externo` &rarr; Pérdida/Robo registrado con denuncia policial (Carabineros)
14. `Dado de Baja` &rarr; Cierre contable y baja definitiva

---

## Instrucciones de Ejecución

La plataforma cuenta con un script de control automatizado (`control.sh`) en la raíz del proyecto para simplificar la instalación e inicio de todos los componentes.

### 1. Configurar el Proyecto (Instalar dependencias)
Ejecuta el siguiente comando para crear el entorno virtual de Python, instalar las dependencias del backend y configurar las dependencias del frontend usando el Node.js local:
```bash
./control.sh setup
```

### 2. Iniciar Servidores (Backend + Frontend)
Para arrancar el backend de Flask y el servidor de desarrollo de Next.js en paralelo, ejecuta:
```bash
./control.sh start
```
Una vez iniciado:
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Frontend App:** [http://localhost:3000](http://localhost:3000)

*Nota: Presiona `Ctrl+C` en la terminal para apagar ambos servidores de forma segura.*

### 3. Restablecer Base de Datos (Opcional)
Si deseas restaurar los activos y transiciones a su estado de fábrica en cualquier momento, con el servidor en ejecución, abre una terminal y ejecuta:
```bash
./control.sh reset
```

---

## Autenticación y Usuarios de Prueba

El backend usa autenticación por sesión con cookies. El flujo es el siguiente:

1. El frontend hace `POST` a `/api/auth/login` con `username` y `password`.
2. Flask valida las credenciales y responde con una cookie de sesión.
3. Las llamadas posteriores a `/api/assets`, `/api/requests`, `/api/history` y las demás rutas protegidas reutilizan esa sesión.
4. Para que esto funcione desde el navegador, el frontend usa rutas relativas `/api/...` y Next.js redirige esas llamadas al backend de Flask.

### Usuarios de prueba

Todos los usuarios de prueba usan la misma contraseña:

```text
demo1234
```

| Usuario | Rol |
| --- | --- |
| `jefe_gomez` | `jefe_area` |
| `bodega_silva` | `bodega` |
| `ti_morales` | `ti` |
| `colab_ramirez` | `colaborador` |
| `finanzas_vera` | `finanzas` |
| `auditor_lagos` | `auditor` |

### Ejemplo de login desde PowerShell

```powershell
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$body = @{ username = 'jefe_gomez'; password = 'demo1234' } | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method Post -Body $body -ContentType 'application/json' -WebSession $session
Invoke-RestMethod -Uri http://localhost:5000/api/assets -WebSession $session
```

### Nota para el frontend

El frontend debe permanecer ejecutándose en `http://localhost:3000` para que el rewrite de Next enrute `/api/:path*` hacia `http://localhost:5000/api/:path*`. Ese ajuste evita problemas de CORS y mantiene la sesión del navegador en un solo origen.

---

## Compuertas de Decisión Implementadas

1. **D1 (Compatibilidad Técnica):** Valida que la RAM y la categoría correspondan al perfil del cargo del colaborador (ej: programadores requieren Macbook M3 y RAM $\ge 16$ GB; administrativos Dell con $\le 8$ GB).
2. **D2 (Costo/Vida Útil en Falla):** Envía automáticamente a evaluación de Finanzas si el costo de reparación excede el de un equipo nuevo o si le restan menos de 6 meses de vida útil.
3. **D3 (Extensión Excepcional):** Si el desgaste de batería excede el 30% o tiene más de 3 fallas, la extensión de vida útil se bloquea en la interfaz a menos que se cargue una justificación extraordinaria escrita.
