# Features Directory

This directory contains all feature modules organized by domain. Each feature is self-contained with its own UI, logic, and data.

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
