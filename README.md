# HomeBridge Telegram Mini App

HomeBridge connects renters with brokers who post homes for rent. It is built with React, TypeScript, and Vite, and includes Telegram Mini App initialization with a browser fallback for local development.

## Run locally

```bash
npm install
npm run dev
```

## Build for deployment

```bash
npm run build
```

Deploy the generated app to a public HTTPS host, then configure the URL in `@BotFather` using `Bot Settings` > `Configure Mini App` or `/setmenubutton`.

## Current features

- Browse and filter rental listings
- Switch between renter and broker modes
- Publish a listing to the local feed
- Initialize Telegram WebApp theme, user, and viewport APIs
- Send viewing requests through Telegram when opened from a WebApp keyboard button

Listings are currently stored in memory. A backend and Telegram bot handler are needed for persistent listings, authentication, and a real broker inbox.
