# PCRED website

## Categories CMS (Firebase Realtime Database)

Suites (categories) and their products are stored in the Firebase Realtime Database under `suits/`
and edited at **`/admin`**. The site subscribes live, so saved changes appear without a redeploy.
Until Firebase is configured, the site shows the built-in starter data from `src/lib/suits.js`.

### One-time setup

1. **Create the database.** Firebase console › Build › Realtime Database › Create database.
2. **Enable sign-in.** Firebase console › Build › Authentication › Sign-in method › enable **Email/Password**.
3. **Create an admin login.** Authentication › Users › Add user (email + password). Copy the user's **UID**.
4. **Mark it as an admin.** Realtime Database › Data: add a key `admins`, and under it a child keyed by the UID
   with two fields, `name` and `email`. Only accounts listed under `admins` can edit.
5. **Add the web config.** Copy `.env.example` to `.env.local` and fill in the values from
   Project settings › General › Your apps › Web app. Restart `npm run dev`.
6. **Deploy the security rules** (anyone can read `suits`, only admins can write):
   ```
   firebase deploy --only database
   ```
7. Open `/admin`, sign in, and press **Import starter data** to copy the current suites and products into the database.

For the production build, set the same `VITE_FIREBASE_*` values in the environment before `npm run build`.

### Checkout with OTP (Firebase Phone Authentication)

Checkout asks for name, email and mobile, verifies the mobile with an SMS code, then saves an enquiry.

1. Firebase console › Authentication › Sign-in method › enable **Phone**.
2. Sending real SMS needs the project on the **Blaze** (pay-as-you-go) plan. For testing without SMS,
   add test numbers and fixed codes under Phone › *Phone numbers for testing*.
3. Authentication › Settings › Authorized domains must list every domain the site runs on
   (localhost is there by default; add your live domain).
4. Deploy the rules again (`firebase deploy --only database`). They only accept an enquiry whose phone matches the
   number the customer verified.

### Data shape

```
suits/{slug}                 slug is the page address: /suits/{slug}
  name, summary, icon, order
  products/{id}               shown as "bundles" on the site and in the CMS
    name, description, price (rupees), documents[] (the products in the bundle, any number), order
enquiries/{id}               created at checkout (OTP-verified mobile), listed at /admin/enquiries
  name, email, phone, uid, items[], subtotal, discountPercent, discount, total, status, createdAt
discounts/{id}               cart-total tiers, edited at /admin/discounts
  minAmount (rupees), percent, active
schemes/                     synced monthly from the Udyam Scheme Report; see docs/schemes-sync.md
admins/{uid}                 key is the Firebase Auth UID
  name, email
```

### Local testing with emulators

Needs Java 21+. Run `firebase emulators:start --only auth,database --project demo-pcred` and set
`VITE_FIREBASE_EMULATORS=true` (with any non-empty demo values for the other `VITE_FIREBASE_*` keys).

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
