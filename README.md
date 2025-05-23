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
MONGO_URI=mongodb+srv://noorahmedalhadidi:mongodbatlaspassword@tawasolcluster.5irka.mongodb.net/TawasolDB?retryWrites=true&w=majority&appName=TawasolCluster
JWT_SECRET=4a52519e47d98ddd4b515a71ca31443d530b16bd48218cacd2805ea7d0cdc5d4
EMAIL_USER=noreply.tawasolapp@gmail.com
EMAIL_PASS=gknjkmsddprpcanb
RECAPTCHA_SECRET_KEY=6LdMDv0qAAAAAH2f77XnX3AN3RO01m26yTNTUUWR
GOOGLE_CLIENT_ID=255166583275-q52g6235gpjiq68u9o23doqcs2sdi9h2.apps.googleusercontent.com
ANDROID_CLIENT_ID=946817335569-d75dbdgvre907lfo8splmpukmhkvjh8n.apps.googleusercontent.com
CLOUDINARY_CLOUD_NAME=dkcwts3fw
CLOUDINARY_API_KEY=437252129286352
CLOUDINARY_API_SECRET=31Ms76RsQfKnNiLA12hMLs9UyLs
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

## Running the Seeding Script

To populate the database with test data, run the following command:

```sh
ts-node src/seed.ts
```

## Running Unit Tests

To run unit test files using jest:

```sh
npm run test
```

To check unit test coverage:

```sh
npm run test:cov
```

## API Documentation

Swagger is used for API documentation. Once the backend is running, visit:

```
http://localhost:3000/api-docs
```


## Commit Format

Each commit message should follow this format:

```
<type>(<scope>): <message>
```

### Commit Types:

| Type     | Meaning                                                          |
| -------- | ---------------------------------------------------------------- |
| feat     | Adding a new feature or functionality.                           |
| fix      | Fixing a bug.                                                    |
| revert   | Reverting to a previous commit.                                  |
| refactor | Refactoring code without changing functionality.                 |
| test     | Adding or updating tests.                                        |
| docs     | Documentation changes (README, comments, project documentation). |
| chore    | Miscellaneous changes (dependencies, configurations, etc.).      |

## Branch Naming Convention

| Branch Name            | Description                                         |
| ---------------------- | --------------------------------------------------- |
| main                   | Stable branch, ready for deployment.                |
| develop                | Latest development branch with all merged features. |
| feature/{feature-name} | New feature implementation.                         |
| bugfix/{bug-name}      | Fix bug before merging into develop.                |

- **Pull requests** must be created in the `develop` branch for review and testing before merging into `main`.

## Project Directory Structure

```
/src
 ├── modules/
 │   ├── users/
 │   │   ├── dtos/
 |   |   ├── infrastructure/
 |   |   |   ├── database/
 |   |   |   |   ├── schemas/
 |   |   |   |   |   ├── user.schema.ts
 |   |   |   |   ├── seeders/   
 |   |   |   |   |   ├── user.seeder.ts
 │   │   ├── auth.module.ts
 │   │   ├── auth.controller.ts
 │   │   ├── auth.service.ts
 │   ├── auth/
 │   ├── posts/
 │   ├── messages/
 │   ├── jobs/
 │   ├── notifications/
 ├── common/
 │   ├── decorators/
 │   ├── filters/
 │   ├── guards/
 │   ├── interceptors/
 │   ├── utils/
 ├── main.ts
 ├── seed.ts
 ├── app.module.ts
```

## Code Naming Convention

| Resource                    | Naming Convention |
| --------------------------- | ----------------- |
| Modules/Directories         | lowercase, plural |
| Files                       | kebab-case        |
| Classes & Interfaces        | PascalCase        |
| Enums                       | PascalCase        |
| Variables & Functions       | camelCase         |
| Constants                   | UPPER_SNAKE_CASE  |
| Database Collections        | PascalCase        |
| Database Collections Fields | snake_case        |

Examples:

camelCase
PascalCase
snake_case
kebab-case

## Additional Notes

- Ensure **eslint** rules are followed to maintain clean code.

## Code Formatting

We use **Prettier** for code formatting.

1. Install the Prettier extension in VS Code.
2. Format code using **Right-click > Format with Prettier**.
