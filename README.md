# Basket

**Basket** is a smart, shared shopping list application built by [Teda.dev](https://teda.dev). It runs entirely in the browser using modern web technologies, offering offline capabilities and local AI integration.

## Features

- **Smart Sorting**: AI-powered categorization of list items.
- **Chef Bot**: A client-side AI assistant (WebLLM) that suggests recipes and ingredients.
- **Instant Sync**: Uses local storage events for instant updates across tabs in the same browser.
- **Snapshot Sharing**: Share lists via URL with base64 encoding (no server required).
- **Mobile First**: Designed for touch interaction and small screens.
- **Privacy Focused**: All data stays on your device.

## Tech Stack

- HTML5, CSS3
- Tailwind CSS (CDN)
- jQuery 3.7.x
- WebLLM (Client-side AI)

## How to Use

1. Open `index.html` to see the landing page.
2. Click "Start Shopping" to enter the app (`app.html`).
3. Wait for the AI model to initialize (status bar in header) to use smart features.
4. Add items naturally or ask the Chef Bot for help.