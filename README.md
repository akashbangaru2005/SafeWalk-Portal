# SafeWalk Municipal Safety Portal

A mobile-first municipal issue reporting portal built as a continuation of the uploaded SafeWalk Spring Boot project.

## Architecture

- `frontend/` React + Vite, mobile-first glassmorphism user portal and claymorphism admin portal.
- `backend/` Spring Boot 3.2.5 + JPA + MySQL.
- User authentication: unique 4-digit PIN.
- Admin authentication: 10-digit password.
- User report flow: camera/photo -> browser geolocation -> report -> backend.
- Admin flow: dashboard -> reports -> map coordinates -> status updates.
- Google Maps is loaded in the frontend using a Vite environment variable.
- Uploaded photos are stored in `backend/uploads/` for local development. The database stores the file URL and report metadata.

## Important security note

The original uploaded project contained a MySQL password directly in `application.properties`. This project removes that secret and uses environment variables instead.

Do not commit real passwords or API keys to GitHub.

## Requirements

- Java 17+
- Maven 3.9+ or Maven Wrapper
- Node.js 20+
- MySQL 8+
- A Google Cloud project with Maps JavaScript API enabled

## 1. Database

Create a MySQL database:

```sql
CREATE DATABASE safewalk;
```

The application creates its tables automatically during development.

Set environment variables before starting the backend:

Windows PowerShell:

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/safewalk?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="YOUR_MYSQL_PASSWORD"
$env:ADMIN_PASSWORD="1234567890"
```

The admin password must be exactly 10 digits for the development seed account.

## 2. Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Backend:

`http://localhost:8080`

Swagger/OpenAPI is intentionally not required for this MVP.

The first startup creates:
- demo user PIN: `1234`
- demo admin password: `1234567890`

Change these before real deployment.

## 3. Frontend

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open the Vite URL shown in the terminal.

## Google Maps API key

Put the browser key in:

`frontend/.env`

```env
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_BROWSER_KEY
```

Enable:
- Maps JavaScript API

Restrict the browser key by HTTP referrers when deployed.

## Backend database credentials

Put database credentials in environment variables, not source code:

```env
DB_URL=jdbc:mysql://localhost:3306/safewalk?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
ADMIN_PASSWORD=1234567890
```

## User workflow

1. Open the User Portal.
2. Enter a 4-digit PIN.
3. The user sees the map and current location.
4. Select `Take Photo` or choose a photo.
5. Browser asks for camera/location permission.
6. Add an optional description.
7. Submit.
8. The backend stores the photo and GPS coordinates.
9. The report appears in the Admin Portal.

## Admin workflow

1. Open the Admin Portal.
2. Enter the 10-digit admin password.
3. View report statistics.
4. Filter reports.
5. Open a report.
6. See photo, GPS coordinates and map.
7. Update status:
   - OPEN
   - IN_PROGRESS
   - RESOLVED
   - REJECTED

## Mobile behavior

The frontend is designed mobile-first:
- touch-friendly controls
- responsive cards
- safe-area support
- camera input
- responsive Google Map
- bottom navigation
- no desktop-only interactions

## Production upgrades recommended

For a real municipal deployment:
- Use Spring Security + JWT/OIDC.
- Store photos in AWS S3 or Google Cloud Storage instead of local disk.
- Use HTTPS.
- Add rate limiting and audit logs.
- Add CAPTCHA/device abuse protection.
- Encrypt sensitive data where appropriate.
- Use a secrets manager.
- Use Google Maps API key restrictions.
- Add role-based authorization.
- Add pagination and server-side filtering.
- Add push/email/SMS notifications.
