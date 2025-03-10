# Migration Guide: Play Store Analysis Tool

## Overview
This guide outlines the step-by-step process to migrate the existing Play Store Analysis codebase to your fresh Remix project. This ensures we maintain all functionality while leveraging the latest Remix configurations and best practices.

## Pre-Migration Checklist
1. Verify fresh Remix setup is working
2. Document current state of old codebase
3. Backup old codebase

## Step 0: Fresh Project Verification & Analysis

### 0.1 Verify Fresh Setup
1. Confirm fresh Remix project is working:
```bash
# Test the fresh setup
npm run dev
# Verify in browser: http://localhost:3000
```

2. Check package.json matches required setup:
```json
{
  "scripts": {
    "build": "remix vite:build",
    "dev": "remix vite:dev",
    "lint": "eslint --ignore-path .gitignore --cache --cache-location ./node_modules/.cache/eslint .",
    "start": "remix-serve ./build/server/index.js",
    "typecheck": "tsc"
  }
}
```

3. Verify base dependencies are correct:
```json
{
  "dependencies": {
    "@remix-run/node": "^2.16.0",
    "@remix-run/react": "^2.16.0",
    "@remix-run/serve": "^2.16.0",
    "isbot": "^4.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@remix-run/dev": "^2.16.0",
    "@types/react": "^18.2.20",
    "@types/react-dom": "^18.2.7",
    "@typescript-eslint/eslint-plugin": "^6.7.4",
    "@typescript-eslint/parser": "^6.7.4",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.38.0",
    "eslint-import-resolver-typescript": "^3.6.1",
    "eslint-plugin-import": "^2.28.1",
    "eslint-plugin-jsx-a11y": "^6.7.1",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.1.6",
    "vite": "^6.0.0",
    "vite-tsconfig-paths": "^4.2.1"
  }
}
```

### 0.2 Prepare Old Codebase
1. Create a reference directory next to your fresh project:
```bash
# Assuming you're in your fresh Remix directory
cd ..
mkdir old-codebase-reference
cp -r /path/to/old/project/* old-codebase-reference/
```

2. Key files to reference:
   - Components: `app/components/`
   - Routes: `app/routes/`
   - Services: `app/services/`
   - Utilities: `app/utils/` or similar
   - Configuration files

### 0.3 AI Analysis Process
1. Share with AI:
   - Fresh project structure
   - Old codebase key files
   - Specific components to migrate
   - Current issues or concerns

2. Request AI to:
   - Review compatibility
   - Identify migration priorities
   - Suggest optimization opportunities
   - Provide targeted migration steps

## Step 1: Additional Dependencies & Configuration

### 1.1 Install Additional Dependencies
```bash
# UI Components
npm install flowbite flowbite-react @heroicons/react

# Data Visualization
npm install chart.js react-chartjs-2 recharts

# Data Processing
npm install google-play-scraper natural date-fns
```

### 1.2 Configuration Setup
1. Update `tsconfig.json`:
```json
{
  "include": ["remix.env.d.ts", "**/*.ts", "**/*.tsx"],
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "isolatedModules": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "target": "ES2022",
    "strict": true,
    "allowJs": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "~/*": ["./app/*"]
    },
    "noEmit": true
  }
}
```

2. Update `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";
import flowbite from "flowbite/plugin";

export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "node_modules/flowbite-react/lib/esm/**/*.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [flowbite],
} satisfies Config;
```

## Step 2: Project Structure Setup

### 2.1 Create Directory Structure
```
app/
├── components/
│   ├── analysis/
│   ├── charts/
│   ├── common/
│   └── layout/
├── constants/
├── hooks/
├── lib/
│   ├── analysis/
│   ├── scraper/
│   └── utils/
├── routes/
├── services/
├── styles/
└── types/
```

## Step 3: Code Migration

### 3.1 Core Components Migration
1. Move components in this order:
   - Layout components
   - Common UI components
   - Analysis components
   - Chart components

2. Update imports to use new path aliases:
```typescript
// Old
import { Button } from "../components/common";
// New
import { Button } from "~/components/common";
```

### 3.2 Routes Migration
1. Move routes maintaining the same structure
2. Update loader and action functions to use new Remix patterns
3. Verify form handling and data mutations

### 3.3 Services and Utils
1. Migrate analysis services
2. Update scraper implementation
3. Move utility functions

## Step 4: Data Layer Migration

### 4.1 State Management
1. Move context providers
2. Update hooks for data fetching
3. Verify caching implementation

### 4.2 API Integration
1. Update API routes
2. Verify rate limiting
3. Test error handling

## Step 5: Testing & Verification

### 5.1 Functionality Testing
- [ ] Comment scraping
- [ ] Sentiment analysis
- [ ] Feature detection
- [ ] Bug report classification
- [ ] Data visualization
- [ ] Export functionality

### 5.2 Performance Testing
- [ ] Load time verification
- [ ] Analysis speed
- [ ] Chart rendering
- [ ] API response times

## Step 6: Deployment

### 6.1 Vercel Setup
1. Update `vercel.json`:
```json
{
  "buildCommand": "remix vite:build",
  "devCommand": "remix vite:dev",
  "framework": "remix"
}
```

2. Environment Variables:
```
PLAY_STORE_API_KEY=
RATE_LIMIT_REQUESTS=200
RATE_LIMIT_WINDOW=60000
```

### 6.2 CI/CD Setup
1. Copy GitHub Actions workflows
2. Update deployment triggers
3. Configure environment secrets

## Common Issues & Solutions

### Import Path Resolution
- Issue: Module not found errors
- Solution: Verify tsconfig paths and vite configuration

### Styling Conflicts
- Issue: Flowbite/Tailwind conflicts
- Solution: Update content array in tailwind config

### API Rate Limiting
- Issue: Hitting Play Store limits
- Solution: Implement proper backoff strategy

## Verification Checklist
- [ ] All routes accessible
- [ ] Data fetching working
- [ ] Charts rendering correctly
- [ ] Exports functioning
- [ ] Error handling working
- [ ] Performance metrics met
- [ ] Accessibility maintained

## Rollback Plan
1. Keep old codebase backup
2. Document reversion steps
3. Maintain deployment history

## Support & Resources
- [Remix Documentation](https://remix.run/docs/en/main)
- [Flowbite React Components](https://www.flowbite-react.com)
- [Vercel Deployment Guide](https://vercel.com/docs/frameworks/remix) 