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