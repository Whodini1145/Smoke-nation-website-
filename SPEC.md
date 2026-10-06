# Smoke Nation — Website Spec & Planning Notes

> **Live (2026-10-06):** https://smoke-nation.web.app on Google Firebase (Hosting + Firestore + Auth). Deploy with `npm run deploy` (needs `firebase login`).
>
> **Status (2026-10-05):** First pass built — full storefront, cart/checkout, accounts and admin panel, running on sample data in the browser. See README.md.
> Next: owner review of the preview, then connect Supabase + Vercel, then payment processor.
> Store hours (from flyer): Mon–Thu 10am–8pm, Fri–Sat 10am–9pm, Sun 12pm–8pm. Address: 420 Pine St, Frankston, TX 75763. In-store policy: price match with a receipt.

---

## 0. Decisions Log (from planning chat, 2026-10-01)

These decisions were made after the original spec and **override it where they conflict**.

### Build & stack
- Hosting/backend left to the developer: **Supabase** (database, auth, photo storage) + **Vercel** (hosting).
- Keep the prototype's overall vibe and color palette, but the final site must look **much more polished and unique** — the prototype is a basic rough draft.

### Admin accounts (updated 2026-10-05)
- The first account made at Staff login is the **main admin**. Staff sign-up then closes.
- The main admin can give **any number** of other people staff access (Admin → Settings → Staff accounts: name, email, password) and remove it. Other staff get the full admin panel but can't add/remove staff.
- Admin access belongs to the account, not the device: on the live site (Supabase Auth) signing in on any phone or laptop gives the same admin access.

### Admin accounts (original)
- **Two admin accounts**: the site manager (cousin of the owner) and the owner. Each sets their own password. No hardcoded/shared password.

### Cart & checkout
- Full **cart + checkout** is required.
- Customer chooses **In-store pickup** or **Shipping**. **Both are paid online.**
- Show a short note at checkout for pickup orders, e.g. "Pickup orders are paid online — bring your ID when you pick up."
- **Sales tax:** Texas (store is in **Frankston, TX**). Tax applies to orders.
- Credit card processing fee also factors into totals — exact handling TBD with the payment processor.
- **Shipping cost:** TBD (may be flat, distance-based, or by order size). Build it as an admin setting so it can be changed later.
- **Minimum order:** TBD (probably none). Make it an admin setting, default off.
- **Shipping per category:** add an admin on/off switch for shipping per category (e.g., pickup-only for vapes if needed). Note: federal PACT Act + carrier policies heavily restrict shipping nicotine vapes, and THCA shipping is a gray area. The business says it has legal ways to sell — the switch lets them control this.
- Payment processor still TBD (must be cannabis/THC-friendly high-risk processor). Build checkout so the processor can be plugged in later.

### Customer accounts
- **Optional.** Guest checkout is allowed.
- Sign up with **email + password**.
- Signed-in customers get an **Order History** page: what they bought, when, how much.
- Each past item has a **"Buy again"** button.

### Orders tab (admin)
- New **Orders** tab: list of all orders with customer info, items, totals, pickup vs. shipping.
- Status updates: e.g. New → Ready → Picked Up / Shipped.
- Email/text/push notifications for new orders: **later** (build so they're easy to add).

### Sale prices (all products)
- Every product gets an **"On sale"** checkbox + **sale price** field in admin.
- Storefront shows the regular price **crossed out** next to the sale price.
- Works with bulk select (see below).

### Deals (vapes only)
- New **Deals** section in admin.
- Same navigation as the shop: pick brand at top (Foger, Geek Bar) → pick product line (e.g., Foger Pods, Geek Bar Pulse X2) → all flavors/items listed underneath.
- Create a deal by setting the rule, e.g. **"Any 2 for $35"** or **"$5 off when you buy 2"**, then check off which items qualify (multi-select / select all).
- Cart applies deals automatically. **Mixed flavors count.**
- **Deals repeat**: 4 qualifying items = deal applied twice, 6 = three times, etc.
- If an item qualifies for multiple deals, the cart picks **whichever saves the customer the most**.
- As soon as an item is checked into a deal, a **deal bar appears on that product card under the price** on the storefront (e.g. "DEAL · Buy 2 for $35"). Removing it or turning the deal off removes the bar.
- Deals can be edited, turned off, or deleted at any time.
- **Deals are vapes only.** THCA Flower does not get deals — its size pricing (bigger sizes cheaper per gram) is already the built-in discount.

### Bulk editing (whole admin panel)
- The multi-select list from Deals applies **everywhere** in admin product management.
- Select multiple items (or "select all" in a product line) and change in one step: **price, sale on/off + sale price, Sold Out, Running Low, add to/remove from a deal**.
- Example: Foger Pods drop in price → select all Foger Pod flavors → set new price once.

### THCA Flower pricing
- Each strain has **separate prices per size**: 1g, 3.5g, 7g, 14g, 1oz. Admin sets each.
- Example given (not final): 1g ≈ $10, 3.5g ≈ $30, 7g ≈ $50.
- All prices are entered by the admin — developer does not need real prices.

### Edibles
- **Not in the first launch.**

### About Us page (new)
- 2–3 short paragraphs, friendly/slightly cheesy backstory for legitimacy.
- Facts: owner is **Elvis Fernandes** (spelled with an **S**). Family-run (the site manager is his cousin). **Open since 2022.** Physical store in **Frankston, Texas**. Customer-first attitude ("we do our best for every customer").
- Spot for a **photo of the real storefront**.
- Store **hours and address** — pull from the flyer when provided (flyer itself doesn't need to be displayed).

### Design direction (added 2026-10-05)
- The prototype is only a guideline for features/layout. The final site must look **way different and unique** — it currently reads as plain, basic, boring.
- Use **background pictures and visual layering** to make the site pop (not flat white boxes everywhere), while keeping the trustworthy light base + green brand palette.
- Inspiration sites: **moodhemp / mood.com** and **geekbar.com** — big, high-quality product photography and bold presentation.
- Follow the `frontend-design` skill in `.claude/skills/frontend-design/`.

### Product photos (added 2026-10-05)
- Use **official product photos** for vapes rather than counter photos. Smoke Nation buys wholesale from Geek Bar and **has permission to use Geek Bar's product images**.
- Foger image permission: not yet confirmed — ask.
- Owner will send: **logo file** (high-res), **storefront photos**, flyer (hours/address).

### Product photos and Geek Bar names (added 2026-10-05)
- Vape product photos now come from the official brand sites: geekbar.com and fogertech.com (Foger's official site; foger.com points there).
- Geek Bar's own site calls the 25K device **Pulse X** and the 50K device **Pulse X 2**. Lines renamed to "Pulse X 25K" and "Pulse X 2 50K" to match. Confirm with the owner.
- Foger image permission still to confirm with the Foger distributor (Geek Bar permission confirmed).

### Catalog confirmation (added 2026-10-05)
- **Geek Bar Mate Kit 60K** and **Geek Bar Mate Pod 60K** are both sold. The pod is sold standalone in store even though Geek Bar's site doesn't list it separately (their site is wholesale-facing).

### Online ID check (added 2026-10-05)
- Required before payment (Texas law; federal PACT Act for shipped vapes). Will use a third-party age-verification service, likely bundled with the payment processor.
- The site has the slot ready: `src/lib/ageCheck.ts` (`verifyAge`). Checkout waits on it before placing the order and saves the result on the order; Admin → Orders shows it. Staff still check ID at pickup.

### Hosting notes (checked 2026-10-05)
- Vercel: allows legal products, but the free Hobby plan is for personal, non-commercial sites. A store needs Vercel Pro (about $20/month).
- Supabase: its acceptable use policy bans selling "controlled substances" and "drug paraphernalia". Hemp THCA is legal under hemp law but a gray area, so there is some risk of the account being flagged. Owner to decide.

### Stock counts (added 2026-10-06)
- Any product can have a stock count: units for vapes, grams for flower. Blank = not counted (status set by hand, as before).
- Online orders subtract automatically; counted items switch to "Running low" at the Settings thresholds (default 3 vapes / 14g) and "Sold out" at zero. Shoppers can't add more than what's left.
- Staff use the −1 / +1 buttons in Admin → Products for in-store sales and restocks, or set counts for many items at once (bulk Stock → Set count). Cancelling an order puts its items back.

### Foger flavors (added 2026-10-06)
- 70 Foger Switch Pro 30K pod flavors in the starter catalog (59 in stock, 11 sold out) with official names and photos from fogertech.com. Placeholder price $20, all in the sample 2-for-$35 deal.
- Names corrected to Foger's official spelling: Mexico Mango, Lime Berry Orange, Pink & Blue, Peach Berries Refresher, Dragon Melon, Frozen Banana, Blueberry Cotton Candy, Strawnana Ice Cream.

### Still to be decided
- Shipping cost model, minimum order, payment processor, order notifications (email/text), domain name, admin link final placement.

---

## 1. Brand

- **Name:** Smoke Nation
- **Tagline:** "Smoke Better. Live Better." — baked directly into the logo artwork (horizontal version), not rendered as separate text anywhere on the site
- **Logo:** Graffiti-style brush lettering, white "SMOKE" + green "NATION", smoke wisp and cannabis leaf accents, white background. Used as a full-width responsive image in the header (not re-created as CSS text). Must stay proportional across screen sizes, never stretched/distorted, never oversized on larger screens (cap max-width around ~420px even as the container widens).
- **Color palette:**
  - Primary green: `#4a8a1f`
  - Deep green: `#2f5f14`
  - Light green: `#8fc95f`
  - Pale green: `#e3f0d5`
  - Site background: white (`#ffffff`) — deliberately chosen over black/dark theme for trust/legitimacy (black read as "sketchy" to the client)
  - Ink/text: near-black (`#141414`)
- **Overall vibe:** bold/street-style logo, but clean, light, trustworthy site body — contrast is intentional.

---

## 2. Site-Wide Behavior

- **Age gate:** Full-screen modal on entry. "Are you 21 or older?" with confirm (enter) and decline (blocks access). Simple confirmation for now — stricter ID verification may be required depending on payment processor.
- **Logo tap/click:** Always returns to the homepage from any screen.
- **Fully responsive**, mobile-first:
  - Mobile (default): narrow single container, 2-column product grids
  - Tablet (≥700px): container ~700px, 3-column grids, larger touch targets (hamburger, pills)
  - Desktop (≥1000px): container ~1000px, 4-column grids
  - Large desktop (≥1300px): container ~1200px, 5-column grids
- Applies to: product grids, "Explore our products" tiles, hamburger menu tile grids.

---

## 3. Homepage

- **Header:** full-width logo image bar. Hamburger icon (☰) overlaid top-left, large/easy to tap.
- **Rotating banner carousel:**
  - Auto-rotates every ~3.5 seconds; swipeable on touch
  - Smooth horizontal **sliding** transition (not a cut or crossfade)
  - Dot indicators: one per slide (always matches slide count, never a blank slide); inactive dots subtle/semi-opaque; active dot is a filled green elongated pill
  - Tapping a dot jumps to that slide
  - Slide content: uploaded photo, or placeholder caption if none. Starting slides: logo/brand, storefront, flower, vape.
- **Search bar:** directly under the banner, above "Explore our products." Searches by category name and product/strain name (real search logic to be built).
- **"Explore our products":** tiles for **THCA Flower** and **Vapes**. Icon/photo on soft gradient, label underneath.
- **Reviews ("What people are saying"):**
  - Heading shows overall rating + review count (e.g. "4.7 stars, 40 Google reviews") — set independently in admin
  - Horizontal scroll of featured review cards: stars, text, reviewer name
- **Footer:** contact email, phone number (plus About Us link, address/hours).

---

## 4. Category Pages (THCA Flower / Vapes)

- Back button + category title
- **Sub-nav pill row:** horizontally scrollable — "Best Sellers" + sibling sub-categories. Pills scale up on tablet/desktop.
- **Product grid** (2 → 3 → 4 → 5 columns)
- **Product card:**
  - Background: radial gradient, white/pale in the **center**, color at the **edges** (edges must read clearly)
  - Photo fills card **height** 100%, width scales proportionally, auto-crops from sides — never small/floating
  - No photo → emoji/icon placeholder
  - **Potency indicator:** 4 segmented bars by tier (Greenhouse = 1, Top Tier Exotics = 4) — **THCA Flower only**
  - Price (with crossed-out regular price if on sale)
  - **Deal bar** under price if item is in an active deal (vapes)
  - Status badge: **Sold Out** (red) or **Running Low** (amber); default none
  - Description (see Section 6)
  - Add to cart (flower: choose size)

---

## 5. Catalog Structure

**THCA Flower** — sizes per strain: 1g, 3.5g, 7g, 14g, 1oz (price per size set in admin)
- Top Tier Exotics
- Indoor Hydroponics
- Indoor AAA
- Greenhouse (lowest tier — never phrase as "bad," just lower-potency)

**Nicotine Vapes**
- Foger
  - Foger Battery
  - Foger Pods — 30K puffs
- Geek Bar
  - Geek Bar Pulse X2 — 25K
  - Geek Bar Pulse X2 — 50K
  - Geek Bar Mate Kit — 60K
  - Geek Bar Mate Pod — 60K

Owner confirmed this lineup looks right. Individual flavors are products under each line.

**Not in first launch:** Edibles/Gummies.

---

## 6. Content Rules

- **Every THCA Flower description must automatically include the fixed, non-removable line:** `"Hemp-derived THC, low dose Delta 9"`. Admin can add extra text, but the disclaimer is enforced in code/template, never optional.
- **Vape descriptions are optional, freeform** (flavor notes, clarifying odd names).

---

## 7. Admin Panel

- **Access:** real login (two accounts — see Decisions Log). Low-key link at the bottom of the hamburger menu with whitespace above it. Final placement still pending owner input.

### 7.1 Products tab
- Switch THCA Flower / Vapes, then select tier/sub-category (vapes: brand → product line)
- Product list: thumbnail, name, price/status, description preview, actions: **Edit**, **Low Stock**, **Sold Out**, **Remove**
- **Multi-select + bulk actions** (price, sale, status, deal membership) — see Decisions Log
- **Edit (inline):** name, price(s) (per size for flower), sale toggle + sale price, description, color picker (10 swatches: red, orange, yellow, green, teal, blue, purple, pink, brown, gray), lighter/darker intensity slider, photo upload, **live preview** of the actual card
- **Add product form:** same fields + Add button
- Grid auto-adjusts to product count; must hold up at ~50 products per sub-category.

### 7.2 Deals tab (new — see Decisions Log)

### 7.3 Orders tab (new — see Decisions Log)

### 7.4 Home Screen tab
- **Banner slides:** list (Edit caption/photo, Remove), Add slide form. Carousel + dots mirror this list.
- **Reviews:** overall rating + count override; featured reviews list (Edit name/stars/text, Remove), Add review form.

### 7.5 Menu Panel tab
- Menu background green overlay intensity slider
- THCA Flower tiles / Vapes tiles: Edit (label, color + intensity, photo, live preview) / Remove / Add
- Tiles: responsive grid (2 cols mobile → 4 desktop), thumbnail above centered label

### 7.6 Settings (new)
- Shipping cost, minimum order, shipping on/off per category, tax rate, store hours/address/contact, About Us text + photo.

---

## 8. Open / To-Be-Decided

- Payment processor (cannabis/THC-friendly high-risk; Stripe/PayPal/Square prohibit this category)
- Shipping cost model + carrier/legal verification
- Minimum order
- Order notifications (email/text)
- Domain name
- Admin link final placement/styling
- Age verification level (checkbox vs. ID verification, depending on processor)
- Charity/donation messaging — maybe
- Help center — maybe

---

## 9. Production Requirements

1. Database (Supabase) for products, prices, photos, slides, reviews, status, deals, orders, customers
2. Hosting (Vercel)
3. Purchased domain pointed at hosting
4. Real authentication (admins + optional customer accounts)
5. Payment processor integration once selected
6. Cloud photo storage (Supabase Storage), not in-browser base64
