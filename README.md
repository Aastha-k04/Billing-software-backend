# Billing Software - Backend API

A robust Node.js backend acting as the central engine for the Billing Software infrastructure, handling database operations, role-based authorization, and PDF document generation.

## 🚀 Tech Stack
- **Runtime Environment**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ORM
- **Authentication**: JSON Web Tokens (JWT) & bcrypt

---

## 🏗️ Project Flow & Architecture

The backend is built as a RESTful API designed to power the dynamic React frontend reliably. It segregates logic securely relying on MVC (Model-View-Controller) principles.

### 1. Authentication & RBAC (Role-Based Access Control)
- **Routes (`/routes/authRoutes.js`) & Controller**: Handles user registration, secure login via password hashing, and token dispensation.
- **Permissions Framework**: Specific middleware (`authMiddleware.js`) intercepts requests to verify both standard JWT validity AND detailed role permissions before allowing access to secure endpoints.

### 2. Billing & Quotations
- **PDF Generation (`pdfController.js`)**: Serves as the crucial engine for creating formal billing quotations. It processes item requests, synthesizes the invoice data, and returns fully formatted PDF documents to the frontend.
- **Purchases (`purchaseController.js`)**: Tracks finalized transactions and purchase request lifecycle.

### 3. Inventory & Product Management
- **Items & Products (`itemController.js`, `productController.js`)**: Full CRUD (Create, Read, Update, Delete) capability APIs handling the catalog of billable entities. Includes handling search parameters, specific catalog views, and ensuring item consistency across databases.
- Models enforce strict schemas for Items and Products to ensure data integrity during insertions and updates.

### 4. Admin & CRM Functions
- **Customer Oversight (`customerController.js`)**: Operations to track customer details and their aggregate purchases/quotations.
- **Admin Utilities**: Elevated endpoints for comprehensive user/role modification and statistics aggregation.
- **Review System (`reviewController.js`)**: Framework handling customer feedback on services/products.

---

## 🚥 Making it run locally

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Copy `.env.example` to `.env` and configure essential variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_key
   NODE_ENV=development
   ```

3. **Start the Server**
   Development mode with hot-reloading:
   ```bash
   npm run dev
   ```
   Production mode:
   ```bash
   npm start
   ```

---

## 📖 Step-by-Step Developer Walkthrough & API Mechanics

To get a practical understanding of how data flows through the backend during a standard user session, follow this step-by-step breakdown:

### Step 1: The Onboarding Request
**Trigger:** User fills out the frontend signup form.
**Action:** A `POST` request hits `/api/users/register` (in `authRoutes.js`).
**Under the Hood:**
- The `authController.js` validates the input.
- It employs `bcrypt` to securely hash the user's password.
- It saves a new `User` document in MongoDB, complete with their assigned `role` (e.g., Customer, Sales, Admin).
- The API responds with the user object and a fresh JWT token to be stored by the frontend.

### Step 2: The Security Checkpoint (Middleware)
**Trigger:** User tries to access a protected route (e.g., viewing items).
**Action:** The frontend sends a request containing the JWT token in the `Authorization` header.
**Under the Hood:**
- Before reaching the requested controller, the request must pass through `authMiddleware.js`.
- **Check 1:** Is the JWT valid and unexpired? (Standard Auth)
- **Check 2:** Does the user's defined `role` match the required permissions for this specific route? (Role-Based Auth)
- If both checks pass, the `next()` function is called, allowing the controller to execute. Otherwise, an "Access Denied" error is thrown.

### Step 3: Catalog Operations
**Trigger:** A Sales rep creates a new billable item.
**Action:** A `POST` request hits `/api/items`.
**Under the Hood:**
- Handled by `itemController.js`. It parses the body for item details (price, description).
- Instantiates a new Mongoose `Item` model and saves it to the database, making it immediately available for future quotations.

### Step 4: The Core Feature - Bill Generation
**Trigger:** A Sales rep finishes organizing a bill and clicks "Generate PDF".
**Action:** A complex `POST` request hits `/api/pdf/generate` (routed to `pdfController.js`).
**Under the Hood:**
- The backend receives an array of item IDs, quantities, and the target Customer ID.
- The controller calculates totals and formats the data.
- It utilizes a PDF library (like `pdfkit` or `puppeteer`) to dynamically draw a formatted invoice document in-memory.
- The server responds by streaming the raw PDF buffer back to the frontend, which handles triggering the browser download.

### Step 5: Administration & Maintenance
**Trigger:** An Admin alters another user's permissions.
**Action:** A `PUT` request hits an admin-specific route, like `/api/admin/user/:id/role`.
**Under the Hood:**
- The request hits an endpoint aggressively protected by `authMiddleware` ensuring *only* 'Admin' roles can proceed.
- Handled by `adminController.js`, it performs a MongoDB `findByIdAndUpdate` to alter the target user's role configuration schema, instantly modifying their access upon their next login.
