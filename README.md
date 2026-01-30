# 🧱 AngularLegoV2

**AngularLegoV2** is a modern, high-performance management dashboard for Lego characters and projects.  
Built with **Angular 19** and **Supabase**, the application leverages reactive patterns, real-time data synchronization, and a scalable architecture.

---

## 🚀 Key Features

- **Character Management**  
  Full CRUD operations with advanced filtering by name, gender, city, and project.

- **Reactive Favorites System**  
  Toggle favorites with instant UI feedback using RxJS `BehaviorSubject`s and database persistence.

- **Project & Activity Tracking**  
  Organize characters into projects and monitor recent system activities with real-time updates.

- **Global Dashboard & Analytics**  
  Data visualization including:
  - Gender distribution
  - City demographics
  - Project membership statistics

- **Authentication & RBAC**  
  Secure authentication via Supabase Auth with role-based access control (`USER`, `SUPERVISOR`, `ADMIN`).

- **Performance Optimized**  
  - Lazy loading for all routes  
  - Shared streams with `shareReplay` to reduce database calls

---

## 🛠 Tech Stack

- **Frontend:** [Angular 19+](https://angular.dev/) (Standalone Architecture)
- **Backend:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime)
- **State Management:** RxJS (Observables, BehaviorSubjects, pipeable operators)
- **UI & Styling:** Bootstrap 5 (Responsive Design)
- **Testing:** Vitest

---

## 📁 Project Structure

```text
src/app/
├── components/          # Feature-based standalone components
├── services/            # Business logic & API abstraction
├── models/              # TypeScript interfaces and types
├── guards/              # Route guards (AuthGuard, LoginGuard)
├── supabase/            # Supabase client & auth handling
└── utils/               # SQL schemas and migration scripts
```

---

## ⚙️ Setup & Installation

### 1️⃣ Prerequisites

- **Node.js** v18+
- **Angular CLI**

---

### 2️⃣ Clone the Repository

```bash
git clone https://github.com/saintgold97/angular-lego-v2.git
cd angular-lego-v2
npm install
```

---

### 3️⃣ Supabase Environment Configuration

```ts
export const environment = {
  production: false,
  supabaseUrl: 'https://your-project-id.supabase.co',
  supabaseKey: 'your-anon-public-key'
};
```

---

### 4️⃣ Database Initialization

Run the SQL scripts inside:

```
src/app/utils/
```

This will create:

- `profiles` table (custom roles)
- `projects` and `characters` tables
- `favorites` junction table
- `activities` table
- `city` table
- `bucket-policy`

---

## 🏃 Available Scripts

| Command | Description |
|------|------|
| `ng serve` | Starts dev server at http://localhost:4200/ |
| `ng build` | Builds production assets |
| `ng test` | Runs tests with Vitest |

---

## 📄 License

MIT

## 👤 Author
Roberto Santoro

Role: Lead Frontend Developer

GitHub: saintgold97

LinkedIn: Roberto Santoro