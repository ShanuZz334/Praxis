# Source Directory

This is the root source directory for the **Stocky** application - a comprehensive market intelligence platform for institutional-grade stock analysis.

---

## 📁 Top-Level Structure

```
src/
├── app/            # Application shell and routing (4 files)
├── assets/         # Static assets (images, icons)
├── features/       # Feature modules - domain-driven (141 files)
├── lib/            # Third-party library configurations
├── services/       # API service layer
├── shared/         # Shared components and utilities (75 files)
└── index.css       # Global styles and theme system
```

---

## 📂 Directory Overview

### `/app` - Application Shell
**Purpose:** Application initialization, root routing, and shell components.

**Key Files:**
- `App.jsx` - Root application component with providers
- `routes.jsx` - Application-level routing configuration
- `main.jsx` - Application entry point

**Standardization:** ✅ Complete
- Professional file headers applied
- Clean routing structure
- Provider hierarchy optimized

---

### `/assets` - Static Resources
**Purpose:** Static resources like images, icons, and fonts.

**Organization:**
- `icons/` - SVG and icon files
- `images/` - Images and graphics

---

### `/features` - Feature Modules
**Purpose:** Feature-based modules organized by domain. Each feature is self-contained with its own UI, logic, and data.

**Features:**
- **auth/** - Authentication (Login, Signup, Verification)
- **dashboard/** - Main dashboard modules:
  - `about/` - About page
  - `events/` - Economic events calendar
  - `foreign/` - Global markets analysis
  - `fundamentals/` - Fundamental analysis
  - `journal/` - Trading journal
  - `manual/` - User manual
  - `master/` - Master dashboard
  - `messages/` - Messaging system
  - `options/` - Options analysis
  - `settings/` - User settings
  - `technical/` - Technical analysis
  - `wallet/` - Portfolio management
- **profile/** - User profile management

**Architecture Pattern:**
Each feature follows a consistent structure:
```
feature/
├── data/       # Static data and constants
├── engine/     # Business logic and calculations
└── ui/         # React components
```

**Standardization:** ✅ Complete
- All 141 feature files standardized
- Professional headers on all files
- Clean separation of concerns (data/engine/ui)
- Build-verified after each feature

**See:** [features/README.md](./features/README.md) for detailed feature documentation.

---

### `/lib` - Library Configurations
**Purpose:** Configuration and setup for third-party libraries.

**Files:**
- `utils.ts` - Utility functions and helpers

**Standardization:** ✅ Complete

---

### `/services` - API Services
**Purpose:** API service layer for backend communication.

**Files:**
- `userService.js` - User-related API calls

**Standardization:** ✅ Complete

---

### `/shared` - Shared Resources
**Purpose:** Reusable components, utilities, contexts, and resources shared across all features.

**Organization:**
- **components/** (54 files) - Reusable UI components
  - `backgrounds/` - Animated backgrounds
  - `charts/` - Chart library (24 components)
  - `common/` - Generic UI (Card, Button)
  - `controls/` - Form controls
  - `effects/` - Side effects
  - `inputs/` - Input components
  - `layouts/` - Layout components
  - `modals/` - Modal dialogs
  - `ui/` - Complex UI components

- **context/** (6 files) - React context providers
  - `ThemeContext` - Theme and VFX management
  - `UserContext` - Authentication state
  - `VerificationContext` - Multi-step verification

- **utils/** (9 files) - Utility functions
  - API & Network utilities
  - Chart utilities & animations
  - Mock data generators

- **global/** - Global logic and styles
- **constants/** - App-wide constants

**Standardization:** ✅ Complete
- All 75 shared files standardized
- HMR-compliant context pattern
- Professional documentation throughout

**See:** [shared/README.md](./shared/README.md) for detailed shared resources documentation.

---

### `/index.css` - Global Stylesheet
**Purpose:** Global styles, theme system, and CSS custom properties.

**Features:**
- Light/Dark theme variables
- Premium scrollbar styling
- Gradient border utilities
- Background VFX animations
- Tailwind CSS integration

**Standardization:** ✅ Complete
- Professional file header
- Clean section organization
- Comprehensive theme tokens

---

## 🎯 Import Aliases

The project uses path aliases for cleaner imports:

```javascript
// ✅ Recommended
import Card from '@/shared/components/common/Card';
import { useTheme } from '@/shared/context/ThemeContext';
import { formatNumber } from '@/shared/utils/chartUtils';

// ❌ Avoid
import Card from '../../../shared/components/common/Card';
```

**Configuration:** `vite.config.js`
```javascript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

---

## 🏗️ Architecture Pattern

This project follows **Feature-Sliced Design (FSD)** principles:

1. **Feature Isolation** - Each feature is self-contained with its own data, logic, and UI
2. **Shared Resources** - Common components and utilities are centralized in `/shared`
3. **Clear Separation** - Business logic (engine) is separated from presentation (UI)
4. **Domain-Driven** - Features are organized by business domain, not technical layer

**Benefits:**
- Easy to locate and modify feature-specific code
- Minimal coupling between features
- Scalable architecture for large teams
- Clear ownership and responsibility boundaries

---

## 📋 Standardization Summary

### ✅ Completed Standardization

**Application Shell:**
- ✅ `/app` - All 4 files standardized

**Features:**
- ✅ Authentication (`auth/`)
- ✅ Dashboard modules (12 features, 141 files total)
  - About, Events, Foreign, Fundamentals, Journal
  - Manual, Master, Messages, Options, Settings
  - Technical, Wallet
- ✅ Profile management

**Shared Resources:**
- ✅ Components (54 files)
  - Backgrounds, Charts, Layouts, UI, Common, Controls
- ✅ Context (6 files with HMR compliance)
- ✅ Utils (9 files)

**Services & Libraries:**
- ✅ `/services` - User service standardized
- ✅ `/lib` - Utils standardized

**Styles:**
- ✅ `index.css` - Global stylesheet standardized

### 🎯 Standards Applied

1. **Professional File Headers:**
   - File name, purpose, responsibilities
   - Key exports, dependencies
   - Lifecycle summary, date

2. **Logical Organization:**
   - Imports → Constants → Helpers → Main Logic → Exports
   - Clear section comments
   - No inline/legacy comments

3. **Build Verification:**
   - All changes verified via `npm run build`
   - Zero regressions introduced

---

## 🚀 Development Guidelines

### Adding New Features

1. Create feature directory in `/features/dashboard/`
2. Follow the data/engine/ui structure
3. Use standardized file headers
4. Import shared resources via `@/shared`
5. Verify build after implementation

### Working with Shared Resources

1. Check `/shared` before creating new components
2. Use barrel exports for charts: `import { Chart } from '@/shared/components/charts'`
3. Follow HMR-compliant context pattern (separate instance files)
4. Document complex utilities with JSDoc

### Styling Guidelines

1. Use CSS custom properties from `index.css`
2. Leverage Tailwind utilities
3. Respect light/dark theme tokens
4. Use gradient borders via `.card-gradient-border` class

### Code Quality

1. Run `npm run build` before committing
2. Follow existing file structure patterns
3. Keep components focused and reusable
4. Avoid feature-specific logic in `/shared`

---

## 📚 Additional Documentation

- **Features:** [features/README.md](./features/README.md)
- **Shared Resources:** [shared/README.md](./shared/README.md)
- **Task Tracking:** See `brain/task.md` for current work items
- **Walkthrough:** See `brain/walkthrough.md` for implementation details

---

## 🔧 Tech Stack

- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS + Custom CSS Variables
- **State Management:** React Context API
- **Charts:** Recharts
- **Animations:** Framer Motion
- **HTTP Client:** Axios
- **Icons:** Lucide React Icons
- **Routing:** React Router v6

---

**Last Updated:** 2026-02-04  
**Standardization Status:** ✅ Complete (220+ files)  
**Build Status:** ✅ Passing
