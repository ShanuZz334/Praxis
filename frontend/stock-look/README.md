# Stocky - Market Intelligence Platform

A comprehensive, institutional-grade stock market analysis platform built with React and Vite. Stocky provides real-time market data visualization, fundamental analysis, technical indicators, options analytics, and portfolio management tools.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server (localhost:5000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## 📁 Project Structure

```
frontend/stock-look/
├── src/
│   ├── app/              # Application shell and routing
│   ├── assets/           # Static assets (images, icons)
│   ├── features/         # Feature modules (12 dashboard features)
│   ├── lib/              # Third-party library configurations
│   ├── services/         # API service layer
│   ├── shared/           # Shared components, utils, contexts
│   └── index.css         # Global styles and theme system
├── public/               # Public static files
├── index.html            # HTML entry point
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── eslint.config.js      # ESLint configuration
└── package.json          # Dependencies and scripts
```

**See detailed documentation:**
- [src/README.md](./src/README.md) - Source directory overview
- [src/features/README.md](./src/features/README.md) - Feature modules documentation
- [src/shared/README.md](./src/shared/README.md) - Shared resources documentation

---

## 🎯 Features

### Dashboard Modules

1. **Master Dashboard** - Composite market overview with Stocky Gauge
2. **Fundamental Analysis** - PE ratios, earnings, institutional holdings
3. **Technical Analysis** - Market breadth, sentiment, VIX, liquidity
4. **Foreign Markets** - Global indices, currency strength, macro indicators
5. **Options Analytics** - Option chain, PCR trends, volatility analysis
6. **Events Calendar** - Economic events and earnings calendar
7. **Trading Journal** - Trade logging with P&L tracking and notes
8. **Wallet/Portfolio** - Portfolio management and performance stats
9. **Messages** - Internal messaging system
10. **Settings** - User preferences and theme customization
11. **Manual** - User documentation
12. **About** - Application information

### Authentication
- Email + Password login
- Multi-step verification (Email OTP + TOTP)
- Session management with conflict detection
- Admin-controlled TOTP onboarding

---

## 🛠️ Tech Stack

### Core
- **React 19** - UI framework
- **Vite 6** - Build tool and dev server
- **React Router v7** - Client-side routing

### Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Custom CSS Variables** - Theme system (light/dark mode)
- **Framer Motion** - Animation library

### Data Visualization
- **Recharts** - Primary charting library
- **Chart.js** - Additional chart types
- **Lightweight Charts** - Financial candlestick charts

### State Management
- **React Context API** - Global state (Theme, User, Verification)
- **Local State** - Component-level state with hooks

### HTTP & Data
- **Axios** - HTTP client with interceptors
- **Day.js** - Date manipulation
- **Moment.js** - Legacy date support

### UI Components
- **Lucide React** - Icon library
- **React Icons** - Additional icons
- **React Hot Toast** - Toast notifications
- **Emoji Picker React** - Emoji selection

### Development
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

---

## 🎨 Architecture

### Feature-Sliced Design (FSD)

The project follows **Feature-Sliced Design** principles:

```
features/
└── dashboard/
    └── [feature-name]/
        ├── data/       # Static data and constants
        ├── engine/     # Business logic and calculations
        └── ui/         # React components
```

**Benefits:**
- **Isolation** - Features are self-contained
- **Scalability** - Easy to add/remove features
- **Maintainability** - Clear separation of concerns
- **Testability** - Isolated business logic

### Shared Resources

Reusable components, utilities, and contexts are centralized in `/shared`:

```
shared/
├── components/     # 54 reusable UI components
├── context/        # 6 React context providers
├── utils/          # 9 utility files
├── global/         # Global logic and styles
└── constants/      # App-wide constants
```

### Import Aliases

Clean imports using path aliases:

```javascript
// ✅ Recommended
import { GlobalCard } from '@/shared/components/ui';
import { formatNumber } from '@/shared/utils/chartUtils';

// ❌ Avoid
import GlobalCard from '../../../shared/components/ui/GlobalCard';
```

---

## 🎨 Theme System

### Light & Dark Mode

The application supports both light and dark themes with automatic persistence:

```javascript
import { useTheme } from '@/shared/context/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  // theme: 'light' | 'dark'
}
```

### CSS Custom Properties

All colors and styles use CSS variables defined in `src/index.css`:

```css
/* Dark Mode */
--bg-app: #02050e;
--text-primary: rgba(255, 255, 255, 0.9);
--border-default: rgba(255, 255, 255, 0.15);

/* Light Mode */
--bg-app: #F5F7FA;
--text-primary: #0F172A;
--border-default: #000000;
```

### Tailwind Integration

Tailwind classes map to CSS variables:

```jsx
<div className="bg-background-card text-text-primary border-border-default">
  Content
</div>
```

---

## 📊 Data Flow

### API Communication

```
Component → Service → Axios Instance → Backend API
                ↓
         Response Interceptor
                ↓
         Context Update (if needed)
                ↓
         Component Re-render
```

### Key Services

- **userService.js** - User authentication and profile management
- **axiosInstance.js** - Configured HTTP client with JWT handling

### Context Providers

1. **ThemeContext** - Theme state and VFX preferences
2. **UserContext** - Authentication and user data
3. **VerificationContext** - Multi-step verification state

---

## 🔐 Authentication Flow

```
1. Login (Email + Password)
   ↓
2. Email OTP Verification
   ↓
3. TOTP Verification (Google Authenticator)
   ↓
4. Session Established
   ↓
5. JWT Token Stored
   ↓
6. Session Monitoring (20s polling)
```

### Session Management

- **JWT Token** - Stored in localStorage
- **Session Monitoring** - 20-second polling for session validity
- **Conflict Detection** - Automatic logout on session conflicts
- **Axios Interceptors** - Automatic token injection and error handling

---

## 📝 Code Standards

### File Structure

All files follow a standardized structure:

```javascript
/**
 * @file FileName.jsx
 * @purpose What this file does
 * @responsibilities
 * - Bullet point 1
 * - Bullet point 2
 * @key_exports
 * - Export 1, Export 2
 * @dependencies
 * - Internal and external dependencies
 * @lifecycle
 * - When and how this file is used
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================

// =============================
// Component/Logic
// =============================
```

### Naming Conventions

- **Components** - PascalCase (`GlobalCard.jsx`)
- **Utilities** - camelCase (`chartUtils.js`)
- **Constants** - UPPER_SNAKE_CASE (`API_PATHS`)
- **CSS Classes** - kebab-case (`card-gradient-border`)

### Best Practices

1. **Keep components focused** - Single responsibility
2. **Use barrel exports** - Import from index files
3. **Leverage shared resources** - Don't duplicate code
4. **Follow HMR compliance** - Separate context instances
5. **Verify builds** - Run `npm run build` after changes

---

## 🧪 Development Workflow

### Adding a New Feature

1. Create feature directory in `src/features/dashboard/[feature-name]`
2. Follow the `data/engine/ui` structure
3. Add professional file headers
4. Import shared resources via `@/shared`
5. Update routing in `src/app/routes.jsx`
6. Verify build: `npm run build`

### Working with Charts

```javascript
// Import from barrel export
import { BuffettIndicatorChart, EPSGrowthChart } from '@/shared/components/charts';

// Use chart utilities
import { formatNumber, formatChartDate } from '@/shared/utils/chartUtils';
import { chartEntranceSpring } from '@/shared/utils/chartAnimations';
```

### Styling Guidelines

1. Use Tailwind utilities first
2. Leverage CSS custom properties for colors
3. Use `className` composition with `clsx` or `tailwind-merge`
4. Apply gradient borders via `.card-gradient-border` class

---

## 📦 Build & Deployment

### Production Build

```bash
npm run build
```

**Output:** `dist/` directory with optimized assets

### Build Optimization

- **Code Splitting** - Automatic route-based splitting
- **Tree Shaking** - Unused code elimination
- **Minification** - CSS and JS minification
- **Asset Optimization** - Image and font optimization

### Environment Variables

Create `.env` file for environment-specific configuration:

```env
VITE_API_URL=http://localhost:8000
```

Access in code:

```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## 🐛 Troubleshooting

### Common Issues

**Build Errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**HMR Not Working:**
- Check that context instances are separated from providers
- Verify Vite server is running on correct port (5000)

**TypeScript Warnings:**
- These are IDE warnings, not build errors
- The project uses JavaScript with TypeScript for IntelliSense only
- Build will succeed despite warnings

---

## 📚 Additional Resources

- **Vite Documentation:** https://vitejs.dev/
- **React Documentation:** https://react.dev/
- **Tailwind CSS:** https://tailwindcss.com/
- **Recharts:** https://recharts.org/
- **Framer Motion:** https://www.framer.com/motion/

---

## 📄 License

Private - Institutional Use Only

---

## 👥 Contributing

This is a private project. For internal development guidelines, see:
- [src/README.md](./src/README.md)
- [src/features/README.md](./src/features/README.md)
- [src/shared/README.md](./src/shared/README.md)

---

**Last Updated:** 2026-02-04  
**Standardization Status:** ✅ Complete (230+ files)  
**Build Status:** ✅ Passing  
**Version:** 0.0.0
