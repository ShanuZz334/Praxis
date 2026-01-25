# Shared Directory

This directory contains reusable components, utilities, and resources shared across all features.

## Structure

```
shared/
├── components/     # Reusable UI components
├── constants/      # App-wide constants
├── context/        # React context providers
├── global/         # Global logic and styles
└── utils/          # Utility functions
```

## Components

### Organization

- **backgrounds/** - Animated background components (ColorBends, GlitchText, TextType)
- **charts/** - Chart components for data visualization (see charts/index.js for barrel exports)
- **common/** - Generic UI components (Card, Button)
- **controls/** - Form controls and inputs
- **effects/** - Side effect components (MenuSync, MountReveal)
- **inputs/** - Input components
- **layouts/** - Layout components (Navbar, SideMenu, DashboardLayout, AuthLayout)
- **ui/** - Complex UI components (GlobalCard, GlobalHeader, PortalTooltip)

### Using Chart Components

Charts can be imported individually or via barrel export:

```javascript
// Individual import
import BuffettIndicatorChart from '@/shared/components/charts/valuation/BuffettIndicatorChart';

// Barrel export (recommended)
import { BuffettIndicatorChart, EPSGrowthChart } from '@/shared/components/charts';
```

## Utils

- **apiPaths.js** - API endpoint definitions
- **axiosInstance.js** - Configured Axios instance
- **chartAnimations.js** - Chart animation utilities
- **chartUtils.js** - Chart helper functions
- **data.js** - Menu data and navigation structure
- **fakeCandles.js** - Mock candle data generator
- **fakeFundData.js** - Mock fundamental data
- **helper.js** - General helper functions
- **uploadImage.js** - Image upload utilities

## Context

- **UserContext** - User authentication and profile state
- **VerificationContext** - Email/TOTP verification state

## Best Practices

1. Keep components generic and reusable
2. Avoid feature-specific logic in shared components
3. Use TypeScript interfaces for props (if migrating to TS)
4. Document complex components with JSDoc
