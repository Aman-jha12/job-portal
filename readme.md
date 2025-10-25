
# Job Portal API

This is the complete backend service for a modern job portal application. It's built with Node.js, Express, and TypeScript, designed to be scalable, secure, and efficient.

This API handles all the core logic for a multi-user system, including:

- **Three User Roles:** `APPLICANT`, `RECRUITER`, and `ADMIN`.
- **Secure Authentication:** User registration and login using JSON Web Tokens (JWT).
- **Job & Company Management:** Full CRUD operations for recruiters to post jobs and manage company profiles.
- **Application System:** Applicants can upload their resumes (via AWS S3) and apply for jobs.
- **Background Notifications:** Uses a Redis queue to handle notifications efficiently without slowing down the API.
- **Admin Dashboard:** Special endpoints for admins to manage users, companies, and all platform data.

---

## 🧠 Technologies Used

This project uses a modern, type-safe, and scalable tech stack. Here's a look at the core technologies and *why* they were chosen.

- **Node.js & Express:** The foundation of the server. Express is a minimal and flexible framework that lets us build our API quickly and logically.
- **TypeScript:** This adds static typing to JavaScript. It helps us catch bugs *before* we even run the code, making the entire application more robust and easier to maintain.
- **Prisma:** A next-generation ORM (Object-Relational Mapper). It makes talking to our database incredibly simple and type-safe. We write our schema, and Prisma generates a complete database client for us.
- **PostgreSQL:** A powerful and reliable open-source SQL database. It's perfect for handling the complex relationships between users, companies, jobs, and applications.
- **JSON Web Tokens (JWT) & bcrypt.js:** The core of our security.
  - **bcrypt.js:** We use this to hash and salt user passwords. This means we *never* store plain-text passwords in our database.
  - **jsonwebtoken:** We use this to create secure "access tokens" for users when they log in. These tokens are sent with every protected request to prove who they are.
- **Multer & AWS S3:** This is our file-handling solution.
  - **Multer:** A middleware that processes `form-data` (file uploads) in Express.
  - **AWS S3:** A cloud storage service. We don't store files (like resumes or profile pictures) on our server; we upload them directly to an S3 bucket. This is more scalable, secure, and reliable.
- **Redis & Bull:** Our high-performance background job system.
  - **Redis:** An in-memory data store, used here as a message broker.
  - **Bull:** A robust queue library built on Redis. When a user applies for a job, we don't want to make them wait while our server creates a notification. We instantly add a "notification job" to the Bull queue. A separate worker process (powered by Redis) picks up this job and handles it in the background, so the user gets an instant response.
- **Docker:** We use Docker to run our Redis database in a predictable, isolated container. This means you don't need to manually install and configure Redis on your machine; you just run one command.

---

## ⚙️ Getting Started

Follow these steps to get the project up and running on your local machine.

### Prerequisites

You must have the following software installed:

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/products/docker-desktop/) (to run Redis)
- A [PostgreSQL](https://www.postgresql.org/download/) database
- An [AWS S3 Bucket](https://aws.amazon.com/s3/) with access keys

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/job-portal.git
cd job-portal
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

This is the most important step. Create a file named `.env` in the root of the project. Copy the contents of `.env.example` (if you have one) or use the template below and fill in your own values.

```
# .env

# 1. Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"

# 2. Authentication
JWT_SECRET="YOUR_SUPER_STRONG_SECRET_KEY_HERE"

# 3. AWS S3 for File Uploads
AWS_S3_BUCKET_NAME="your-s3-bucket-name"
AWS_S3_REGION="your-s3-region"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"

# 4. Redis (for Queues)
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
REDIS_PASSWORD=""
```

### 4. Start Your Redis Container

Run this command in your terminal. This will download the official Redis image and start a container named `my-job-portal-redis` on port `6379`.

```bash
docker run -d --name my-job-portal-redis -p 6379:6379 redis
```

You can leave this running in the background.

### 5. Run Database Migrations

```bash
npm run prisma:migrate
```

---

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

Server will run at **[http://localhost:3000](http://localhost:3000)**

### Other Useful Scripts

* **Build for Production:**

  ```bash
  npm run build
  ```
* **Run in Production:**

  ```bash
  npm start
  ```
* **Open Prisma Studio:**

  ```bash
  npm run prisma:studio
  ```
* **Run the Seed Script:**

  ```bash
  npm run seed
  ```

---

## 👥 Project Workflow & User Roles

This API has three distinct user roles with different permissions.

### 1. APPLICANT (Default)

* Registers via `/auth/register`
* **Can:** View jobs, view companies, apply for jobs, manage own applications, bookmark jobs, edit profile.
* **Cannot:** Post jobs or manage other users.

### 2. RECRUITER

* Promoted by an admin.
* **Can:** Do everything an Applicant can, plus:

  * Create and manage their own company profile.
  * Post jobs for their company.
  * View/manage applications for their jobs.
* **Cannot:** Manage other companies or users.

### 3. ADMIN

* Created via seed script or manually in DB.
* **Can:** Do everything, including:

  * Manage all users, companies, and jobs.
  * Promote/demote users (e.g. `APPLICANT` → `RECRUITER`).
  * Delete any user, job, or company.

---

## 🧩 API Endpoints

All endpoints are prefixed with `/api/v1`.
Protected routes require a Bearer Token in the `Authorization` header.

### 🧍 Auth Routes (`/auth`)

| Method | Endpoint         | Access        | Description                                    |
| ------ | ---------------- | ------------- | ---------------------------------------------- |
| POST   | `/auth/register` | Public        | Register a new user (defaults to `APPLICANT`). |
| POST   | `/auth/login`    | Public        | Log in with email & password to get JWT.       |
| GET    | `/auth/me`       | Authenticated | Get the profile of the logged-in user.         |

### 🏢 Company Routes (`/companies`)

| Method | Endpoint         | Access                  | Description                   |
| ------ | ---------------- | ----------------------- | ----------------------------- |
| GET    | `/companies`     | Public                  | Get all companies.            |
| GET    | `/companies/:id` | Public                  | Get company details.          |
| POST   | `/companies`     | Recruiter/Admin         | Create a new company profile. |
| PUT    | `/companies/:id` | Recruiter (Owner)/Admin | Update your company.          |
| DELETE | `/companies/:id` | Recruiter (Owner)/Admin | Delete your company.          |

### 💼 Job Routes (`/jobs`)

| Method | Endpoint    | Access          | Description                                                       |
| ------ | ----------- | --------------- | ----------------------------------------------------------------- |
| GET    | `/jobs`     | Public          | Get all jobs (supports filters: `?location`, `?type`, `?skills`). |
| GET    | `/jobs/:id` | Public          | Get job details.                                                  |
| POST   | `/jobs`     | Recruiter/Admin | Post a new job.                                                   |

### 📝 Application Routes (`/applications`)

| Method | Endpoint                   | Access                  | Description                                          |
| ------ | -------------------------- | ----------------------- | ---------------------------------------------------- |
| POST   | `/applications/:jobId`     | Applicant               | Apply for a job (`form-data`: resume + coverLetter). |
| GET    | `/applications`            | Applicant               | Get all your applications.                           |
| GET    | `/applications/job/:jobId` | Recruiter (Owner)/Admin | Get applications for a specific job.                 |
| PATCH  | `/applications/:id/status` | Recruiter (Owner)/Admin | Update an application's status.                      |
| DELETE | `/applications/:id`        | Applicant               | Withdraw your own application.                       |

### 💾 Bookmark Routes (`/bookmarks`)

| Method | Endpoint            | Access    | Description              |
| ------ | ------------------- | --------- | ------------------------ |
| GET    | `/bookmarks`        | Applicant | Get all bookmarked jobs. |
| POST   | `/bookmarks/:jobId` | Applicant | Add a bookmark.          |
| DELETE | `/bookmarks/:jobId` | Applicant | Remove a bookmark.       |

### 🔔 Notification Routes (`/notifications`)

| Method | Endpoint                  | Access        | Description                  |
| ------ | ------------------------- | ------------- | ---------------------------- |
| GET    | `/notifications`          | Authenticated | Get all notifications.       |
| PATCH  | `/notifications/:id/read` | Authenticated | Mark a notification as read. |
| DELETE | `/notifications/:id`      | Authenticated | Delete a notification.       |

### 📁 Upload Routes (`/upload`)

| Method | Endpoint          | Access        | Description                                               |
| ------ | ----------------- | ------------- | --------------------------------------------------------- |
| POST   | `/upload/resume`  | Authenticated | Upload a resume (`form-data`: key `resume`).              |
| POST   | `/upload/profile` | Authenticated | Upload a profile image (`form-data`: key `profileImage`). |

### 🧰 Admin Routes (`/admin`)

| Method | Endpoint                | Access | Description                                            |
| ------ | ----------------------- | ------ | ------------------------------------------------------ |
| GET    | `/admin/users`          | Admin  | Get all users.                                         |
| DELETE | `/admin/users/:id`      | Admin  | Delete any user.                                       |
| PATCH  | `/admin/users/:id/role` | Admin  | Promote/demote a user. Body: `{ "role": "RECRUITER" }` |
| GET    | `/admin/jobs`           | Admin  | Get all jobs.                                          |
| GET    | `/admin/companies`      | Admin  | Get all companies.                                     |

---

```

---


