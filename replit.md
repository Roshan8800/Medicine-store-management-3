# Binayak Pharmacy Management System

A comprehensive pharmacy management solution built with React Native (Expo) and Express.js with PostgreSQL database.

## Overview

Binayak Pharmacy is a full-featured pharmacy management application designed for modern pharmacies. It includes inventory tracking, billing, expiry management, user authentication, role-based access control, and AI-powered features using Google Gemini.

## Recent Changes (December 2024)

### Security Updates
- **Firebase Configuration** - Moved API keys to environment variables (EXPO_PUBLIC_FIREBASE_API_KEY)
- **AI Endpoints** - All 11 AI endpoints protected with authenticateToken middleware

### AI Features (11 endpoints powered by Gemini 2.5)
- **AI Chat** - Interactive pharmacy assistant for questions and guidance
- **Drug Interactions** - Check potential interactions between medications
- **Medicine Alternatives** - AI-powered generic/alternative medicine suggestions
- **Demand Prediction** - Forecast future medicine demand based on history
- **Smart Search** - Intelligent search with semantic understanding
- **Sales Insights** - AI-generated sales analysis and recommendations
- **Prescription Analysis** - Parse and analyze prescription data
- **Expiry Risk** - Predict expiry risks and suggest actions
- **Customer Insights** - Generate customer behavior insights
- **Price Optimization** - AI-powered pricing recommendations
- **Inventory Summary** - Generate executive inventory reports

### New AI Screens (5 screens)
- **APISettingsScreen** - Configure AI provider and API keys
- **AIChatScreen** - Chat interface with pharmacy AI assistant
- **DrugInteractionsScreen** - Check drug interactions between medicines
- **AIInsightsScreen** - View AI-generated business insights
- **DemandForecastScreen** - Predict future medicine demand

### Enhanced Screens
- **SettingsScreen** - Comprehensive settings with AI config, API settings, appearance, notifications, security, data management
- **ProfileScreen** - Enhanced with image picker (proper permission handling) and user statistics

### New Screens Added (11 total)
- **CategoriesScreen** - Medicine category management with CRUD operations
- **CustomersScreen** - Customer management with contact import from device
- **NotificationsScreen** - Push notification center with expiry and stock alerts
- **AnalyticsScreen** - Sales analytics with interactive charts
- **SearchScreen** - Global search across medicines, invoices, and suppliers
- **QuickSaleScreen** - Fast POS interface with barcode scanning
- **PurchaseOrdersScreen** - Purchase order management and tracking
- **BackupRestoreScreen** - Data backup and restore functionality
- **PriceCheckScreen** - Quick barcode-based price lookup
- **ReceiptScreen** - Invoice receipt with printing capability
- **BiometricAuthScreen** - Biometric authentication (Face ID/Fingerprint)

### Advanced Components
- **SwipeableRow** - Swipeable list items with action buttons
- **AnimatedCard** - Touch-responsive animated card component
- **FloatingActionButton** - Expandable FAB menu
- **PullToRefresh** - Custom pull-to-refresh wrapper

### Gesture Features
- Swipe left/right for quick actions
- Long press for context menus
- Double tap for quick actions
- Pinch zoom on charts
- Pull to refresh on lists
- Drag and drop for reordering
- Shake to refresh
- Pan gestures for navigation

### Advanced Hooks
- **useGestures** - Comprehensive gesture handling utilities
- **useVoiceSearch** - Voice search capability (web)
- **useShakeDetection** - Shake detection using accelerometer
- **useOfflineMode** - Offline data handling with sync queue
- **useAutoSave** - Automatic draft saving

### Firebase Integration
- Real-time data sync
- Cloud backup
- Push notifications

## Project Architecture

### Technology Stack
- **Frontend**: React Native with Expo SDK 54
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack Query (React Query)
- **Navigation**: React Navigation 7
- **UI**: Custom iOS 26 Liquid Glass design system

### Directory Structure
```
client/
├── App.tsx                 # Main app entry
├── components/            # Reusable components
├── contexts/              # React contexts (Auth, Notifications)
├── hooks/                 # Custom hooks
├── lib/                   # Utilities (API, Firebase)
├── navigation/            # Navigation configuration
├── screens/               # Screen components
└── constants/             # Theme and constants

server/
├── index.ts               # Server entry
├── routes.ts              # API routes
├── storage.ts             # Database operations
└── db.ts                  # Database connection

shared/
└── schema.ts              # Database schema (Drizzle)
```

## User Preferences

### Design Guidelines
- iOS 26 Liquid Glass interface design
- Primary blue theme (#2196F3)
- Modern, clean typography
- Consistent spacing and padding
- Safe area handling on all screens
- Keyboard avoidance for forms

### Code Conventions
- TypeScript for type safety
- Functional components with hooks
- TanStack Query for data fetching
- Drizzle ORM for database operations
- JWT authentication with AsyncStorage

## Database Schema

### Core Tables
- **users** - User accounts with role-based access
- **suppliers** - Medicine suppliers
- **categories** - Medicine categories
- **medicines** - Medicine inventory
- **batches** - Medicine batches with expiry tracking
- **invoices** - Sales invoices
- **invoice_items** - Invoice line items
- **purchase_orders** - Purchase orders
- **stock_adjustments** - Stock adjustment logs
- **audit_logs** - Activity audit trail

## Authentication

- JWT-based authentication
- Role-based access: Owner, Manager, Cashier
- Biometric authentication support
- Session stored in AsyncStorage

## API Endpoints

### Authentication
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me

### Medicines
- GET /api/medicines
- GET /api/medicines/:id
- GET /api/medicines/barcode/:barcode
- GET /api/medicines/low-stock
- POST /api/medicines
- PUT /api/medicines/:id

### Invoices
- GET /api/invoices
- GET /api/invoices/:id
- POST /api/invoices
- GET /api/invoices/next-number

### Additional Endpoints
- GET/POST /api/customers
- GET /api/search
- GET /api/analytics
- GET /api/backup/export
- POST /api/backup/import
- GET/POST/PATCH/DELETE /api/categories
- GET/POST/PATCH /api/purchase-orders

## Firebase Configuration

- Project ID: binayak-pharmacy-c4a0f
- Features: Firestore, Storage, Authentication

## Running the App

1. The app runs on port 5000 (Express) and 8081 (Expo)
2. Scan QR code with Expo Go to test on device
3. Web version available at localhost:8081

## Known Limitations

- Voice search works on web only (requires SpeechRecognition API)
- Biometric auth requires Expo Go on iOS/Android
- Background sync requires development build for advanced features
