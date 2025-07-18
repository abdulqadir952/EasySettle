# EasySettle

EasySettle is a collaborative expense and trip management web application built with Next.js. It allows users to create trips, add participants, manage shared expenses, and settle balances easily. The project leverages modern UI components, hooks, and utility libraries for a seamless user experience.

## Features
- Create and manage trips
- Add, edit, and remove expenses
- Track participant balances
- Dashboard for trip summaries
- Export data to Excel


## Folder Structure
```
EasySettle/
│
├── src/
│   ├── ai/           # AI integrations and flows (Genkit)
│   ├── app/          # Next.js app directory (pages, layouts, styles)
│   ├── components/   # Reusable UI components (forms, dashboard, UI kit)
│   ├── hooks/        # Custom React hooks
│   └── lib/          # Utilities and type definitions
│
├── public/           # Static assets (icons, manifest)
├── .env              # Environment variables (not tracked in git)
├── .gitignore        # Git ignore rules
├── package.json      # Project dependencies and scripts
├── tailwind.config.js# Tailwind CSS configuration
└── README.md         # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (v18 or above)
- npm or yarn
- Firebase account
- Git

### Setup
1. **Clone the repository:**
   ```sh
   git clone https://github.com/abdulqadir952/EasySettle.git
   cd EasySettle
   ```
2. **Install dependencies:**
   ```sh
   npm install
   # or
   yarn install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your Firebase and other required credentials.

4. **Run the development server:**
   ```sh
   npm run dev
   # or
   yarn dev
   ```
   Open [http://localhost:9002](http://localhost:9002) to view the app.

### Scripts
- `npm run dev` – Start the Next.js development server
- `npm run build` – Build the app for production
- `npm run start` – Start the production server
- `npm run lint` – Lint the codebase
- `npm run typecheck` – Type-check the codebase

## Technologies Used
- **Next.js** – React framework for SSR and SSG
- **Tailwind CSS** – Utility-first CSS framework
- **Radix UI** – Accessible UI primitives
- **React Hook Form** – Form state management
- **xlsx** – Excel export

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)

---

> **Note:** This project is for educational/demo purposes. Be sure to secure your environment variables and secrets in production.
