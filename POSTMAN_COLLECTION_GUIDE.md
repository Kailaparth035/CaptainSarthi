# Captain Sathi API - Postman Collection Usage Guide

## 📦 Collection Overview
This Postman collection contains **85+ API endpoints** across three main modules:
- **Dealer APIs** (15+ endpoints)
- **Farmer APIs** (11+ endpoints)
- **Admin APIs** (60+ endpoints)

## 🚀 Quick Start

### Step 1: Import the Collection
1. Open Postman
2. Click **Import** button
3. Select the file: `Captain_Sathi_API.postman_collection.json`
4. Click **Import**

### Step 2: Set Up Environment Variables
The collection uses two variables:

| Variable | Default Value | Description |
|----------|--------------|-------------|
| `base_url` | `http://localhost:5000` | Backend API base URL |
| `auth_token` | `` (empty) | JWT token for authenticated requests |

**To set up:**
1. In Postman, go to **Environments**
2. Create a new environment named "Captain Sathi - Local"
3. Add the variables above
4. Save and select this environment

### Step 3: Test the Connection
Run the **Test** endpoint (if available) or any public endpoint to verify connection.

## 🔐 Authentication Flow

### For Dealers
1. **Login with Password:**
   - Endpoint: `POST /api/dealers/login`
   - Body:
     ```json
     {
       "email": "john@example.com",
       "password": "password123"
     }
     ```
   - Copy the `token` from response
   - Set it as `auth_token` variable

2. **Login with OTP:**
   - First, send OTP: `POST /api/dealers/send-otp`
   - Then login: `POST /api/dealers/login` with OTP
   - Copy the `token` from response

### For Farmers
1. **Login with Password:**
   - Endpoint: `POST /api/farmers/login`
   - Body:
     ```json
     {
       "mobile": "9876543210",
       "password": "farmer123"
     }
     ```

2. **Login with OTP:**
   - First, send OTP: `POST /api/farmers/send-otp`
   - Then login: `POST /api/farmers/login` with OTP

### For Admin
Admin endpoints currently don't require authentication in the routes, but you can add admin authentication if needed.

## 📱 Mobile App Team Guide

### Common Use Cases

#### 1. Dealer Dashboard Flow
```
1. POST /api/dealers/login → Get token
2. GET /api/dealers/dashboard → Get dashboard data
3. GET /api/dealers/farmers → List all farmers
4. GET /api/dealers/tractors → List all tractors
```

#### 2. Farmer Registration Flow (by Dealer)
```
1. Dealer logs in
2. POST /api/dealers/farmers → Create farmer
3. POST /api/dealers/farmers/{farmerId}/tractors → Add tractor to farmer
```

#### 3. Farmer App Flow
```
1. POST /api/farmers/login → Get token
2. GET /api/farmers/dashboard → Get dashboard (stories, videos, events)
3. GET /api/farmers/profile → Get profile with tractors
4. GET /api/farmers/events → Browse events
5. GET /api/farmers/stories → Browse stories
```

#### 4. Admin Management Flow
```
1. GET /api/admin/dashboard → Get counts
2. GET /api/admin/dealers → List all dealers
3. POST /api/admin/dealers → Create dealer
4. GET /api/admin/farmers → List all farmers
5. GET /api/admin/tractors → List all tractors
6. GET /api/admin/farmer-forms → Review pending forms
7. PUT /api/admin/farmer-forms/{id}/status → Accept/Reject forms
```

## 📋 API Modules Breakdown

### Dealer APIs (15+ endpoints)
- **Authentication**: Login (Password/OTP), Send OTP
- **Dashboard**: Get dashboard summary
- **Farmers**: List, Get by ID, Create, Update
- **Tractors**: List, Get by ID, Add to Farmer
- **Profile**: Get, Update, Upload Image

### Farmer APIs (11+ endpoints)
- **Authentication**: Login (Password/OTP), Send OTP
- **Dashboard**: Get dashboard with stories/videos/events
- **Content**: Recent Stories, Top Videos, Events, Story Details
- **Profile**: Get, Update, Upload Image, Request Mobile Update

### Admin APIs (60+ endpoints)
- **Dashboard**: Get summary counts
- **Dealers**: CRUD operations
- **Farmers**: CRUD operations
- **Tractors**: List, Update with images
- **Events**: CRUD with image upload
- **Stories**: List
- **Questions**: CRUD with dynamic answers (textbox/radio/checkbox)
- **Locations**: Countries, States, Cities (CRUD for each)
- **Farmer Forms**: List, Accept, Reject
- **Banners**: CRUD with image upload

## 🖼️ File Upload Endpoints

These endpoints use `multipart/form-data`:

1. **Dealer Profile Image**
   - `POST /api/dealers/profile/image`
   - Field: `image` (file)

2. **Farmer Profile Image**
   - `POST /api/farmers/profile/image`
   - Field: `image` (file)

3. **Tractor Images**
   - `PUT /api/admin/tractors/{id}`
   - Fields: `main_image` (file), `gallery_images` (multiple files)

4. **Event Image**
   - `POST /api/admin/events`
   - Field: `image` (file)

5. **Banner Image**
   - `POST /api/admin/banners`
   - `PUT /api/admin/banners/{id}`
   - Field: `image` (file)

## 📝 Request Body Examples

### Create Dealer
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India"
}
```

### Create Farmer
```json
{
  "first_name": "Ramesh",
  "middle_name": "Kumar",
  "last_name": "Patel",
  "mobile": "9876543210",
  "dealer_id": 1,
  "date_of_birth": "1985-05-15",
  "date_of_marriage": "2010-12-20",
  "password": "farmer123"
}
```

### Add Tractor to Farmer
```json
{
  "tractor_id": 1,
  "chassis_no": "CH123456",
  "vehicle_no": "GJ01AB1234",
  "engine_no": "EN789012",
  "owner_mobile": "9876543210",
  "date_of_invoice": "2024-01-15",
  "who_drives": "Owner"
}
```

### Create Question (Radio)
```json
{
  "category_id": 1,
  "question_text": "Do you own a tractor?",
  "question_type": "radio",
  "status": true,
  "answers": [
    {"answer_text": "Yes"},
    {"answer_text": "No"}
  ]
}
```

### Create Question (Checkbox)
```json
{
  "category_id": 1,
  "question_text": "Which crops do you grow?",
  "question_type": "checkbox",
  "status": true,
  "answers": [
    {"answer_text": "Wheat"},
    {"answer_text": "Rice"},
    {"answer_text": "Cotton"},
    {"answer_text": "Sugarcane"}
  ]
}
```

### Create Question (Textbox)
```json
{
  "category_id": 1,
  "question_text": "What is your farm size?",
  "question_type": "textbox",
  "status": true
}
```

## 🔄 Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

## 🎯 Auto-Increment IDs

The system uses auto-increment IDs:
- **Dealers**: `DLR0001`, `DLR0002`, `DLR0003`, ...
- **Farmers**: `FMR0001`, `FMR0002`, `FMR0003`, ...

These are automatically generated when creating new records.

## 🔒 Token Expiry

- **Dealer/Farmer tokens**: 24 hours
- **Admin tokens**: 1 hour (if implemented)
- **OTP expiry**: 5 minutes

## 🌐 Environment Setup

### Local Development
```
base_url: http://localhost:5000
```

### Staging (if applicable)
```
base_url: https://staging-api.captainsathi.com
```

### Production (if applicable)
```
base_url: https://api.captainsathi.com
```

## 🐛 Troubleshooting

### Issue: "No token provided"
- **Solution**: Make sure you've set the `auth_token` variable after logging in

### Issue: "Invalid token"
- **Solution**: Token might be expired. Login again to get a new token

### Issue: 500 Internal Server Error
- **Solution**: Check if the backend server is running on `http://localhost:5000`

### Issue: File upload fails
- **Solution**: Ensure you're using `form-data` body type, not `raw` JSON

## 📞 Support

For any issues or questions, contact the backend development team.

## 📄 Notes

- All endpoints with authentication require `Authorization: Bearer {token}` header
- The collection automatically handles this if you set the `auth_token` variable
- File paths in responses are relative (e.g., `/uploads/tractors/image.jpg`)
- OTP is returned in response for development (remove in production)
- Some endpoints may require admin authentication (to be implemented)

---

**Last Updated**: December 7, 2024
**API Version**: 1.0
**Collection Version**: 1.0
