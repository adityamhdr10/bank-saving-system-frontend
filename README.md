# Bank Saving System - Frontend

Aplikasi manajemen perbankan untuk mengelola customer, akun deposito, dan transaksi dengan perhitungan bunga.

## Tech Stack

- React 19.2.0
- TypeScript 4.9.5
- Tailwind CSS
- shadcn/ui
- Axios
- SweetAlert2

## Fitur

- **Customer Management** - CRUD data customer
- **Deposito Type Management** - Kelola paket deposito dan return rate
- **Account Management** - Kelola akun customer dengan paket deposito
- **Deposit Transaction** - Proses transaksi deposit
- **Withdrawal Transaction** - Proses penarikan dengan perhitungan bunga compound

## Prerequisites

- Node.js (v16 atau lebih tinggi)
- npm atau yarn

## Instalasi

1. Clone repository:
```bash
git clone <repository-url>
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Jalankan aplikasi:
```bash
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`

## Build Production

```bash
npm run build
```

## Deployment ke Railway

1. Push code ke GitHub
2. Buat project baru di [Railway](https://railway.app)
3. Connect repository GitHub
4. Konfigurasi:
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve -s build -l $PORT`
5. Generate domain

## Struktur Project

```
src/
├── components/           # Komponen React
│   ├── ui/              # Komponen UI (shadcn)
│   ├── CustomerManagement.tsx
│   ├── AccountManagement.tsx
│   ├── DepositoTypeManagement.tsx
│   ├── DepositTransaction.tsx
│   └── WithdrawalTransaction.tsx
├── services/
│   └── api.tsx          # Konfigurasi API
├── App.tsx              # Main component
└── index.tsx            # Entry point
```

## API Backend

Backend API: `https://bank-saving-system-api-production.up.railway.app/api`

### Endpoints:
- `/customers` - Manajemen customer
- `/deposito-types` - Manajemen tipe deposito
- `/accounts` - Manajemen akun
- `/transactions/deposit` - Deposit
- `/transactions/withdraw` - Withdrawal

## Author

Aditya Mahendra
