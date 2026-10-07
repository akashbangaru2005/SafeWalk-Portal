# SafeWalk Backend — 4-Digit PIN + Mobile OTP

## Backend location

Copy this backend into:

C:\Users\akash\Downloads\Safewalk-Portal-Complete\backend

## Important

Delete old duplicate Java files before copying:

- src/main/java/com/safewalk/AuthService.java
- Any old UserAccountRepository method such as:
  findByPinAndActiveTrue(String pin)

Only keep:

- com.safewalk.service.AuthService
- the new UserAccountRepository

## Database

Create the database:

CREATE DATABASE safewalk;

## Development OTP

By default:

OTP_DEV_MODE=true

The OTP will be printed in the Spring Boot console.

Example:

SafeWalk OTP
Phone  : +919876543210
Purpose: REGISTER
OTP    : 123456

This is for local testing only.

## Real SMS OTP with Twilio

Set:

OTP_DEV_MODE=false
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=...

Do not commit these secrets to GitHub.

## Run

mvn clean
mvn spring-boot:run

## API flow

### Existing user login
POST /api/auth/user
{
  "pin": "1234"
}

### Check PIN
POST /api/auth/user/check
{
  "pin": "1234"
}

### New registration — request OTP
POST /api/auth/user/register/request-otp
{
  "phone": "9876543210"
}

### New registration — verify OTP and create account
POST /api/auth/user/register/verify-otp
{
  "phone": "9876543210",
  "otp": "123456",
  "pin": "1234"
}

### Forgot PIN — request OTP
POST /api/auth/forgot-pin/request-otp
{
  "phone": "9876543210"
}

### Forgot PIN — verify OTP
POST /api/auth/forgot-pin/verify-otp
{
  "phone": "9876543210",
  "otp": "123456"
}

Response contains resetToken.

### Forgot PIN — set new PIN
POST /api/auth/forgot-pin/reset
{
  "resetToken": "...",
  "newPin": "5678"
}

### Admin
POST /api/auth/admin
{
  "password": "1234567890"
}
