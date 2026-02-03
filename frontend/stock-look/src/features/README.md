# Features Architecture

The `src/features` directory contains the core business capabilities of the application, organized by domain. This architecture enables modularity, maintainability, and clear boundaries between different parts of the system.

## 📁 Directory Structure

```graphql
features/
├── 🔐 auth/           # Authentication & Authorization
├── 📊 dashboard/      # Main Application Modules
└── 👤 profile/        # User Profile Management
```

---

## 🔐 Auth Feature (`src/features/auth`)

Handles all user authentication flows including login, registration, and session management.

- **pages/**: `Login.jsx`, `SignUp.jsx` - Main entry points.
- **components/**: Reusable auth forms and inputs.
- **hooks/**: Custom hooks for auth state.

---

## 📊 Dashboard Features (`src/features/dashboard`)

The heart of the application, split into distinct functional domains.

### Core Modules

| Feature | Description | Key Components |
| :--- | :--- | :--- |
| **master/** | Main landing dashboard. | `MasterDashboard`, `StockyEngine` |
| **technical/** | Technical analysis & indicators. | `TechnicalPage`, `TechnicalCard`, `TechnicalModal` |
| **fundamentals/** | Company financial data. | `FundamentalPage`, `FundamentalCard` |
| **options/** | Derivatives & Greeks analysis. | `OptionsPage`, `OptionsChain` |
| **foreign/** | Global market indices & correlations.| `ForeignPage`, `GlobalRiskEngine` |
| **events/** | News & Economic Calendar. | `EventsPage`, `NewsFeed` |
| **journal/** | Trading log & performance notes. | `JournalPage`, `TradeLogTable` |
| **wallet/** | P&L tracking & performance stats. | `WalletPage`, `PerformanceMap` |
| **manual/** | User documentation & help. | `ManualDashboard`, `TopicDetail` |
| **settings/** | App configuration & preferences. | `SettingsPage` |
| **messages/** | User notifications & alerts. | `MessagesPage`, `MessageCard` |
| **about/** | App version & release info. | `AboutPage` |
| **routes/** | Internal dashboard routing. | `DashboardRoutes` |

### Standard Module Structure

All dashboard features strictly follow this 3-layer architecture:

1.  **UI Layer (`ui/`)**
    *   Pure React components.
    *   Responsible for rendering and user interaction.
    *   No complex business logic.

2.  **Engine Layer (`engine/`)**
    *   Pure JavaScript business logic.
    *   Calculations, algorithms, and data transformations.
    *   Testable and framework-independent.

3.  **Data Layer (`data/`)**
    *   Static configuration, mock data, and API schemas.
    *   Single source of truth for constants.

---

## 👤 Profile Feature (`src/features/profile`)

Manages user-specific data outside of global settings.

*   `ProfilePhotoSelector.jsx`: Component for uploading/managing user avatars.

---

## 🛠️ Standardization Rules

All files within `src/features` adhere to the **Strict Codebase Standardization** protocol:

1.  **Professional Headers**: Every file begins with a JSDoc-style header defining purpose, responsibilities, exports, and dependencies.
2.  **Sectioned Code**: Code is logically grouped (Imports, Constants, Logic, Render).
3.  **No Inline Comments**: Code is self-documenting; comments explain "why", not "what".
4.  **Production Grade**: Clean imports, strict linting, and optimized performance.

## Structure

```
features/
├── auth/           # Authentication & authorization
├── dashboard/      # Main dashboard features
├── profile/        # User profile management
└── public/         # Public-facing pages
```

## Dashboard Features

The `dashboard/` directory contains the core application modules:

- **about/** - About page and app information
- **events/** - Market events and news
- **foreign/** - Global markets and international indices
- **fundamentals/** - Fundamental analysis engine
- **journal/** - Trading journal and notes
- **manual/** - User manual and documentation
- **master/** - Master dashboard (home page)
- **options/** - Options analysis and Greeks
- **routes/** - Dashboard routing configuration
- **technical/** - Technical analysis indicators
- **wallet/** - Portfolio and P&L tracking

## Feature Module Pattern

Each feature typically follows this structure:

```
feature-name/
├── ui/             # React components
├── engine/         # Business logic
├── data/           # Data structures & constants
├── hooks/          # Custom React hooks
└── README.md       # Feature documentation
```

## Adding New Features

1. Create a new directory under `features/`
2. Follow the established module pattern
3. Register routes in `dashboard/routes/`
4. Update navigation in `shared/utils/data.js`
