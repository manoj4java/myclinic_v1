# User Creation Script

This directory contains scripts to create users with properly encrypted passwords in the My Clinic Portal database.

## Files Created

- `create-sample-user.ts` - TypeScript version of the user creation script
- `create-sample-user.mjs` - JavaScript ES module version of the user creation script

## Usage

### Running the Script

To create the sample user with the predefined credentials:

```bash
# Using TypeScript version (recommended)
npx tsx create-sample-user.ts

# Or using JavaScript version
node create-sample-user.mjs
```

### Default User DetailsEmergency Case

The script creates a user with the following details:
- **Username**: `sampleuser`
- **Email**: `sampleemail@mail.com`
- **Password**: `samplepassword` (properly encrypted with bcryptjs)
- **Role**: `technician`
- **Name**: Sample User
- **Status**: Active
- **Email Notifications**: Enabled

### Customizing User Details

To create a user with different details, you can modify the `USER_DETAILS` object in the script:

```javascript
const USER_DETAILS = {
  username: "your_username",
  email: "your_email@example.com",
  password: "your_password",
  firstName: "First",
  lastName: "Last",
  role: "technician", // Options: "super_admin", "doctor", "technician"
  isActive: true,
  emailNotifications: true,
};
```

### Password Security

The script uses the same password encryption method as the application:
- Uses `bcryptjs` library
- Salt rounds: 12 (high security)
- Passwords are properly hashed before storage
- Password verification is included to ensure correctness

### Database Connection

The script uses the same database configuration as other application scripts:
- Reads from `.env` file if available
- Falls back to default development settings:
  - Host: localhost
  - Port: 5432
  - User: postgres
  - Password: welcome123
  - Database: postgres

### Features

- ✅ Duplicate user detection (by email and username)
- ✅ Proper password encryption using bcryptjs
- ✅ Password verification test
- ✅ Detailed console output with user information
- ✅ Error handling and cleanup
- ✅ Database connection management

### Example Output

```
🚀 Starting user creation process...
🔍 Checking if user already exists...
🔐 Hashing password...
✅ Password hashed successfully
👤 Creating user in database...
✅ User created successfully!

📋 User Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID:         1a280b12-e2e5-4ea7-9579-ca37ea6d1b54
Username:   sampleuser
Email:      sampleemail@mail.com
Name:       Sample User
Role:       technician
Active:     Yes
Notifications: Enabled
Created:    Mon Sep 29 2025 16:18:26 GMT+0530 (India Standard Time)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔑 Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email:      sampleemail@mail.com
Password:   samplepassword
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Verifying password hash...
Password verification: ✅ Success
```

## Requirements

- Node.js
- PostgreSQL database running
- Required npm packages (already installed in the project):
  - `bcryptjs`
  - `pg`
  - `drizzle-orm`
  - `dotenv`

## Notes

- The script will not create duplicate users (checks both email and username)
- Passwords are encrypted using the same method as the application's user registration
- The created user can immediately log in to the application
- All user data follows the application's schema requirements