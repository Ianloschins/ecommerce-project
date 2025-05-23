🛒 Ecommerce Project
This is a full-stack ecommerce web application built with a modern development stack. The project is structured with a React frontend and a Node.js backend, using Prisma ORM to manage a PostgreSQL database. Key features in development include a bulk upload system for efficient product management.

📁 Project Structure

ecommerce-project/
├── frontend/         # React + Vite application

├── backend/          # Node.js backend with Prisma ORM

├── prisma/           # Prisma schema and migration files

├── .gitignore

└── README.md

🚀 Features

✅ React + Vite frontend with modern component-based architecture

✅ Backend with Express.js and Prisma ORM

✅ PostgreSQL database integration

🔄 Bulk upload functionality (JSON file import and the ARRAY data format same as https://fakestoreapi.com/products)

🛠️ API endpoints for product management

🧰 Tech Stack

Frontend: React, Vite

Backend: Node.js, Express

Database: PostgreSQL

ORM: Prisma

Dev Tools: ESLint, Git, GitHub
__________________________________________________________________________________________

🔧 Getting Started
1. Clone the repository:

git clone https://github.com/Ianloschins/ecommerce-project.git
cd ecommerce-project

2. Setup the frontend:

cd frontend
npm install
npm run dev

3. Setup the backend:

cd ../backend

npm install

npx prisma generate

npx prisma migrate dev

node server.js

Ensure your PostgreSQL database is running and credentials are set in your .env file.


🧱 Future Enhancements
Authentication & authorization

Responsive design improvements

Admin dashboard for product & non-Admin users
-> Creativity Processing  🧠 

