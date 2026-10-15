# Real Estate Property Marketplace

A full-stack MERN application for browsing, publishing, and managing real estate property listings. Built with a modern React frontend and a robust Node.js/Express backend featuring secure image uploads via Multer and MongoDB persistence.

---

## 🚀 Tech Stack

### **Frontend**
- **React** (via Vite)
- **Redux Toolkit** (Global state management & form handling)
- **Material UI (MUI)** & **Tailwind CSS** (Responsive UI components & styling)
- **Axios** (API communication)

### **Backend**
- **Node.js** & **Express**
- **MongoDB & Mongoose** (Database schemas and data modeling)
- **Multer** (Multipart form-data parsing & disk storage)

---

## 🛠️ Project Structure

```text
├── backend/
│   ├── config/          # Database connection setup
│   ├── controllers/     # API request handlers (Properties, Auth, etc.)
│   ├── middleware/      # File upload & validation middleware
│   ├── models/          # Mongoose schemas (Property, User, etc.)
│   ├── routes/          # Express route definitions
│   ├── uploads/         # Stored property images
│   ├── app.js           # Express app configuration & static middleware
│   └── server.js        # Server entry point & listener
│
└── frontend/            # React application
    ├── src/
    │   ├── api/         # Axios instance setup
    │   ├── components/  # Property cards, listings, and form components
    │   └── redux/       # Redux slices and store configuration
    └── ...
```

---

## ⚙️ How to Run the App

### **1. Clone the Repository**
```bash
git clone <your-repository-url>
cd <repository-folder>
```

### **2. Setup and Run the Backend**
Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Create a `.env` file inside the backend directory and add your configuration:
```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/real-estate-marketplace
```

Start the backend development server:
```bash
npm run dev
# or node server.js
```
The backend will run at `http://localhost:3000`.

### **3. Setup and Run the Frontend**
Open a new terminal window and navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```
The frontend application will open at `http://localhost:5173`.