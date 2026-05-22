# Plataforma de Gestión de Activos Tecnológicos - DAE ACTIVA (PMN)

Este proyecto es un **Prototipo Mínimo Navegable (PMN)** desarrollado como solución para la gestión de activos fijos de hardware. El objetivo primordial es erradicar la "responsabilidad difusa" mediante un control exhaustivo de transiciones de estado inmutables y la aplicación de reglas financieras directas (D1, D2 y D3).

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
5. `Pendiente de Recepción Formal` &rarr; Alerta de retiro enviada (con simulación de timeout de retorno automático)
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

### 1. Iniciar el Backend (Flask)
Requisitos: Python 3.8+ instalado.

1. Navega al directorio del backend:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   pip3 install -r requirements.txt
   ```
3. Ejecuta el servidor de desarrollo:
   ```bash
   python3 app.py
   ```
El backend estará disponible en: [http://localhost:5000](http://localhost:5000)

---

### 2. Iniciar el Frontend (Next.js)
El entorno de Node.js está instalado de forma local en la carpeta `node-env/` del proyecto. Para ejecutar npm/next, debes configurar temporalmente la ruta en tu terminal.

1. Navega al directorio del frontend:
   ```bash
   cd frontend
   ```
2. Carga la ruta de Node.js local en la terminal e instala dependencias:
   ```bash
   export PATH=$(pwd)/../node-env/bin:$PATH
   npm install
   ```
3. Ejecuta el servidor de desarrollo Next.js:
   ```bash
   npm run dev
   ```
El frontend estará disponible en: [http://localhost:3000](http://localhost:3000)

---

## Compuertas de Decisión Implementadas

1. **D1 (Compatibilidad Técnica):** Valida que la RAM y la categoría correspondan al perfil del cargo del colaborador (ej: programadores requieren Macbook M3 y RAM $\ge 16$ GB; administrativos Dell con $\le 8$ GB).
2. **D2 (Costo/Vida Útil en Falla):** Envía automáticamente a evaluación de Finanzas si el costo de reparación excede el de un equipo nuevo o si le restan menos de 6 meses de vida útil.
3. **D3 (Extensión Excepcional):** Si el desgaste de batería excede el 30% o tiene más de 3 fallas, la extensión de vida útil se bloquea en la interfaz a menos que se cargue una justificación extraordinaria escrita.
