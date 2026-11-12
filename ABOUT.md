# 📖 About IPO Money Handler

## 🎯 Motivation & Problem Statement

In the modern Indian stock market, applying for Initial Public Offerings (IPOs) often involves managing multiple applications across different family members to maximize allotment odds. Investors frequently use multiple Demat accounts across brokers like Zerodha, Groww, AngelOne, Upstox, Dhan, and traditional banking brokerages.

However, investors face several critical challenges:
1. **Capital Locking Confusion**: Money is blocked under ASBA / UPI mandates across different bank accounts, making it difficult to calculate available liquid cash.
2. **Scattered Applications**: Tracking allotment status, mandate authorizations, and refund timelines across 5–10 accounts requires logging into multiple apps.
3. **P&L & Historical Oversight**: Calculating true returns, listing day gains, and long-term capital distribution becomes chaotic without a centralized hub.

**IPO Money Handler** solves this by providing a unified, privacy-focused, offline-first cockpit to organize all applications, family profiles, Demat accounts, and portfolio performance in one intuitive place.

---

## 🏛 Architecture & Engineering Highlights

```
┌────────────────────────────────────────────────────────────┐
│                    Next.js 15 UI Layer                     │
│    (Dashboard · Holdings · Live Market · OCR · Family)     │
└─────────────────────────────┬──────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Zustand Store   │
                    │ (Persistent State)│
                    └─────────┬─────────┘
                              │
             ┌────────────────┴────────────────┐
             │                                 │
   ┌─────────▼─────────┐             ┌─────────▼─────────┐
   │ Capacitor Bridge  │             │   Browser Local   │
   │ (Android Native)  │             │     Storage       │
   └─────────┬─────────┘             └───────────────────┘
             │
 ┌───────────┴───────────┐
 │ Native Device APIs:   │
 │ • Clipboard & Share   │
 │ • File System Export  │
 │ • Status Bar Control  │
 └───────────────────────┘
```

### 1. Offline-First Privacy Architecture
All financial data, account numbers, family member names, and transaction histories reside **strictly on your device**. No third-party servers, tracking pixels, or database leaks. Data can be exported to JSON for backup or imported seamlessly across devices.

### 2. Multi-Profile Scoping
The app supports granular scoping:
- **Individual Profile Mode**: Work in the context of a single family member (e.g., viewing only accounts, mandates, and applications belonging to that person).
- **All Accounts Aggregate Mode**: Switch effortlessly to the global view to analyze aggregate blocked funds, total portfolio value, and collective allotment distribution.

### 3. OCR & Auto-Detection
Designed with a built-in OCR scanner module that parses broker screenshots, extracts broker identities (by matching logos/names against a recognized database of 30+ brokers), recognizes application numbers, and auto-calculates lot sizes.

### 4. 120 FPS Native-Feel UI
Engineered for smooth gesture handling, responsive bottom-sheet drawers with spring physics, edge-to-edge transparent navigation bar on Android, and dual-mode theme switching.

---

## 👨‍💻 Developer & Maintainer

- **Developer**: Hetansh Patel
- **GitHub**: [@hetansh21-pro](https://github.com/hetansh21-pro)
- **Portfolio**: [hetansh21-pro](https://github.com/hetansh21-pro)
