# Database Seeders

This directory contains database seeders for populating the database with initial data.

## User Seeder

Seeds the database with sample admin and student users.

### Usage

```bash
npm run seed:users
```

### Default Credentials

All seeded users have the default password: `password123`

#### Admin Users
- **Email:** admin@hostel.com
- **Password:** password123
- **Role:** ADMIN

- **Email:** superadmin@hostel.com
- **Password:** password123
- **Role:** ADMIN

#### Student Users
- **Email:** john.doe@student.com
- **Password:** password123
- **Role:** STUDENT

- **Email:** jane.smith@student.com
- **Password:** password123
- **Role:** STUDENT

- **Email:** mike.johnson@student.com
- **Password:** password123
- **Role:** STUDENT

- **Email:** sarah.williams@student.com
- **Password:** password123
- **Role:** STUDENT

### Notes

- The seeder will skip users that already exist (based on email)
- All users are created with `isVerified: true` for easy testing
- To reset and reseed, you can manually delete users from the database first


