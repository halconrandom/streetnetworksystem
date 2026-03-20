<div align="center">

  # 🏢 Street Network Admin

  ![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)
  ![React](https://img.shields.io/badge/React-18.2-blue?style=for-the-badge&logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?style=for-the-badge&logo=postgresql)
  ![Clerk](https://img.shields.io/badge/Clerk-6.39-purple?style=for-the-badge&logo=clerk)

  **Centralized administration panel for the Street Network hub**

  [Live Demo](https://tmstreet.network/) • [Discord](http://discord.com/invite/4qNVmk464p) • [Report Issue](../../issues)

</div>

---

## 📖 About the Project

Street Network Admin is a comprehensive and robust administration panel designed to manage the Street Network hub. This system provides centralized tools for user management, support tickets, auditing, assets, automated messages, and more.

### 🎯 Who It's For

- **Hub Administrators**: To manage users, permissions, and system configurations
- **Support Team**: To handle support tickets and transcripts efficiently
- **Content Managers**: To create and send automated messages through Discord
- **Auditors**: To monitor and review all system activities

### ⚡ Problem It Solves

Before Street Network Admin, hub management required multiple scattered tools and manual processes. This panel centralizes all operations, providing:
- Unified user management with Clerk authentication and Discord OAuth
- Complete ticket system with transcript tracking
- Detailed auditing of all system actions
- Automation tools for Discord messages
- Centralized storage for assets and clients

---

## ✨ Key Features

### 🔐 Authentication & User Management
- ✅ Secure authentication with Clerk
- ✅ Discord OAuth integration
- ✅ Role and permission system
- ✅ User flags management
- ✅ Automatic Discord synchronization

### 🎫 Ticket System
- ✅ Support ticket creation and management
- ✅ Complete transcript system
- ✅ Ticket assignment to administrators
- ✅ Status tracking (open, in progress, closed)
- ✅ Internal notes per ticket
- ✅ Ticket categorization

### 📊 Auditing & Logs
- ✅ Detailed logging of all actions
- ✅ IP and user agent tracking
- ✅ User change logs
- ✅ Modification history
- ✅ Advanced filters and search

### 🏦 The Vault
- ✅ Digital asset management
- ✅ Client database
- ✅ Client tier system
- ✅ Internal notes per client
- ✅ Flexible metadata with JSONB

### 💬 Message Builder
- ✅ Visual Discord message builder
- ✅ Reusable template system
- ✅ Mention management (@user, @role)
- ✅ Webhook support
- ✅ Real-time preview
- ✅ Thread support

### 🖼️ Screenshot Editor
- ✅ Integrated screenshot editor
- ✅ Load points system
- ✅ Crop and editing tools
- ✅ State saving
- ✅ Multiple format export

### 🔮 The Nexus
- ✅ Specialized data view
- ✅ User-customized states
- ✅ Dynamic and reactive interface
- ✅ JSONB state storage

### 📢 Live Updates
- ✅ Real-time announcement system
- ✅ System update management
- ✅ Message scheduling
- ✅ Visibility control

### 🎨 User Interface
- ✅ Modern and responsive design
- ✅ Dark/light mode
- ✅ Smooth animations with Framer Motion
- ✅ Icons with Lucide React
- ✅ Toast notifications with Sonner
- ✅ Emoji support with Emoji Mart

### 🌐 Internationalization
- ✅ Multi-language support with i18next
- ✅ Automatic language detection
- ✅ Extensible translations

---

## 🛠️ Technologies Used

### Frontend
| Technology | Version | Description |
|------------|---------|-------------|
| [Next.js](https://nextjs.org/) | 15.5.12 | React framework with SSR |
| [React](https://react.dev/) | 18.2.0 | UI library |
| [TypeScript](https://www.typescriptlang.org/) | 5.8.2 | Static typing |
| [Redux Toolkit](https://redux-toolkit.js.org/) | 1.8.5 | State management |
| [Framer Motion](https://www.framer.com/motion/) | 12.34.3 | Animations |
| [Lucide React](https://lucide.dev/) | 0.562.0 | Icons |
| [Sonner](https://sonner.emilkowal.ski/) | 2.0.7 | Toast notifications |

### Backend & API
| Technology | Version | Description |
|------------|---------|-------------|
| [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction) | - | REST API |
| [PostgreSQL](https://www.postgresql.org/) | 15+ | Relational database |
| [pg](https://node-postgres.com/) | 8.20.0 | PostgreSQL client |
| [Clerk](https://clerk.com/) | 6.39.0 | Authentication |
| [Svix](https://www.svix.com/) | 1.86.0 | Webhooks |

### Integrations
| Technology | Version | Description |
|------------|---------|-------------|
| [Discord.js](https://discord.js.org/) | - | Discord bot |
| [i18next](https://www.i18next.com/) | 22.4.10 | Internationalization |
| [react-i18next](https://react.i18next.com/) | 12.1.5 | i18next for React |

### Development Tools
| Technology | Version | Description |
|------------|---------|-------------|
| [ESLint](https://eslint.org/) | - | Linting |
| [PostCSS](https://postcss.org/) | 8.5.6 | CSS processor |
| [PostCSS Nesting](https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-nesting) | 13.0.1 | CSS nesting |
| [PM2](https://pm2.keymetrics.io/) | - | Process management |
| [Nginx](https://nginx.org/) | - | Reverse proxy |

---

## 📁 Project Structure

```
streetnetworkadmin/
├── components/              # Global reusable components
├── docs/                   # Additional documentation
├── documentacion/          # Spanish documentation
├── lib/                    # Libraries and utilities
├── migrations/             # Database migrations
├── pages/                  # Next.js pages (Pages Router)
│   ├── api/                # API Routes
│   ├── message-builder/    # Message Builder page
│   ├── sign-in/            # Login page
│   ├── sign-up/            # Registration page
│   ├── tickets/            # Tickets page
│   ├── _app.tsx            # App component
│   ├── _document.tsx       # Document component
│   ├── 404.tsx             # 404 page
│   ├── audit.tsx           # Audit page
│   ├── dashboard.tsx       # Main dashboard
│   ├── index.tsx           # Home page
│   ├── nexus.tsx           # Nexus page
│   ├── not-found.tsx       # Not found page
│   ├── screenshot-editor.tsx # Editor page
│   ├── settings.tsx        # Settings page
│   ├── users.tsx           # Users page
│   └── vault.tsx           # Vault page
├── proxy/                  # CORS proxy for Discord
├── scripts/                # Utility scripts
├── src/                    # Source code organized by features
│   ├── components/         # Feature-specific components
│   ├── core/               # Core components (AppShell, etc.)
│   ├── features/           # System features
│   ├── shared/             # Shared components
│   └── utils/              # Utilities and helpers
├── styles/                 # Global styles
├── types/                  # TypeScript type definitions
├── utils/                  # Additional utilities
├── .gitignore              # Git ignored files
├── .npmrc                  # npm configuration
├── BLACKBOX.md             # Blackbox memory
├── deploy-sn.sh            # Deployment script
├── metadata.json           # Project metadata
├── middleware.ts           # Next.js middleware
├── next-env.d.ts           # Next.js types
├── next.config.mjs         # Next.js configuration
├── nginx.conf              # Nginx configuration
├── package.json            # Dependencies and scripts
├── postcss.config.cjs      # PostCSS configuration
├── README.md               # Spanish version
├── README_EN.md            # This file (English version)
├── TODO.md                 # Pending tasks
├── tsconfig.json           # TypeScript configuration
└── types.ts                # Global types
```

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/))
- **npm** or **yarn**
- **Clerk Account** ([Sign up](https://clerk.com/))
- **Discord Developer Account** ([Sign up](https://discord.com/developers/applications))

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/streetnetworkadmin.git
cd streetnetworkadmin
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

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

### 4. Setup Database

Run migrations in order:

```bash
# Connect to your PostgreSQL database
psql -h localhost -U your_user -d streetnetwork

# Run migrations
\i migrations/001_complete_schema.sql
\i migrations/002_message_builder_user_id.sql
\i migrations/add_review_channels_table.sql
```

Or use a tool like pgAdmin or DBeaver.

### 5. Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 6. Run CORS Proxy (Optional)

For Discord integration:

```bash
npm run proxy
```

The proxy will be available at [http://localhost:8787](http://localhost:8787)

---

## 📖 Application Usage

### For End Users

1. **Registration**: Go to `/sign-up` to create an account with Clerk
2. **Login**: Go to `/sign-in` to sign in
3. **Dashboard**: Navigate the dashboard to see available options based on your role

### For Administrators

#### User Management
- Go to `/users` to view and manage users
- Assign roles and flags as needed
- Sync users with Discord

#### Ticket System
- Go to `/tickets` to view all tickets
- Click on a ticket to view details and transcripts
- Assign tickets to administrators
- Add internal notes for tracking

#### Auditing
- Go to `/audit` to view action logs
- Filter by user, action, or date
- Review changes and modifications

#### The Vault
- Go to `/vault` to manage assets and clients
- Create new assets or clients
- Add internal notes and metadata

#### Message Builder
- Go to `/message-builder` to create Discord messages
- Use the visual builder to design messages
- Save templates for reuse
- Send to webhooks or specific channels

#### Screenshot Editor
- Go to `/screenshot-editor` to edit screenshots
- Use crop and editing tools
- Save load points to resume work

#### The Nexus
- Go to `/nexus` to view specialized data
- Customize your view based on your needs

#### Live Updates
- Create announcements and system updates
- Schedule messages for specific dates
- Control visibility of each update

---

## 🎨 Design Features

### Color System

The project uses a modern and accessible color system:

- **Primary**: Blue for main actions
- **Secondary**: Gray for secondary elements
- **Success**: Green for confirmations
- **Warning**: Yellow for warnings
- **Error**: Red for errors
- **Dark Mode**: Full dark mode support

### UI Components

- **AppShell**: Main layout with sidebar and content
- **ActionToolbar**: Contextual action toolbar
- **Conversation**: Chat/messages component
- **Sidebar**: Lateral navigation
- **TicketMetadata**: Ticket metadata panel
- **VaultView**: Vault view with filters and search

### Animations

- **Framer Motion**: Smooth and performant animations
- **Transitions**: Smooth between pages and components
- **Micro-interactions**: Visual feedback on actions
- **Loading States**: Elegant loading indicators

### Design Patterns

- **Feature-based Architecture**: Code organized by functionality
- **Component Composition**: Reusable and composable components
- **Type Safety**: TypeScript for type safety
- **Separation of Concerns**: Business logic separated from UI

---

## 🗄️ Database Schema

### Main Tables

#### `sn_users`
System user management
- `id`: UUID (Primary Key)
- `clerk_id`: Clerk ID (Unique)
- `email`: User email (Unique)
- `name`: Full name
- `role`: User role (admin, user, etc.)
- `is_active`: Activation status
- `is_verified`: Verification status
- `discord_id`: Discord ID (Unique)
- `discord_username`: Discord username
- `discord_avatar`: Discord avatar
- `discord_review_channel_id`: Discord review channel

#### `sn_tickets`
Support ticket system
- `id`: UUID (Primary Key)
- `ticket_number`: Sequential number
- `user_id`: User UUID (Foreign Key)
- `thread_id`: Discord thread ID
- `category`: Ticket category
- `status`: Ticket status
- `claimed_by`: Assigned admin UUID
- `closed_by`: Admin UUID who closed
- `transcript_code`: Transcript code
- `resolution`: Ticket resolution

#### `sn_ticket_messages`
Ticket messages
- `id`: UUID (Primary Key)
- `ticket_id`: Ticket UUID (Foreign Key)
- `user_id`: User UUID (Foreign Key)
- `user_name`: User name
- `content`: Message content
- `created_at`: Creation date

#### `sn_audit_logs`
Audit log
- `id`: BigSerial (Primary Key)
- `actor_user_id`: Actor UUID (Foreign Key)
- `action`: Action performed
- `target_user_id`: Target UUID (Foreign Key)
- `metadata`: Additional data (JSONB)
- `ip`: IP address
- `user_agent`: Browser user agent

#### `sn_vault_assets`
Vault assets
- `id`: UUID (Primary Key)
- `name`: Asset name
- `kind`: Asset type
- `identifier`: Unique identifier
- `owner_id`: Owner UUID (Foreign Key)
- `status`: Asset status
- `metadata`: Additional metadata (JSONB)

#### `sn_vault_clients`
Vault clients
- `id`: UUID (Primary Key)
- `full_name`: Full name
- `email`: Contact email
- `phone`: Phone number
- `tier`: Client tier
- `metadata`: Additional metadata (JSONB)
- `internal_notes`: Internal notes

#### `sn_messagebuilder_templates`
Message Builder templates
- `id`: Serial (Primary Key)
- `name`: Template name
- `data`: Template data (JSONB)

#### `sn_messagebuilder_webhook_targets`
Webhook targets
- `id`: Serial (Primary Key)
- `name`: Target name
- `value`: Webhook URL
- `kind`: Target type
- `is_thread_enabled`: Enable threads
- `thread_id`: Thread ID

#### `sn_seditorLoadPoints`
Screenshot Editor load points
- `id`: UUID (Primary Key)
- `user_id`: User UUID (Foreign Key)
- `name`: Point name
- `image_data_url`: Base64 image
- `state_data`: Editor state (JSONB)

#### `sn_nexus_states`
Nexus states
- `user_id`: User UUID (Primary Key, Foreign Key)
- `data`: State data (JSONB)
- `created_at`: Creation date
- `updated_at`: Update date

#### `sn_live_updates`
Live updates
- `id`: Serial (Primary Key)
- `type`: Update type
- `message`: Main message
- `description`: Detailed description
- `date`: Publication date
- `is_active`: Activation status

### Table Relationships

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

## 📜 Available Scripts

### Development

```bash
npm run dev          # Start development server
npm run proxy        # Start CORS proxy for Discord
```

### Production

```bash
npm run build        # Build application for production
npm start            # Start production server
```

### Code Quality

```bash
# The project uses ESLint for linting
# You can add custom scripts in package.json
```

---

## 🚀 Deployment

### Recommended Platforms

- **Vercel**: Recommended for Next.js (automatic deployment from Git)
- **Railway**: Good for PostgreSQL databases
- **DigitalOcean**: For dedicated servers
- **AWS**: For scalable infrastructure

### Production Deployment

The project includes an automated deployment script:

```bash
./deploy-sn.sh
```

Available options:
- `--skip-build`: Skip build step
- `--skip-deps`: Skip dependency installation

#### Manual Deployment Steps

1. **Prepare production environment**

```bash
# Create .env.production file
cp .env.example .env.production
# Edit with production credentials
```

2. **Build the application**

```bash
npm run build
```

3. **Configure Nginx**

The project includes a ready-to-use Nginx configuration in `nginx.conf`.

```bash
# Copy configuration
sudo cp nginx.conf /etc/nginx/sites-available/streetnetwork
sudo ln -s /etc/nginx/sites-available/streetnetwork /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

4. **Start with PM2**

```bash
# Start the application
pm2 start npm --name "streetnetwork-admin" -- start -- -p 3005

# Start CORS proxy
pm2 start proxy/corsProxy.mjs --name "streetnetwork-proxy"

# Save configuration
pm2 save
```

5. **Configure SSL with Let's Encrypt**

```bash
sudo certbot --nginx -d tmstreet.network -d www.tmstreet.network
```

### Production Environment Variables

Make sure to configure these variables in production:

```bash
# Clerk (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Database (Required)
DATABASE_URL=postgresql://user:password@production-host:5432/dbname

# Discord (Required for integration)
DISCORD_BOT_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_GUILD_ID=...

# Svix (Required for webhooks)
SVIX_API_KEY=...

# Application
NEXT_PUBLIC_APP_URL=https://tmstreet.network
NODE_ENV=production
```

---

## 🤝 Contributing

Contributions are welcome! If you want to contribute to the project, please follow these steps:

### How to Contribute

1. **Fork the repository**
2. **Create a branch for your feature** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Pull Request Process

1. Ensure your code follows the project standards
2. Update documentation if necessary
3. Add tests if you introduce new functionality
4. Ensure all tests pass
5. Clearly describe the changes in your PR

### Code Guidelines

- Use TypeScript for all new code
- Follow the existing code style
- Write clear and descriptive commits
- Add comments for complex code
- Keep components small and focused

---

## 📄 License

This project is property of Street Network. All rights reserved.

© 2026 Street Network. Unauthorized copying, distribution, or modification of this project is strictly prohibited.

---

## 💬 Support

Need help or have questions?

- **Email**: [isaac.streetnetwork@gmail.com](mailto:isaac.streetnetwork@gmail.com)
- **Discord**: [Join our server](http://discord.com/invite/4qNVmk464p)
- **Issues**: [Report a problem](../../issues)

---

## 🗺️ Roadmap

### Planned Future Features

- [ ] **Dashboard Improvements**
  - Customizable widgets
  - Real-time metrics
  - Charts and visualizations

- [ ] **Notification System**
  - Push notifications
  - User notification preferences
  - Notification history

- [ ] **Message Builder Improvements**
  - More predefined templates
  - Message scheduling
  - Sent message analytics

- [ ] **Additional Integrations**
  - Slack integration
  - Telegram integration
  - Custom webhooks

- [ ] **Vault Improvements**
  - Tag system
  - Advanced search
  - Data export

- [ ] **Reporting System**
  - Customizable reports
  - PDF/Excel export
  - Report scheduling

- [ ] **Security Improvements**
  - Mandatory 2FA for admins
  - Enhanced security logs
  - Access auditing

- [ ] **Public API**
  - API documentation
  - Rate limiting
  - API keys

---

<div align="center">

  ## 🎉 Thank you for using Street Network Admin!

  **Developed with ❤️ by the Street Network team**

  [Website](https://tmstreet.network/) • [Discord](http://discord.com/invite/4qNVmk464p) • [Email](mailto:isaac.streetnetwork@gmail.com)

  ---

  *Last updated: March 2026*

</div>