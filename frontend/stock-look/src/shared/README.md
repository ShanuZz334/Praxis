# Shared Directory

This directory contains reusable components, utilities, contexts, and resources shared across all features of the Stocky application.

## 📁 Directory Structure

```
shared/
├── components/     # Reusable UI components (54 files)
├── constants/      # App-wide constants
├── context/        # React context providers (6 files)
├── global/         # Global logic and styles (4 subdirectories)
└── utils/          # Utility functions (9 files)
```

---

## 🧩 Components

All components have been standardized with professional file headers, logical section organization, and clean documentation.

### Organization

#### **backgrounds/**
Animated background components for visual effects:
- `ColorBends.jsx` - Dynamic color gradient animations
- `GlitchText.jsx` - Glitch effect text animations
- `TextType.jsx` - Typewriter effect component

#### **charts/**
Comprehensive chart library for market data visualization (24 components):

**Root Charts:**
- `EPSGrowthChart.jsx` - Earnings per share growth visualization
- `MarketBreadthChart.jsx` - Market breadth indicators
- `NiftyPEChart.jsx` - Nifty PE ratio trends
- `PERatioChart.jsx` - Price-to-earnings ratio analysis

**Subdirectories:**
- `earnings/` - Earnings-related charts (EPS, growth, revisions)
- `macro/` - Macroeconomic indicators (GDP, inflation, rates)
- `liquidity/` - FII/DII flows and liquidity gauges
- `risk/` - Market stress and risk indicators
- `sector/` - Sector performance and heatmaps
- `valuation/` - Valuation metrics (PE, PB, Buffett Indicator)

**Usage:**
```javascript
// Individual import
import BuffettIndicatorChart from '@/shared/components/charts/valuation/BuffettIndicatorChart';

// Barrel export (recommended)
import { BuffettIndicatorChart, EPSGrowthChart } from '@/shared/components/charts';
```

#### **common/**
Generic UI building blocks:
- `Card.jsx` - Base card component with theme support
- `Button.jsx` - Standardized button component

#### **controls/**
Form controls and interactive elements:
- Various input controls and form elements

#### **effects/**
Side effect and lifecycle components:
- `MenuSync.jsx` - Menu state synchronization
- `MountReveal.jsx` - Mount animation effects

#### **inputs/**
Specialized input components:
- Form inputs with validation and styling

#### **layouts/**
Application layout components:
- `DashboardLayout.jsx` - Main dashboard wrapper
- `AuthLayout.jsx` - Authentication pages wrapper
- `Navbar.jsx` - Top navigation bar
- `SideMenu.jsx` - Side navigation menu
- Mobile-specific layout components

#### **modals/**
Modal dialog components:
- `SessionConflictModal.jsx` - Session conflict handler

#### **ui/**
Complex UI components:
- `GlobalCard.jsx` - Enhanced card with gradient borders
- `GlobalHeader.jsx` - Page header component
- `Loader.jsx` - Loading indicators
- `ThemeToggle.jsx` - Light/dark mode toggle
- `PortalTooltip.jsx` - Portal-based tooltips

---

## 🛠️ Utils

All utility files have been standardized with professional headers and clean organization.

### API & Network
- **apiPaths.js** - Centralized API endpoint definitions and BASE_URL configuration
- **axiosInstance.js** - Configured Axios instance with request/response interceptors, JWT handling, and session conflict detection
- **uploadImage.js** - Image upload with URL sanitization (localhost → BASE_URL, HTTP → HTTPS)

### Chart Utilities
- **chartUtils.js** - Comprehensive chart data processing:
  - Statistical calculations (bands, moving averages, normalization)
  - Data formatting (numbers, dates, deltas)
  - Color zone determination and regime detection
  - Tooltip context generation
- **chartAnimations.js** - Framer Motion animation configurations:
  - Spring configurations for smooth animations
  - Entrance, exit, and interaction variants
  - Stagger, fade, slide, scale, and path drawing animations

### Data & Mocks
- **data.js** - Side menu navigation configuration with icons and routes
- **fakeCandles.js** - Mock candlestick data generator for 10-minute intervals
- **fakeFundData.js** - Comprehensive mock data for all dashboard features:
  - Market indices (Nifty, Bank Nifty, SGX, world markets)
  - Options data (CE/PE, chain summary, PCR trends)
  - Fundamental data (FII/DII, institutional holdings, earnings calendar)
  - Technical data (VIX, sentiment, breadth, liquidity)
  - Macro indicators (currency, bonds, commodities)
  - Economic events and sector performance

### Helpers
- **helper.js** - General-purpose utility functions (email validation)

---

## 🔄 Context

All context files have been standardized and split into instance files to resolve Vite HMR warnings.

### **ThemeContext**
- **Files:** `ThemeContext.jsx`, `ThemeContextInstance.js`
- **Purpose:** Manages global theme state (Light/Dark mode) and visual effects
- **State:** `theme`, `vfxPreset`, `gradientBorder`
- **Persistence:** LocalStorage
- **Hook:** `useTheme()`

### **UserContext**
- **Files:** `UserContext.jsx`, `UserContextInstance.js`
- **Purpose:** Manages user session and authentication state
- **State:** `user`, `token`, `loading`
- **Features:**
  - JWT token management
  - Session monitoring (20s polling)
  - Session conflict detection
  - User data sanitization (image URLs)
- **Actions:** `updateUser()`, `clearUser()`

### **VerificationContext**
- **Files:** `VerificationContext.jsx`, `VerificationContextInstance.js`
- **Purpose:** Manages multi-step verification processes (Email OTP, TOTP)
- **State:** Verification status, signup token
- **Features:** Credential verification, state reset

---

## 🎨 Global

### **logic/**
- Global business logic and state management

### **styles/**
- Global CSS and theme definitions (3 files)

---

## 📋 Standardization Summary

### ✅ Completed
- **Components:** All 54 component files standardized
  - Backgrounds, Effects, Layouts
  - UI, Common, Controls, Inputs, Modals
  - Charts (Root & 6 subdirectories: earnings, macro, liquidity, risk, sector, valuation)
- **Context:** All 6 context files standardized
  - Split into instance files for HMR compliance
- **Utils:** All 9 utility files standardized
  - API & Network utilities
  - Chart utilities & animations
  - Mock data generators

### 🎯 Standards Applied
1. **Professional File Headers:**
   - File name, purpose, responsibilities
   - Key exports, dependencies
   - Lifecycle summary, date

2. **Logical Organization:**
   - Imports
   - Constants & Configuration
   - Helper Functions
   - Main Component/Logic
   - Exports

3. **Clean Comments:**
   - Section-level comments only
   - No inline/legacy comments
   - Intent-focused documentation

4. **Build Verification:**
   - All changes verified via `npm run build`
   - No regressions introduced

---

## 🚀 Best Practices

1. **Keep components generic and reusable** - Avoid feature-specific logic
2. **Use barrel exports** - Import from `@/shared/components/charts` instead of individual files
3. **Follow standardization patterns** - Use existing files as templates
4. **Document complex logic** - Add JSDoc headers for non-obvious functions
5. **Maintain HMR compliance** - Separate context instances from providers
6. **Verify builds** - Run `npm run build` after changes

---

## 📦 Import Patterns

```javascript
// Components
import { GlobalCard, GlobalHeader } from '@/shared/components/ui';
import { BuffettIndicatorChart } from '@/shared/components/charts';

// Utils
import { formatNumber, formatChartDate } from '@/shared/utils/chartUtils';
import axiosInstance from '@/shared/utils/axiosInstance';
import { API_PATHS } from '@/shared/utils/apiPaths';

// Context
import { useTheme } from '@/shared/context/ThemeContext';
import { UserContext } from '@/shared/context/UserContext';
```

---

**Last Updated:** 2026-02-04  
**Standardization Status:** ✅ Complete
