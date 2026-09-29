# MARA — One marketplace. Everywhere.

**MARA** is a complete international marketplace connecting independent creators, artisans, and discerning buyers across borders.

---

## 1. Product Architecture

MARA separates the marketplace into two distinct, high-fidelity experiences:

### Buyer Experience
- **Navigation (Exact 5 Destinations)**:
  1. `Home` (`/`)
  2. `Explore` (`/explore`, `/search`, `/category/:slug`)
  3. `Cart` (`/cart`) with dynamic real-time badge
  4. `Orders` (`/orders`, `/orders/:id`) with delivery timelines
  5. `Profile` (`/profile`, `/wishlist`)
- **Discovery**: Curated home hero, categories, featured products, search with real filters and sorting.
- **Transactions**: Complete 4-step checkout flow (Shipping, Delivery, Payment, Review) with verified order confirmation receipts and tracking.

### Seller Studio Experience
- **Navigation (Exact 5 Destinations)**:
  1. `Overview` (`/sell`)
  2. `Products` (`/sell/products`, `/sell/products/new`, `/sell/products/:id`)
  3. `Orders` (`/sell/orders`, `/sell/orders/:id`)
  4. `Messages` (`/sell/messages`)
  5. `Store` (`/sell/store`, `/store/:slug`)
- **Operations**:
  - Storefront activation onboarding
  - 6-section product publishing (Basic Info, Media, Pricing, Variants, Shipping, Review)
  - Real inventory tracking & stock decrements on purchase
  - Order fulfillment (Processing, Shipping with real tracking, Delivery confirmation)
  - Escrow balance management & financial activity ledger

---

## 2. Technical Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4
- **Routing**: `react-router-dom` with strict route mappings
- **Identity & Auth**: Firebase Authentication (Email/Password, Google OAuth, Email verification, Password reset)
- **Database & State**: Firebase Firestore with strict Eight Pillars ABAC security rules (`firestore.rules`)
- **Internationalization (i18n)**: English (`en`), Français (`fr`), Español (`es`), Kreyòl Ayisyen (`ht`)
- **Multi-Currency**: Independent currency selection (USD `$`, EUR `€`, CAD `CA$`, HTG `G`, GBP `£`)

---

## 3. Official Design System & Palette

- **MARA Yellow**: `#F4C430` (Primary CTA, Active states, Brand accents)
- **MARA Deep Green**: `#123C2F` (Seller experience, Trust markers, Secondary accents)
- **MARA Black**: `#101312` (Primary typography, Strong elements)
- **Soft Black**: `#181B19` (Dark surfaces, Footer)
- **Off White**: `#F7F7F3` (Main viewport background)
- **White**: `#FFFFFF` (Cards, Forms, Sheets)
- **Secondary Text**: `#6E746F`
- **Border**: `#E2E4DF`
- **Typography**: Inter (Display 32–40px, Titles 20–32px, Body 14–16px)

---

## 4. Development & Running

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type check
npm run lint

# Production build
npm run build
```
