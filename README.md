# DocWise

An intelligent chat application that allows you to have conversations about your PDF documents. Upload a PDF and start asking questions!

![](assets/1.png)
![](assets/2.png)

## Features

- **User Authentication:** Secure sign-up and sign-in functionality.
- **PDF Upload:** Easily upload your PDF files.
- **Interactive Chat:** Ask questions and get answers based on the content of your PDF. The chat interface supports markdown, including code blocks and mathematical notations.
- **Responsive Design:** A seamless experience on both desktop and mobile devices.

## Tech Stack

### Frontend

- **Framework:** [Next.js](https://nextjs.org/) (React 19)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Authentication:** [NextAuth.js](https://authjs.dev/)
- **PDF Rendering:** [react-pdf](https://github.com/wojtekmaj/react-pdf)
- **Validation:** [Zod](https://zod.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)

### Backend

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
- **Language:** [Python](https://www.python.org/)
- **AI/ML:**
  - [PyTorch](https://pytorch.org/)
  - [Hugging Face Transformers](https://huggingface.co/docs/transformers/index)
  - [ONNX Runtime](https://onnxruntime.ai/) for efficient model inference
  - [Google Generative AI](https://ai.google/discover/generativeai/)
- **PDF Processing:** [pdfplumber](https://github.com/jsvine/pdfplumber)
- **Authentication:** JWT

### Database

- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Prisma](https://www.prisma.io/)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v20 or later)
- [Python](https://www.python.org/downloads/) (v3.10 or later)
- [PostgreSQL](https://www.postgresql.org/download/)
- A running PostgreSQL instance.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/elitebot47/DocWise.git
    cd DocWise
    ```

2.  **Backend Setup:**

    ```bash
    cd backend

    # Create a virtual environment
    python -m venv venv
    source venv/bin/activate # on Windows use `venv\Scripts\activate`

    # Install dependencies
    pip install -r requirements.txt

    # Create a .env file and add your environment variables
    ```

3.  **Frontend Setup:**

    ```bash
    cd ../client

    # Install dependencies
    npm install

    # Create  .env.local and .env file and add your environment variables
    ```

### Environment Variables

You will need to create environment files for both the backend and frontend.

**Backend (`backend/.env`):**

```bash
BACKEND_JWT_SECRET= "your_backend_secret"
CORS_ALLOW_ORIGINS= "your_frontend_address" | eg-http://localhost:3000

# Gemini API Key (Google Generative AI)
GEMINI_API_KEY= "your_gemini_api_key"
```

**Frontend (`client/.env.local`):**

```bash
AUTH_SECRET= "next-auth_scret"  | auto generate using- npx auth secret
AUTH_GOOGLE_ID= "your_google_client_id"
AUTH_GOOGLE_SECRET= "your_google_auth_secret"
BACKEND_JWT_SECRET= "your_backend_secret"  | note- this should be exact which is used in backend .env BACKEND_JWT_SECRET
NEXT_PUBLIC_BACKEND_URL= "http://127.0.0.1:8000"
```

**(`client/.env`):**

```bash
# PostgreSQL connection string for Prisma

DATABASE_URL= "postgresql://username:password@localhost:5432/mydatabase"
```

---

## Running the Application

After setting up your environment variables, follow these steps to get the app running locally:

### 1. Run Database Migrations

This will set up your PostgreSQL database tables using Prisma.

```bash
cd client
npx prisma migrate dev
```

---

### 2. Start the Backend Server

This will launch your FastAPI backend.

```bash
cd backend

# If your virtual environment is not activated, activate it:
source venv/bin/activate

uvicorn main:app --reload
```

The backend should now be running at [http://127.0.0.1:8000](http://127.0.0.1:8000).

---

### 3. Start the Frontend Development Server

This will launch your Next.js frontend.

```bash
cd client
npm run dev
```

The frontend should now be running at [http://localhost:3000](http://localhost:3000).

---

### 4. Open the App

Go to [http://localhost:3000](http://localhost:3000) in your browser to use the application.

---

### 5. (Optional) Seed the Database

If you have a seed script, you can run it to populate your database with initial data:

```bash
npx prisma db seed
```

---

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
