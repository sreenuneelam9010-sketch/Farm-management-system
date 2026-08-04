# Lakshmi Venkateshwara Sheep & Natu Kolla Farm Management System

A production-ready, full-stack farm management web and mobile application built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

---

## 🌟 Key Features

### 🔐 Strict Role-Based Authentication & Portal Isolation
- **Owner / Admin Portal (`/owner/dashboard`)**: Full farm operations control—sales, inventory tracking, livestock tagging, staff management, financial analytics, order processing, and system messaging.
- **Worker Portal (`/worker/dashboard`)**: Task assignments, digital attendance logging, daily activity reports, and automated farm notifications.
- **Customer Portal (`/customer/dashboard`)**: Browse livestock (sheep, rams, country chicken/natu kolla), custom meat/live weight orders, cart management, checkout, order tracking, and direct inquiry support.

### 🛡️ Production Security Architecture
- **Supabase Row-Level Security (RLS)**: Enforced database-level authorization policies bound strictly to `auth.uid() = profiles.id`.
- **Role Verification**: Multi-layered authorization check preventing cross-login attempts or unauthorized dashboard entry.
- **Auto-Profile Synchronization**: Automatic profile bootstrapping via PostgreSQL triggers on `auth.users` insertion.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons
- **Backend & Database**: Supabase Auth, PostgreSQL, Row-Level Security (RLS)
- **State & Utilities**: React Context API, LocalStorage Sync, Canvas-confetti

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🗄️ Database Schema & RLS Setup

Run the SQL scripts provided in `src/database/schema.sql` inside your Supabase SQL Editor to set up:
- `public.profiles` with `id REFERENCES auth.users(id)`
- RLS Policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`
- `handle_new_user()` trigger for automated profile creation on signup

---

## 📄 License
All rights reserved © Lakshmi Venkateshwara Sheep & Natu Kolla Farm.
