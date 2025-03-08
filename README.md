# TawasolApp - Backend

This repository contains the backend code for the **LinkedIn Clone** project.

## Technology Stack
- **NestJS**
- **TypeScript**
- **MongoDB and Mongoose**

## Prerequisites
- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **MongoDB** (locally installed or cloud instance like MongoDB Atlas)

## Setup

### 1. Clone the repository:
```sh
git clone https://github.com/TawasolApp/Back-end.git
cd Back-end
```

### 2. Install dependencies:

```sh
npm install
```

### 3. Configure Environment Variables:

Create a `.env` file in the root directory and add the following:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/tawasolapp
JWT_SECRET=your-secret-key
```

### 4. Run the application:

```sh
npm run start:dev
```

The API will be available at `http://localhost:3000`.

## Running the Project

To start the development server:

```sh
npm run start:dev
```

To build the project:

```sh
npm run build
```

To run the project in production mode:

```sh
npm run start
```

## API Documentation

Swagger is used for API documentation. Once the backend is running, visit:

```
http://localhost:3000/api
```

## Commit Format
Each commit message should follow this format:
```
<type>(<scope>): <message>
```
### Commit Types:
| Type      | Meaning |
|-----------|------------|
| feat      | Adding a new feature or functionality. |
| fix       | Fixing a bug. |
| revert    | Reverting to a previous commit. |
| refactor  | Refactoring code without changing functionality. |
| test      | Adding or updating tests. |
| docs      | Documentation changes (README, comments, project documentation). |
| chore     | Miscellaneous changes (dependencies, configurations, etc.). |

## Branch Naming Convention
| Branch Name              | Description |
|--------------------------|------------|
| main                     | Stable branch, ready for deployment. |
| develop                  | Latest development branch with all merged features. |
| feature/{feature-name}   | New feature implementation. |
| bugfix/{bug-name}        | Fix bug before merging into develop. |

- **Pull requests** must be created in the `develop` branch for review and testing before merging into `main`.

## Project Directory Structure
```
/src
 ├── modules/
 │   ├── auth/
 │   │   ├── controllers/
 │   │   ├── services/
 │   │   ├── repositories/
 │   │   ├── dtos/
 │   │   ├── entities/
 │   │   ├── auth.module.ts
 │   ├── users/
 │   ├── posts/
 │   ├── messaging/
 │   ├── jobs/
 │   ├── notifications/
 ├── common/
 │   ├── decorators/
 │   ├── filters/
 │   ├── guards/
 │   ├── interceptors/
 │   ├── utils/
 ├── config/
 │   ├── database.ts
 │   ├── jwt.ts
 │   ├── swagger.ts
 ├── main.ts
 ├── app.module.ts
```

## Additional Notes
- Follow **PascalCase** for file naming.
- Follow **lowercase and plural** for module and directory naming.
- Ensure **eslint** rules are followed to maintain clean code.

## Code Formatting
We use **Prettier** for code formatting.
1. Install the Prettier extension in VS Code.
2. Format code using **Right-click > Format with Prettier**.




# TawasolApp - Backend

This repository contains the backend code for the **LinkedIn Clone** project.

## Technology Stack

- **NestJS** - A progressive Node.js framework for building efficient and scalable applications.
- **TypeScript** - A strongly typed programming language that builds on JavaScript.
- **MongoDB** - NoSQL database for storing application data.
- **Mongoose** - ODM (Object Data Modeling) library for MongoDB and Node.js.
- **Swagger** - API documentation and testing.
- **JWT** - Authentication and Authorization handling.
- **Bcrypt** - Password hashing for security.

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **MongoDB** (locally installed or cloud instance like MongoDB Atlas)

## Setup

### 1. Clone the repository:

```sh
git clone https://github.com/TawasolApp/Back-end.git
cd Back-end
```

### 2. Install dependencies:

```sh
npm install
```

### 3. Configure Environment Variables:

Create a `.env` file in the root directory and add the following:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/tawasolapp
JWT_SECRET=your-secret-key
```

Adjust values as needed.

### 4. Run the application:

```sh
npm run start:dev
```

The API will be available at `http://localhost:3000`.

## Running the Project

To start the development server:

```sh
npm run start:dev
```

To build the project:

```sh
npm run build
```

To run the project in production mode:

```sh
npm run start
```

## API Documentation

Swagger is used for API documentation. Once the backend is running, visit:

```
http://localhost:3000/api
```

## Testing

Run unit tests:

```sh
npm run test
```

Run end-to-end tests:

```sh
npm run test:e2e
```

## Commit Format

Each commit message should follow this format:

```
<type>: <description>
```

### Commit Types:

| Type     | Description                                                               |
| -------- | ------------------------------------------------------------------------- |
| feat     | A new feature or functionality.                                           |
| fix      | A bug fix.                                                                |
| refactor | Code changes that neither fix a bug nor add a feature.                    |
| test     | Adding or updating tests.                                                 |
| docs     | Documentation changes (e.g., README, comments, or project documentation). |
| chore    | Miscellaneous changes (dependencies, configurations, etc.).               |

## Branch Naming Convention

To maintain a clean and structured workflow, we follow the following branch naming conventions:

| Branch Type  | Naming Convention            | Description                                         |
|-------------|----------------------------|-----------------------------------------------------|
| Main Branch | `main`                      | Stable branch, ready for deployment.               |
| Development | `develop`                   | Latest development branch with all merged features.|
| Feature     | `feature/{feature-name}`    | New feature implementation.                        |
| Bug Fix     | `bugfix/{bug-name}`         | Fix bugs before merging into develop.              |
| Personal    | `personal/{name}/{task}`    | Specific user task branches.                       |

Pull requests must be created to the `develop` branch, where code will be tested and reviewed before merging into `main`.

## Project Directory Structure

```
/src
 ├── modules/
 │   ├── auth/
 │   │   ├── controllers/
 │   │   ├── services/
 │   │   ├── repositories/
 │   │   ├── dtos/
 │   │   ├── entities/
 │   │   ├── auth.module.ts
 │   ├── users/
 │   ├── posts/
 │   ├── messaging/
 │   ├── jobs/
 │   ├── notifications/
 ├── common/
 │   ├── decorators/
 │   ├── filters/
 │   ├── guards/
 │   ├── interceptors/
 │   ├── utils/
 ├── config/
 │   ├── database.ts
 │   ├── jwt.ts
 │   ├── swagger.ts
 ├── main.ts
 ├── app.module.ts
```

## Additional Notes

- Follow **PascalCase** for file and module naming.
- Ensure **eslint** rules are followed to maintain clean code.
- **Pull requests** must be created in the `develop` branch for review before merging into `main`.

## Code Formatting

We use **Prettier** for code formatting.

1. Install the Prettier extension in VS Code.
2. Format code using **Right-click > Format with Prettier**.

---

This project follows best practices for modular and scalable backend development using NestJS.

