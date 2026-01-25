# Source Directory

This is the root source directory for the Stocky application.

## Top-Level Structure

```
src/
├── app/            # Application shell and routing
├── assets/         # Static assets (images, icons)
├── features/       # Feature modules (domain-driven)
├── lib/            # Third-party library configurations
├── shared/         # Shared components and utilities
└── index.css       # Global styles
```

## Directory Purposes

### `/app`
Application initialization, root routing, and shell components.

### `/assets`
Static resources like images, icons, and fonts. Organized by type:
- `icons/` - SVG and icon files
- `images/` - Images and graphics

### `/features`
Feature-based modules organized by domain. Each feature is self-contained with its own UI, logic, and data. See [features/README.md](./features/README.md) for details.

### `/lib`
Configuration and setup for third-party libraries (e.g., utility functions, custom configurations).

### `/shared`
Reusable components, utilities, contexts, and resources shared across features. See [shared/README.md](./shared/README.md) for details.

## Import Aliases

The project uses path aliases for cleaner imports:

```javascript
// Instead of: import Card from '../../../shared/components/common/Card'
import Card from '@/shared/components/common/Card';
```

Configured in `vite.config.js`:
```javascript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

## Architecture Pattern

This project follows **Feature-Sliced Design (FSD)** principles:
- Features are isolated and self-contained
- Shared resources are centralized
- Clear separation between business logic and UI
- Domain-driven organization

## Getting Started

1. **Features** - Start here to understand the application modules
2. **Shared** - Review reusable components and utilities
3. **App** - Understand routing and application structure
