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
FCM_TYPE=service_account
FCM_PROJECT_ID=tawasoolapp
FCM_PRIVATE_KEY_ID=b03d1692df93543025fe2b596c8dbc1928334141
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCUwJzED0TCxkb3\ndig6nngd8xb8CI4rinIs2Zpd9WhkHXUDkFNLEpWcvRXT3SLfnmySPLp033UYLKLY\notwTBZ2VzA/zh0aEJU+XxqKDqZb3q3UWVy876NCsN0LJTe/FZZwpv1yq/47tNaPE\nOfgbNXHEz5io9yxGPf9xwzr6NOu9gkNPkoJBIEZ7PxuhK339LH95oXDDAYdzFbfn\nc5OQz2shKnAw78UvWN1Rt1Yfp6eCsg9XttWE2wM2rT8vZmEQqTA3ik7T1wPX/hRy\nIQHyEkDVOazh59ZXgKuPDo06xVE3ntsiSpWaxP4pwLx//103quK4G+8IfxJJGoH6\n8DxsGLnNAgMBAAECggEACqd5Evnc/O5iqtrFqt0q0UpV/RtHw4qY/ulfCxfGsFUD\nyouNy7S7DozkgVY3ZzjboeXDnRdcNa0MxON1S899J/uDsPehb1mUx9QsU63T6E1Z\nh44bDflw6MTUfcKdR9AtTTgtlPnU7NyIrEdSo/BCA8yyrHd3rlhGcYmAMeeUcvBD\nlWOgrJ7i8RGcokJTubbrVKcaamHnmu+4yuehrm/VtQYbLJ8oczaBB+mVW8yKU+a/\nKwBK5whB+OWcbLdzaffcYQ15Jt3e0kUOpkt72OA4zvUI9talI2acIWvqYVY+FX2X\nK6LxyK2epCuFY9gxJPhH9lZj7fP/5ZDvK7x1WZ1wKQKBgQDKCN44NstUAu0IhWfS\nMWowW3xeMXbgFwH+tYmFuyzAQNu08VraDtc2bmAEc4v2kW2RXMRqw3Q0Pk68Kyd4\njb+6JrcxjDCEws/7DubdorSVOaqM0Q1+aMC7PBu4BvVtjAcTodXamZiYTiGy6J7V\nmcXwplDTsXZ2ZvsCvbvkG+PvSwKBgQC8fE2lUqw7OcpKvnPUJs1Ex2f8kDcaR3+d\nIOAYoRZjfnoh9SyVe4hKzkGLMFAmSJQPEHbW/r9ul/gggOz8SSQ74PLYG4c1cv3W\nc1zt3J1jOfHzrdVvtWPLrEdgiE/B3xggAQy0QzJTN6wKm4tzl7VWfoW4Y8ygKTHj\n/PqxpF6URwKBgAa9KPxjB4Ez38gq+v2N3Gbkhk92AusSmWRvlbi6N5HqF+n/KvKf\nEBqmr9k2KXL+AtOYbozJHDUp5uJr5hMlV0HUTMQAUxX6kYlkQ9sctD1OARxVVMfk\nopkcNih7QvB2fT3wZfu2p9pcsM8Q50tkp6+RPJzzDGqCoNjEj2HadE3lAoGBAK6u\n/T8U6a5SFttCuxKJi4AM1qDJ/2eJkAnN6CKrWJaJJyPFl7ZKMLwzf6dB9WYlqaJ0\nfc8vdbdHfJyTIA+Isd4U0rvad2rf0cUoUZ3Y8rx9fXF7T+4hzAV8+wHKEzD4U+GF\nV4LRLBjX5chG8+0DUvqAc+m6BHEC/MvxL13nmggNAoGATwVXYXY/qhHW6cKBdNmx\nz742U3Blkm5QHi2V0H3w7Gql/xfNdS3b7MzcwgMb5eP7u/oqJQDL5AKC5OZe8Y83\nlipauj2MbcaN3h4YhKzLIM/72PQXocZ/D8pEjgpyy4ghCi0ACUsAV1ug4jFarhdJ\nDLncReRa07BAg69U0YX5nmQ=\n-----END PRIVATE KEY-----\n"
FCM_CLIENT_EMAIL=firebase-adminsdk-fbsvc@tawasoolapp.iam.gserviceaccount.com
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
