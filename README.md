🛒 Ecommerce Project
This is a full-stack ecommerce web application built with a modern development stack. The project is structured with a React frontend and a Node.js backend, using Prisma ORM to manage a PostgreSQL database. Key features in development include a bulk upload system for efficient product management.

📁 Project Structure
bash
Copy
Edit
ecommerce-project/
├── frontend/         # React + Vite application
├── backend/          # Node.js backend with Prisma ORM
├── prisma/           # Prisma schema and migration files
├── .gitignore
└── README.md
🚀 Features (in progress)
✅ React + Vite frontend with modern component-based architecture

✅ Backend with Express.js and Prisma ORM

✅ PostgreSQL database integration

🔄 Bulk upload functionality (e.g., CSV-based product import)

🛠️ API endpoints for product management

🧰 Tech Stack
Frontend: React, Vite

Backend: Node.js, Express

Database: PostgreSQL

ORM: Prisma

Dev Tools: ESLint, Git, GitHub

🔧 Getting Started
1. Clone the repository:
bash
Copy
Edit
git clone https://github.com/Ianloschins/ecommerce-project.git
cd ecommerce-project
2. Setup the frontend:
bash
Copy
Edit
cd frontend
npm install
npm run dev
3. Setup the backend:
bash
Copy
Edit
cd ../backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
Ensure your PostgreSQL database is running and credentials are set in your .env file.

🧱 Future Enhancements
Authentication & authorization

Payment gateway integration

Responsive design improvements

Admin dashboard for product & order management

