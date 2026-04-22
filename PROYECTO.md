# 🛰️ STREET NETWORK | NODE SYSTEM

![Street Network Banner](https://i.imgur.com/WznCLue.png)

> **Status**: Operational
> **Node**: Command Central v1.0.0
> **Identity**: Cyber-Terminal Admin Interface

---

## 🌌 Visión General

**Street Network** es un ecosistema administrativo de alto rendimiento diseñado para la gestión avanzada de infraestructuras digitales. Con una estética **Cyberpunk/Terminal**, el sistema prioriza la eficiencia técnica, la telemetría en tiempo real y una experiencia de usuario inmersiva que se siente como un sistema operativo de última generación.

El proyecto está construido sobre una arquitectura moderna y escalable, enfocada en la robustez de los datos y la fluidez de las interfaces.

---

## 🚀 Características Principales (Features)

### 🖥️ Centro de Comando (Dashboard)
Panel centralizado con telemetría en tiempo real. Monitoreo de actividad, estados del sistema y métricas clave presentadas en una cuadrícula modular dinámica.

### ⛓️ Nexus
El núcleo de datos. Gestión avanzada de recursos y entidades con sincronización bidireccional, permitiendo un control total sobre la persistencia del sistema.

### 🎫 Gestión de Transmisiones (Discord Tickets)
Sistema de integración con Discord para la gestión de tickets y transcripciones. Permite auditorías rápidas y seguimiento de soporte técnico directamente desde el nodo.

### 🔐 The Vault
Cámara de seguridad para la gestión de credenciales, permisos sensibles y configuraciones críticas bajo protocolos de acceso restringido.

### 🛠️ Constructor de Mensajes (Message Builder)
Herramienta visual para la creación de comunicaciones complejas (Embeds, Webhooks) con previsualización instantánea en formato terminal.

### 📸 Editor de Capturas (Image Editor)
Módulo integrado para la edición y procesamiento de imágenes, optimizado para la documentación técnica y logs visuales.

### 👥 Gestión de Operadores (Users)
Control granular de usuarios, roles y permisos (RBAC), permitiendo una administración jerárquica segura.

### 📡 Telemetría y Logs en Vivo
Flujo constante de datos del "mercado" y eventos del sistema mediante WebSockets/API Routes para una respuesta inmediata a incidentes.

---

## 🎨 ADN Visual y Estilo

El sistema sigue el estándar de diseño **"Google Stitch"** adaptado a una estética **Dark-Cyber**.

*   **Paleta de Colores**: 
    *   `Background`: `#0a0a0a` (Deep Black)
    *   `Surface`: `#141414` (Terminal Gray)
    *   `Accent`: `#ff003c` (Cyber Red)
    *   `Muted`: `#64748b` (Steel Slate)
*   **Tipografía**:
    *   `Technical`: JetBrains Mono / Fira Code (Para datos, IDs y logs).
    *   `UI`: Inter (Para lectura fluida).
*   **Efectos**: 
    *   Glows sutiles en estados activos.
    *   Bordes de baja opacidad (`border-white/5`).
    *   Micro-animaciones de entrada y transiciones fluidas.

---

## 🛠️ Stack Tecnológico

| Tecnología | Rol |
| :--- | :--- |
| **Next.js 15** | Framework de Aplicación (App/Pages Router) |
| **TypeScript** | Tipado Estático y Robustez |
| **Supabase** | Base de Datos & Autenticación SSR |
| **Clerk** | Gestión de Identidad y Seguridad |
| **Tailwind CSS** | Sistema de Estilizado Atómico |
| **Framer Motion** | Orquestación de Animaciones |
| **Redux Toolkit** | Gestión de Estado Global |
| **Lucide React** | Iconografía Técnica |
| **Sonner** | Notificaciones del Sistema |

---

## 🔧 Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Iniciar nodo en modo desarrollo
npm run dev
```

---

## 🛡️ Protocolos de Seguridad

*   **RBAC**: Role-Based Access Control para cada módulo.
*   **SSR Validation**: Verificación de sesión en el lado del servidor mediante Supabase SSR.
*   **CORS Proxy**: Capa intermedia para peticiones externas seguras.

---

**HALCON.DEV** | *Construyendo la infraestructura de la red callejera.*
