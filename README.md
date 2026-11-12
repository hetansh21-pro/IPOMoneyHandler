# 📊 IPO Money Handler

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor)](https://capacitorjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

> **Comprehensive financial management application designed for tracking, managing, and calculating IPO application investments across multiple family and Demat accounts.**

---

## 📸 Screenshots

| 🏠 Home Dashboard | 💳 Demat & Family Accounts |
| :---: | :---: |
| <img src="screenshots/ipo-home.jpg" width="360" alt="IPO Home Dashboard" /> | <img src="screenshots/ipo-accounts.jpg" width="360" alt="Demat and Family Accounts" /> |

| 📈 All Accounts Holdings | ⚡ Live Market & IPO Verification |
| :---: | :---: |
| <img src="screenshots/ipo-holdings.jpg" width="360" alt="All Accounts Holdings View" /> | <img src="screenshots/ipo-live.jpg" width="360" alt="Live IPO Market Verification" /> |

<details>
<summary><b>🔍 View Additional Screenshots</b></summary>

| 👥 Family Profile Scope | 📜 Application History | ⚙️ Settings & Theme |
| :---: | :---: | :---: |
| <img src="screenshots/ipo-family.jpg" width="260" alt="Family Profile Scope" /> | <img src="screenshots/ipo-history.jpg" width="260" alt="Application History" /> | <img src="screenshots/ipo-settings-1.jpg" width="260" alt="Settings & Customization" /> |

</details>

---

## ✨ Key Features

- **Multi-Profile & Family Demat Scoping**: Manage multiple family members and broker Demat accounts (Zerodha, Groww, AngelOne, Upstox, ICICI Direct, HDFC Sky, Kotak Neo, etc.) under unified or segregated profiles.
- **Combined Holdings & Accounts View**: Toggle between a specific profile and the global "All Accounts" view to get a bird's-eye view of your entire portfolio.
- **Fund Blocking & Release Tracker**: Instantly calculate blocked ASBA/UPI funds, allotment probability, returns, and real-time net worth impact.
- **Intelligent Demat OCR Scanner**: Auto-detect brokers, lot multipliers, and application numbers directly from screenshots or camera capture.
- **Live Market Verification**: Real-time Grey Market Premium (GMP) updates, subscription rates, issue dates, and allotment timelines.
- **Profit & Loss Analytics**: Comprehensive historical analytics with offline JSON backup, CSV exports, and detailed report generation.
- **Modern Mobile Native UX**: 120fps smooth spring dismiss bottom sheets, edge-to-edge transparent status bar, and adaptive theme switching.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Static Export)
- **Frontend**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Mobile Runtime**: [Capacitor 8](https://capacitorjs.com/) (Android Bridge)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Persistent Local Store)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons & Animation**: [Lucide React](https://lucide.dev/) & Canvas Confetti

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ (Node 20+ recommended)
- **npm** or **yarn** / **pnpm**
- **Android Studio** (for building Android APK / running on device)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hetansh21-pro/IPOMoneyHandler.git
   cd IPOMoneyHandler
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build web export**:
   ```bash
   npm run build
   ```

### 📱 Android Build (Capacitor)

1. **Sync with Android**:
   ```bash
   npx cap sync android
   ```

2. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

3. Run on your physical Android device or emulator to generate the debug/release APK.

---

## 📖 About the Project

For an in-depth breakdown of the project architecture, design decisions, and data flows, see [**ABOUT.md**](ABOUT.md).

---

## 👤 Author

**Hetansh Patel**
- GitHub: [@hetansh21-pro](https://github.com/hetansh21-pro)
