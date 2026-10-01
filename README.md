# Internship Assignment - Auth API

A small backend for user authentication, built with Node.js, Express and TypeScript. You can register, log in, and reset a forgotten password using an OTP that is sent to your email.

## Features

- Register with name, email and password
- Login and get a JWT token
- Forgot password: sends a 6 digit OTP to the user's email (valid for 10 minutes)
- Reset password using that OTP

## Tech used

- Node.js + Express 5
- TypeScript
- PostgreSQL with Prisma
- bcryptjs (password and OTP hashing)
- jsonwebtoken (JWT)
- Resend (sending emails)

## Setup

You need Node 18 or above, a PostgreSQL database and a free Resend account (for the API key).

1. Install packages

   ```
   npm install
   ```

2. Create a `.env` file in the root folder

   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
   JWT_SECRET="any_long_random_string"
   RESEND_API_KEY="re_xxxxxxxxx"
   PORT=3000
   ```

   PORT is optional, it defaults to 5000.

3. Run the migrations (this also generates the Prisma client)

   ```
   npx prisma migrate dev
   ```

4. Start the server

   ```
   npm run dev
   ```

The server will run on http://localhost:3000

## API endpoints

Base path is `/api/auth`. All of them are POST and take JSON.

**POST /api/auth/register**

```json
{ "name": "John", "email": "john@example.com", "password": "123456" }
```

Returns the user and a token.

**POST /api/auth/login**

```json
{ "email": "john@example.com", "password": "123456" }
```

Returns the user and a token.

**POST /api/auth/forgot-password**

```json
{ "email": "john@example.com" }
```

Sends a 6 digit OTP to that email.

**POST /api/auth/reset-password**

```json
{ "email": "john@example.com", "otp": "123456", "newPassword": "newpass123" }
```

Changes the password if the OTP is correct and not expired.

## Folder structure

```
prisma/
  schema.prisma        database models (User, PasswordResetOtp)
  migrations/          migration history
src/
  server.ts            starts the server
  app.ts               express setup, routes, error handler
  config/db.ts         prisma client
  routes/authRoutes.ts route definitions
  controllers/auth.ts  register, login, forgot/reset password logic
  middleware/errorHandler.ts   central error handler
  utils/appError.ts    custom error class (message + status code)
  utils/sendEmail.ts   sends email using Resend
```

## Notes

- The email is sent from `onboarding@resend.dev`, which is Resend's test sender. With it, emails only reach the address you used to sign up on Resend. To send to any other email you have to verify your own domain in Resend and change the `from` in `src/utils/sendEmail.ts`.
- There is only a `dev` script for now, no build/start script.
