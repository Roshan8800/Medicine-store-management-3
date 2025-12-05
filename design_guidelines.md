# Binayak Pharmacy - Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required** - Multi-user pharmacy management system

**Implementation:**
- Custom email/password authentication with role-based access (Owner, Manager, Cashier)
- Optional biometric authentication (fingerprint/face ID) for quick access
- Strong password policies enforced
- Account screen must include:
  - User profile with role badge
  - Activity audit log access (for authorized roles)
  - Security settings (change password, biometric toggle)
  - Log out with confirmation
  - Support contact: roshan8800jp@gmail.com

**Onboarding:**
- Mandatory walkthrough on first launch using steppers
- Explain core flows: Billing, Barcode Scanning, Inventory Management
- Terms & privacy policy acceptance (versioned, with timestamp tracking)

### Navigation

**Root Navigation:** Bottom Tab Bar + Side Drawer (Hybrid)

**Bottom Navigation (5 Tabs):**
1. **Home/Dashboard** - KPIs, alerts, quick stats
2. **Billing/POS** - Primary transaction screen
3. **Inventory** - Medicine list and management
4. **Reports** - Analytics and exports
5. **Settings** - App configuration and preferences

**Top-Right Hamburger (☰) Opens Side Drawer:**
- Suppliers Management
- Purchase Orders
- Stock Adjustments
- Expiry Management
- Forecasting & AI Tools
- Backup & Restore
- User Management (Owner only)
- Audit Logs
- Help & FAQ
- About

**Core Action:** Floating Action Button (FAB) on Billing and Inventory tabs for quick "Add Medicine" and "New Bill"

## Screen Specifications

### Key Screens (50+ total required)

**1. Splash Screen**
- Display: App icon/logo
- Owner name: "Suman Sahu"
- App name: "Binayak Pharmacy"
- Smooth fade-in animation (800ms)

**2. Home/Dashboard**
- Header: Transparent with welcome message, notification bell (right), hamburger menu (right)
- Layout: Scrollable with cards showing:
  - Revenue summary (today/week/month)
  - Low stock alerts (count badge)
  - Expiring items (next 30 days)
  - Fast-moving products (top 5)
  - Quick action cards (New Bill, Add Medicine, View Reports)
- Bottom inset: tabBarHeight + Spacing.xl
- Top inset: headerHeight + Spacing.xl (transparent header)

**3. Billing/POS Screen**
- Header: Standard, title "New Bill", Cancel (left), Save Draft (right)
- Layout: Non-scrollable split view
  - Top half: Item list (scrollable within container)
  - Bottom half: Fixed calculator/total section
- Components: Barcode scanner button, manual search, item cards, discount/tax inputs, payment method selector
- FAB: Barcode scanner (bottom-right, with drop shadow)
- Safe areas: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl

**4. Medicine Inventory List**
- Header: Standard with search bar, Filter icon (right)
- Layout: Scrollable list with pull-to-refresh
- Components: 
  - Segmented controls for category filters (All, Expiring Soon, Low Stock, By Brand)
  - Medicine cards with image placeholder, name, batch, stock count, expiry badge
  - Infinite scroll with skeleton loaders
- FAB: Add Medicine
- Empty state: Illustration + "Add your first medicine" CTA

**5. Medicine Detail**
- Header: Standard, title = Medicine name, Edit (right)
- Layout: Scrollable
- Sections (as accordions):
  - Basic Info (name, brand, strength, category)
  - Pricing (MRP, cost, GST, discounts)
  - Stock (quantity, batches, locations)
  - Supplier Info
  - Sales History (chart + list)
- Bottom action bar: Delete (destructive, with double confirmation)

**6. Barcode Scanner**
- Full-screen camera overlay
- Header: Transparent with Cancel (left), Manual Entry (right)
- Scanning indicator: Animated frame in center
- On success: Show found item card with slide-up animation
- On not found: Quick action "Add New Medicine" with pre-filled barcode

**7. Reports Screen**
- Header: Standard, title "Reports", Export (right)
- Layout: Scrollable
- Components:
  - Date range picker (chips: Today, Week, Month, Custom)
  - Report type tabs: Sales, Purchase, Returns, Expiry, Inventory
  - Chart visualization (bar/line based on data)
  - Exportable table (CSV/Excel/PDF options)
- Cards with shadows for each report section

**8. Settings**
- Header: Standard, title "Settings"
- Layout: Scrollable grouped list
- Sections:
  - App Preferences (theme, language, units)
  - Notifications (toggles for each alert type, quiet hours)
  - Security (password, biometric, session timeout)
  - Backup & Sync (auto-backup toggle, last sync time, manual trigger)
  - About (app info, owner, version, support link)

**9. About Screen**
- Header: Standard, title "About"
- Layout: Scrollable, centered content
- Elements:
  - App icon (large, centered)
  - App name: "Binayak Pharmacy"
  - Owner: "Suman Sahu"
  - Created by: "Roshan"
  - Version string
  - Short description
  - Support email: roshan8800jp@gmail.com (tappable to compose email)
  - License/Terms links

**Additional Required Screens:**
Supplier List/Detail, Purchase Orders, Stock Adjustment, Expiry Management, Low Stock Alerts, AI Forecasting, User Management, Permissions, Notifications Center, Backup/Restore, Help/FAQ, Terms, Audit Log, Empty States (custom for each list), Error States (network, permission, validation)

## Design System

### Color Palette
- **Primary:** Professional pharmacy blue (#2196F3)
- **Accent:** Medical green (#4CAF50) for success states
- **Warning:** Amber (#FFA726) for low stock
- **Error:** Red (#F44336) for expiry alerts/destructive actions
- **Background:** Light (#F5F5F5), Dark (#121212) with dark mode support
- **Cards:** Elevated white (#FFFFFF) with subtle shadows
- **Text:** Primary (#212121), Secondary (#757575), Disabled (#BDBDBD)

### Typography
- **Headers:** Bold, 24-28sp
- **Subheaders:** Semibold, 18-20sp
- **Body:** Regular, 14-16sp
- **Captions:** Regular, 12-14sp
- **System Font:** Platform default (San Francisco on iOS, Roboto on Android)

### Spacing
- xl: 24px
- lg: 16px
- md: 12px
- sm: 8px
- xs: 4px

### Elevation & Shadows
- **Level 1 (Cards):** shadowOffset {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 2
- **Level 2 (Modals):** shadowOffset {width: 0, height: 2}, shadowOpacity: 0.08, shadowRadius: 4
- **Level 3 (FAB):** shadowOffset {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2

## Visual Design

### UI Components
- **Cards:** Elevated with rounded corners (8px), multiple variants (flat, expandable, interactive)
- **Buttons:** 
  - Primary: Filled with primary color, 48px height, ripple effect
  - Secondary: Outlined, same height
  - Text buttons for low-priority actions
- **Forms:** Material Design text inputs with floating labels, validation states (error/success indicators)
- **Lists:** Divided with subtle separators, swipe actions for quick operations
- **Badges:** Numeric badges (12px circle) for alerts/notifications
- **Chips:** Rounded (16px) for filters and tags
- **FAB:** 56x56px circle, primary color, drop shadow as specified

### Icons
- **Primary:** Feather icons from @expo/vector-icons
- **No emojis** in production UI
- **System icons** for standard actions (add, edit, delete, search, filter)
- **Custom medical icons** for pharmacy-specific features (pill, syringe, prescription)

### Animations & Transitions
- **Page transitions:** Slide from right (300ms ease-out)
- **Shared element transitions:** For medicine card → detail (500ms)
- **Skeleton screens:** Shimmer animation for loading states
- **Scroll:** Momentum scrolling, snap to position for carousels
- **Microinteractions:** Ripple on touch (all tappable elements), bounce on FAB press

### Visual Feedback
- **Touch feedback:** Material ripple effect (200ms)
- **Toasts:** Bottom-aligned, 3s auto-dismiss, swipe to dismiss
- **Loading:** Skeleton screens (primary), spinner for short waits (<2s)
- **Success/Error:** Color-coded toasts with icons

### Accessibility
- **Contrast ratio:** Minimum 4.5:1 for text
- **Touch targets:** Minimum 48x48dp
- **Font scaling:** Support system text size preferences
- **Screen reader:** All interactive elements labeled
- **Color blindness:** Don't rely on color alone (use icons + text)

### Special UI Elements
- **Glassmorphism panels:** For overlays and modal backgrounds (blur effect)
- **Gradient backgrounds:** Subtle gradients in headers and cards for depth
- **Empty states:** Custom illustrations with friendly messages + CTA buttons
- **Error states:** Icon + message + retry button, link to support

### Assets Required
- App icon/logo (pharmacy-themed, professional)
- Splash screen branding graphics
- Empty state illustrations (8-10 unique: empty inventory, no bills, no reports, etc.)
- Medicine placeholder images (generic pill/bottle/syringe icons)
- Tutorial walkthrough graphics (4-5 screens)