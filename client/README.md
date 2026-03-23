# IMC Client - Instruments of Mass Creation

A Next.js + Tailwind CSS frontend for the Instruments of Mass Creation music intelligence platform.

## Design System

**Industrial Minimalism** – Monochrome with yellow accent
- **Primary Colors:** Black (#000000), White (#FFFFFF), Grays
- **Accent:** Yellow (#FFD700)
- **Typography:** JetBrains Mono (labels/codes), Inter (body/UI)

## Project Structure

```
client/
├── app/
│   ├── globals.css        # Global styles, font imports, reset
│   ├── layout.tsx         # Root layout with sidebar + top bar
│   └── page.tsx           # Landing/dashboard page
├── public/                # Static assets
├── next.config.js         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.ts     # Tailwind theme customization
├── postcss.config.js      # PostCSS configuration
└── package.json           # Dependencies
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Features

- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS 3** with custom industrial minimalism theme
- **Pre-configured fonts:** Inter + JetBrains Mono from Google Fonts
- **Layout:** Black sidebar (collapsed by default on mobile), white main content area
- **Global styles:** Reset, font imports, scrollbar styling, focus states
- **No extra dependencies** – minimal, clean setup

## Theme Customization

Tailwind theme is defined in `tailwind.config.ts`:
- Custom color palette (blacks, grays, yellow accent)
- Font families (sans: Inter, mono: JetBrains Mono)
- Extended typography scale

Edit `app/globals.css` for global utility classes like `.accent`, `.accent-bg`, `.accent-border`.

## Development Notes

- Sidebar is hidden on small screens (`hidden lg:block`)
- Yellow accent (#FFD700) used for active states, highlights, CTAs
- All interactive elements support hover → yellow accent transition
- Focus states use yellow outline (#FFD700) at 2px
