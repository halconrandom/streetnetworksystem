<div align="center">

  # 🏢 Street Network Admin

  ![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)
  ![React](https://img.shields.io/badge/React-18.2-blue?style=for-the-badge&logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?style=for-the-badge&logo=postgresql)
  ![Clerk](https://img.shields.io/badge/Clerk-6.39-purple?style=for-the-badge&logo=clerk)

  **Panel de administración centralizado para el hub de Street Network**

  [Demo en Vivo](https://tmstreet.network/) • [Discord](http://discord.com/invite/4qNVmk464p) • [Reportar Issue](../../issues)

</div>

---

## 📖 Sobre el Proyecto

Street Network Admin es un panel de administración completo y robusto diseñado para gestionar el hub de Street Network. Este sistema proporciona herramientas centralizadas para la gestión de usuarios, tickets de soporte, auditoría, activos, mensajes automatizados y más.

### 🎯 Para quién está diseñado

- **Administradores del hub**: Para gestionar usuarios, permisos y configuraciones del sistema
- **Equipo de soporte**: Para manejar tickets de soporte y transcripciones de manera eficiente
- **Gestores de contenido**: Para crear y enviar mensajes automatizados a través de Discord
- **Auditores**: Para monitorear y revisar todas las actividades del sistema

### ⚡ Problema que resuelve

Antes de Street Network Admin, la gestión del hub requería múltiples herramientas dispersas y procesos manuales. Este panel centraliza todas las operaciones, proporcionando:
- Gestión unificada de usuarios con autenticación Clerk y Discord OAuth
- Sistema de tickets completo con seguimiento de transcripciones
- Auditoría detallada de todas las acciones del sistema
- Herramientas de automatización para mensajes de Discord
- Almacén centralizado de activos y clientes

---

## ✨ Características Principales

### 🔐 Autenticación y Gestión de Usuarios
- ✅ Autenticación segura con Clerk
- ✅ Integración OAuth con Discord
- ✅ Sistema de roles y permisos
- ✅ Gestión de flags de usuarios
- ✅ Sincronización automática con Discord

### 🎫 Sistema de Tickets
- ✅ Creación y gestión de tickets de soporte
- ✅ Sistema de transcripciones completo
- ✅ Asignación de tickets a administradores
- ✅ Seguimiento de estado (abierto, en progreso, cerrado)
- ✅ Notas internas por ticket
- ✅ Categorización de tickets

### 📊 Auditoría y Logs
- ✅ Registro detallado de todas las acciones
- ✅ Tracking de IP y user agent
- ✅ Logs de cambios de usuarios
- ✅ Historial de modificaciones
- ✅ Filtros y búsqueda avanzada

### 🏦 The Vault
- ✅ Gestión de activos digitales
- ✅ Base de datos de clientes
- ✅ Sistema de tiers para clientes
- ✅ Notas internas por cliente
- ✅ Metadata flexible con JSONB

### 💬 Message Builder
- ✅ Constructor visual de mensajes para Discord
- ✅ Sistema de plantillas reutilizables
- ✅ Gestión de menciones (@user, @role)
- ✅ Soporte para webhooks
- ✅ Vista previa en tiempo real
- ✅ Soporte para hilos (threads)

### 🖼️ Screenshot Editor
- ✅ Editor de screenshots integrado
- ✅ Sistema de puntos de carga (load points)
- ✅ Herramientas de recorte y edición
- ✅ Guardado de estados
- ✅ Exportación en múltiples formatos

### 🔮 The Nexus
- ✅ Vista especializada de datos
- ✅ Estados personalizados por usuario
- ✅ Interfaz dinámica y reactiva
- ✅ Almacenamiento de estados en JSONB

### 📢 Live Updates
- ✅ Sistema de anuncios en tiempo real
- ✅ Gestión de actualizaciones del sistema
- ✅ Programación de mensajes
- ✅ Control de visibilidad

### 🎨 Interfaz de Usuario
- ✅ Diseño moderno y responsivo
- ✅ Modo oscuro/claro
- ✅ Animaciones fluidas con Framer Motion
- ✅ Iconos con Lucide React
- ✅ Notificaciones toast con Sonner
- ✅ Soporte para emojis con Emoji Mart

### 🌐 Internacionalización
- ✅ Soporte multiidioma con i18next
- ✅ Detección automática de idioma
- ✅ Traducciones extensibles

---

## 🛠️ Tecnologías Utilizadas

### Frontend
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| [Next.js](https://nextjs.org/) | 15.5.12 | Framework React con SSR |
| [React](https://react.dev/) | 18.2.0 | Biblioteca UI |
| [TypeScript](https://www.typescriptlang.org/) | 5.8.2 | Tipado estático |
| [Redux Toolkit](https://redux-toolkit.js.org/) | 1.8.5 | Gestión de estado |
| [Framer Motion](https://www.framer.com/motion/) | 12.34.3 | Animaciones |
| [Lucide React](https://lucide.dev/) | 0.562.0 | Iconos |
| [Sonner](https://sonner.emilkowal.ski/) | 2.0.7 | Notificaciones toast |

### Backend & API
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction) | - | API REST |
| [PostgreSQL](https://www.postgresql.org/) | 15+ | Base de datos relacional |
| [pg](https://node-postgres.com/) | 8.20.0 | Cliente PostgreSQL |
| [Clerk](https://clerk.com/) | 6.39.0 | Autenticación |
| [Svix](https://www.svix.com/) | 1.86.0 | Webhooks |

### Integraciones
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| [Discord.js](https://discord.js.org/) | - | Bot de Discord |
| [i18next](https://www.i18next.com/) | 22.4.10 | Internacionalización |
| [react-i18next](https://react.i18next.com/) | 12.1.5 | i18next para React |

### Herramientas de Desarrollo
| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| [ESLint](https://eslint.org/) | - | Linting |
| [PostCSS](https://postcss.org/) | 8.5.6 | Procesador CSS |
| [PostCSS Nesting](https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-nesting) | 13.0.1 | Nesting CSS |
| [PM2](https://pm2.keymetrics.io/) | - | Gestión de procesos |
| [Nginx](https://nginx.org/) | - | Reverse proxy |

---

## 📁 Estructura del Proyecto

```
streetnetworkadmin/
├── components/              # Componentes globales reutilizables
│   ├── Builder/            # Componentes del Message Builder
│   ├── ActionToolbar.tsx   # Barra de herramientas
│   ├── Conversation.tsx    # Componente de conversación
│   ├── Icons.tsx           # Iconos personalizados
│   ├── Sidebar.tsx         # Barra lateral
│   ├── TicketMetadata.tsx  # Metadata de tickets
│   └── UI.tsx              # Componentes UI base
├── docs/                   # Documentación adicional
├── documentacion/          # Documentación en español
├── lib/                    # Librerías y utilidades
├── migrations/             # Migraciones de base de datos
│   ├── 001_complete_schema.sql
│   ├── 002_message_builder_user_id.sql
│   ├── add_review_channels_table.sql
│   └── README.md
├── pages/                  # Páginas de Next.js (Pages Router)
│   ├── api/                # API Routes
│   │   ├── admin/          # Endpoints de administración
│   │   ├── audit/          # Endpoints de auditoría
│   │   ├── auth/           # Endpoints de autenticación
│   │   ├── debug/          # Endpoints de debug
│   │   ├── live-updates/   # Endpoints de actualizaciones
│   │   ├── message-builder/# Endpoints del Message Builder
│   │   ├── nexus/          # Endpoints de Nexus
│   │   ├── review-channels/# Endpoints de canales de revisión
│   │   ├── screenshot-editor/# Endpoints del editor
│   │   ├── tickets/        # Endpoints de tickets
│   │   ├── users/          # Endpoints de usuarios
│   │   ├── vault/          # Endpoints del Vault
│   │   └── webhooks/       # Webhooks de Clerk
│   ├── message-builder/    # Página del Message Builder
│   ├── sign-in/            # Página de login
│   ├── sign-up/            # Página de registro
│   ├── tickets/            # Página de tickets
│   ├── _app.tsx            # App component
│   ├── _document.tsx       # Document component
│   ├── 404.tsx             # Página 404
│   ├── audit.tsx           # Página de auditoría
│   ├── dashboard.tsx       # Dashboard principal
│   ├── index.tsx           # Página de inicio
│   ├── nexus.tsx           # Página de Nexus
│   ├── not-found.tsx       # Página not found
│   ├── screenshot-editor.tsx # Página del editor
│   ├── settings.tsx        # Página de configuración
│   ├── users.tsx           # Página de usuarios
│   └── vault.tsx           # Página del Vault
├── proxy/                  # Proxy CORS para Discord
│   └── corsProxy.mjs
├── scripts/                # Scripts de utilidad
├── src/                    # Código fuente organizado por features
│   ├── components/         # Componentes específicos de features
│   ├── core/               # Componentes core (AppShell, etc.)
│   ├── features/           # Features del sistema
│   │   ├── admin/          # Feature de administración
│   │   ├── audit/          # Feature de auditoría
│   │   ├── dashboard/      # Feature del dashboard
│   │   ├── home/           # Feature de home
│   │   ├── message-builder/# Feature del Message Builder
│   │   ├── nexus/          # Feature de Nexus
│   │   ├── screenshot-editor/# Feature del editor
│   │   ├── settings/       # Feature de configuración
│   │   ├── tickets/        # Feature de tickets
│   │   ├── transcript/     # Feature de transcripciones
│   │   ├── users/          # Feature de usuarios
│   │   └── vault/          # Feature del Vault
│   ├── shared/             # Componentes compartidos
│   └── utils/              # Utilidades y helpers
├── styles/                 # Estilos globales
├── types/                  # Definiciones de tipos TypeScript
├── utils/                  # Utilidades adicionales
├── .gitignore              # Archivos ignorados por Git
├── .npmrc                  # Configuración de npm
├── BLACKBOX.md             # Memoria de Blackbox
├── deploy-sn.sh            # Script de despliegue
├── metadata.json           # Metadatos del proyecto
├── middleware.ts           # Middleware de Next.js
├── next-env.d.ts           # Tipos de Next.js
├── next.config.mjs         # Configuración de Next.js
├── nginx.conf              # Configuración de Nginx
├── package.json            # Dependencias y scripts
├── postcss.config.cjs      # Configuración de PostCSS
├── README.md               # Este archivo
├── TODO.md                 # Tareas pendientes
├── tsconfig.json           # Configuración de TypeScript
└── types.ts                # Tipos globales
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/))
- **npm** o **yarn**
- **Cuenta de Clerk** ([Sign up](https://clerk.com/))
- **Cuenta de Discord Developer** ([Sign up](https://discord.com/developers/applications))

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/streetnetworkadmin.git
cd streetnetworkadmin
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database
DATABASE_URL=postgresql://user:password@host:port/database
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=streetnetwork

# Discord
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_GUILD_ID=your_discord_guild_id

# Svix Webhooks
SVIX_API_KEY=your_svix_api_key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configurar Base de Datos

Ejecuta las migraciones en orden:

```bash
# Conecta a tu base de datos PostgreSQL
psql -h localhost -U tu_usuario -d streetnetwork

# Ejecuta las migraciones
\i migrations/001_complete_schema.sql
\i migrations/002_message_builder_user_id.sql
\i migrations/add_review_channels_table.sql
```

O usando una herramienta como pgAdmin o DBeaver.

### 5. Ejecutar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### 6. Ejecutar el Proxy CORS (Opcional)

Para integración con Discord:

```bash
npm run proxy
```

El proxy estará disponible en [http://localhost:8787](http://localhost:8787)

---

## 📖 Uso de la Aplicación

### Para Usuarios Finales

1. **Registro**: Accede a `/sign-up` para crear una cuenta con Clerk
2. **Login**: Accede a `/sign-in` para iniciar sesión
3. **Dashboard**: Navega por el dashboard para ver las opciones disponibles según tu rol

### Para Administradores

#### Gestión de Usuarios
- Accede a `/users` para ver y gestionar usuarios
- Asigna roles y flags según sea necesario
- Sincroniza usuarios con Discord

#### Sistema de Tickets
- Accede a `/tickets` para ver todos los tickets
- Haz clic en un ticket para ver detalles y transcripciones
- Asigna tickets a administradores
- Agrega notas internas para seguimiento

#### Auditoría
- Accede a `/audit` para ver el log de acciones
- Filtra por usuario, acción o fecha
- Revisa cambios y modificaciones

#### The Vault
- Accede a `/vault` para gestionar activos y clientes
- Crea nuevos activos o clientes
- Agrega notas internas y metadata

#### Message Builder
- Accede a `/message-builder` para crear mensajes de Discord
- Usa el constructor visual para diseñar mensajes
- Guarda plantillas para reutilizar
- Envía a webhooks o canales específicos

#### Screenshot Editor
- Accede a `/screenshot-editor` para editar screenshots
- Usa las herramientas de recorte y edición
- Guarda puntos de carga para retomar el trabajo

#### The Nexus
- Accede a `/nexus` para ver datos especializados
- Personaliza tu vista según tus necesidades

#### Live Updates
- Crea anuncios y actualizaciones del sistema
- Programa mensajes para fechas específicas
- Controla la visibilidad de cada actualización

---

## 🎨 Características de Diseño

### Sistema de Colores

El proyecto utiliza un sistema de colores moderno y accesible:

- **Primary**: Azul para acciones principales
- **Secondary**: Gris para elementos secundarios
- **Success**: Verde para confirmaciones
- **Warning**: Amarillo para advertencias
- **Error**: Rojo para errores
- **Dark Mode**: Soporte completo para modo oscuro

### Componentes UI

- **AppShell**: Layout principal con sidebar y contenido
- **ActionToolbar**: Barra de herramientas contextual
- **Conversation**: Componente de chat/mensajes
- **Sidebar**: Navegación lateral
- **TicketMetadata**: Panel de metadata de tickets
- **VaultView**: Vista del Vault con filtros y búsqueda

### Animaciones

- **Framer Motion**: Animaciones fluidas y performantes
- **Transiciones**: Suaves entre páginas y componentes
- **Micro-interacciones**: Feedback visual en acciones
- **Loading States**: Indicadores de carga elegantes

### Patrones de Diseño

- **Feature-based Architecture**: Código organizado por funcionalidades
- **Component Composition**: Componentes reutilizables y componibles
- **Type Safety**: TypeScript para seguridad de tipos
- **Separation of Concerns**: Lógica de negocio separada de UI

---

## 🗄️ Esquema de Base de Datos

### Tablas Principales

#### `sn_users`
Gestión de usuarios del sistema
- `id`: UUID (Primary Key)
- `clerk_id`: ID de Clerk (Unique)
- `email`: Email del usuario (Unique)
- `name`: Nombre completo
- `role`: Rol del usuario (admin, user, etc.)
- `is_active`: Estado de activación
- `is_verified`: Estado de verificación
- `discord_id`: ID de Discord (Unique)
- `discord_username`: Username de Discord
- `discord_avatar`: Avatar de Discord
- `discord_review_channel_id`: Canal de revisión en Discord

#### `sn_tickets`
Sistema de tickets de soporte
- `id`: UUID (Primary Key)
- `ticket_number`: Número secuencial
- `user_id`: UUID del usuario (Foreign Key)
- `thread_id`: ID del hilo de Discord
- `category`: Categoría del ticket
- `status`: Estado del ticket
- `claimed_by`: UUID del administrador asignado
- `closed_by`: UUID del administrador que cerró
- `transcript_code`: Código de transcripción
- `resolution`: Resolución del ticket

#### `sn_ticket_messages`
Mensajes de tickets
- `id`: UUID (Primary Key)
- `ticket_id`: UUID del ticket (Foreign Key)
- `user_id`: UUID del usuario (Foreign Key)
- `user_name`: Nombre del usuario
- `content`: Contenido del mensaje
- `created_at`: Fecha de creación

#### `sn_audit_logs`
Registro de auditoría
- `id`: BigSerial (Primary Key)
- `actor_user_id`: UUID del actor (Foreign Key)
- `action`: Acción realizada
- `target_user_id`: UUID del objetivo (Foreign Key)
- `metadata`: Datos adicionales (JSONB)
- `ip`: Dirección IP
- `user_agent`: User agent del navegador

#### `sn_vault_assets`
Activos del Vault
- `id`: UUID (Primary Key)
- `name`: Nombre del activo
- `kind`: Tipo de activo
- `identifier`: Identificador único
- `owner_id`: UUID del propietario (Foreign Key)
- `status`: Estado del activo
- `metadata`: Metadata adicional (JSONB)

#### `sn_vault_clients`
Clientes del Vault
- `id`: UUID (Primary Key)
- `full_name`: Nombre completo
- `email`: Email de contacto
- `phone`: Teléfono
- `tier`: Nivel del cliente
- `metadata`: Metadata adicional (JSONB)
- `internal_notes`: Notas internas

#### `sn_messagebuilder_templates`
Plantillas del Message Builder
- `id`: Serial (Primary Key)
- `name`: Nombre de la plantilla
- `data`: Datos de la plantilla (JSONB)

#### `sn_messagebuilder_webhook_targets`
Destinos de webhooks
- `id`: Serial (Primary Key)
- `name`: Nombre del destino
- `value`: URL del webhook
- `kind`: Tipo de destino
- `is_thread_enabled`: Habilitar hilos
- `thread_id`: ID del hilo

#### `sn_seditorLoadPoints`
Puntos de carga del Screenshot Editor
- `id`: UUID (Primary Key)
- `user_id`: UUID del usuario (Foreign Key)
- `name`: Nombre del punto
- `image_data_url`: Imagen en base64
- `state_data`: Estado del editor (JSONB)

#### `sn_nexus_states`
Estados de Nexus
- `user_id`: UUID del usuario (Primary Key, Foreign Key)
- `data`: Datos del estado (JSONB)
- `created_at`: Fecha de creación
- `updated_at`: Fecha de actualización

#### `sn_live_updates`
Actualizaciones en vivo
- `id`: Serial (Primary Key)
- `type`: Tipo de actualización
- `message`: Mensaje principal
- `description`: Descripción detallada
- `date`: Fecha de publicación
- `is_active`: Estado de activación

### Relaciones Entre Tablas

```
sn_users (1) ────── (N) sn_tickets
sn_users (1) ────── (N) sn_ticket_messages
sn_users (1) ────── (N) sn_audit_logs (actor)
sn_users (1) ────── (N) sn_audit_logs (target)
sn_users (1) ────── (N) sn_vault_assets
sn_users (1) ────── (N) sn_seditorLoadPoints
sn_users (1) ────── (1) sn_nexus_states
sn_tickets (1) ──── (N) sn_ticket_messages
sn_tickets (1) ──── (N) sn_notes
```

---

## 📜 Scripts Disponibles

### Desarrollo

```bash
npm run dev          # Inicia el servidor de desarrollo
npm run proxy        # Inicia el proxy CORS para Discord
```

### Producción

```bash
npm run build        # Construye la aplicación para producción
npm start            # Inicia el servidor de producción
```

### Calidad de Código

```bash
# El proyecto usa ESLint para linting
# Puedes agregar scripts personalizados en package.json
```

---

## 🚀 Despliegue

### Plataformas Recomendadas

- **Vercel**: Recomendado para Next.js (despliegue automático desde Git)
- **Railway**: Bueno para bases de datos PostgreSQL
- **DigitalOcean**: Para servidores dedicados
- **AWS**: Para infraestructura escalable

### Despliegue en Producción

El proyecto incluye un script de despliegue automatizado:

```bash
./deploy-sn.sh
```

Opciones disponibles:
- `--skip-build`: Saltar el paso de build
- `--skip-deps`: Saltar la instalación de dependencias

#### Pasos Manuales de Despliegue

1. **Preparar el entorno de producción**

```bash
# Crear archivo .env.production
cp .env.example .env.production
# Editar con las credenciales de producción
```

2. **Construir la aplicación**

```bash
npm run build
```

3. **Configurar Nginx**

El proyecto incluye una configuración de Nginx lista para usar en `nginx.conf`.

```bash
# Copiar configuración
sudo cp nginx.conf /etc/nginx/sites-available/streetnetwork
sudo ln -s /etc/nginx/sites-available/streetnetwork /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

4. **Iniciar con PM2**

```bash
# Iniciar la aplicación
pm2 start npm --name "streetnetwork-admin" -- start -- -p 3005

# Iniciar el proxy CORS
pm2 start proxy/corsProxy.mjs --name "streetnetwork-proxy"

# Guardar configuración
pm2 save
```

5. **Configurar SSL con Let's Encrypt**

```bash
sudo certbot --nginx -d tmstreet.network -d www.tmstreet.network
```

### Variables de Entorno en Producción

Asegúrate de configurar estas variables en producción:

```bash
# Clerk (Obligatorio)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Base de Datos (Obligatorio)
DATABASE_URL=postgresql://user:password@production-host:5432/dbname

# Discord (Obligatorio para integración)
DISCORD_BOT_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_GUILD_ID=...

# Svix (Obligatorio para webhooks)
SVIX_API_KEY=...

# Aplicación
NEXT_PUBLIC_APP_URL=https://tmstreet.network
NODE_ENV=production
```

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Si deseas contribuir al proyecto, por favor sigue estos pasos:

### Cómo Contribuir

1. **Fork el repositorio**
2. **Crea una rama para tu feature** (`git checkout -b feature/AmazingFeature`)
3. **Commit tus cambios** (`git commit -m 'Add some AmazingFeature'`)
4. **Push a la rama** (`git push origin feature/AmazingFeature`)
5. **Abre un Pull Request**

### Proceso de Pull Request

1. Asegúrate de que tu código siga los estándares del proyecto
2. Actualiza la documentación si es necesario
3. Agrega tests si introduces nueva funcionalidad
4. Asegúrate de que todos los tests pasen
5. Describe claramente los cambios en tu PR

### Directrices de Código

- Usa TypeScript para todo el código nuevo
- Sigue el estilo de código existente
- Escribe commits claros y descriptivos
- Agrega comentarios para código complejo
- Mantén los componentes pequeños y enfocados

---

## 📄 Licencia

Este proyecto es propiedad de Street Network. Todos los derechos reservados.

© 2026 Street Network. Unauthorized copying, distribution, or modification of this project is strictly prohibited.

---

## 💬 Soporte

¿Necesitas ayuda o tienes preguntas?

- **Email**: [isaac.streetnetwork@gmail.com](mailto:isaac.streetnetwork@gmail.com)
- **Discord**: [Únete a nuestro servidor](http://discord.com/invite/4qNVmk464p)
- **Issues**: [Reporta un problema](../../issues)

---

## 🗺️ Roadmap

### Características Futuras Planeadas

- [ ] **Mejoras en el Dashboard**
  - Widgets personalizables
  - Métricas en tiempo real
  - Gráficos y visualizaciones

- [ ] **Sistema de Notificaciones**
  - Notificaciones push
  - Preferencias de notificación por usuario
  - Historial de notificaciones

- [ ] **Mejoras en el Message Builder**
  - Más plantillas predefinidas
  - Programación de mensajes
  - Analytics de mensajes enviados

- [ ] **Integraciones Adicionales**
  - Integración con Slack
  - Integración con Telegram
  - Webhooks personalizados

- [ ] **Mejoras en el Vault**
  - Sistema de etiquetas
  - Búsqueda avanzada
  - Exportación de datos

- [ ] **Sistema de Reportes**
  - Reportes personalizables
  - Exportación a PDF/Excel
  - Programación de reportes

- [ ] **Mejoras de Seguridad**
  - 2FA obligatorio para admins
  - Logs de seguridad mejorados
  - Auditoría de accesos

- [ ] **API Pública**
  - Documentación de API
  - Rate limiting
  - API keys

---

<div align="center">

  ## 🎉 ¡Gracias por usar Street Network Admin!

  **Desarrollado con ❤️ por el equipo de Street Network**

  [Sitio Web](https://tmstreet.network/) • [Discord](http://discord.com/invite/4qNVmk464p) • [Email](mailto:isaac.streetnetwork@gmail.com)

  ---
  
  *Última actualización: Marzo 2026*

</div>