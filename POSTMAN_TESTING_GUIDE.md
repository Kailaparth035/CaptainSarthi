# Postman Testing Guide - Step by Step

## ✅ Backend Server Status
Your backend server is now running on **http://localhost:5000**

## 📋 Step-by-Step Testing Instructions

### Step 1: Set Up Environment in Postman

1. **Create Environment**
   - Click the **Environment** dropdown (top right in Postman)
   - Click **"+"** to create new environment
   - Name it: `Captain Sathi - Local`

2. **Add Variables**
   - Add variable: `base_url` = `http://localhost:5000`
   - Add variable: `auth_token` = (leave empty for now)
   - Click **Save**

3. **Select Environment**
   - Select `Captain Sathi - Local` from the dropdown

### Step 2: Test Admin Endpoints (No Auth Required)

#### Test 1: Get Admin Dashboard
```
Method: GET
URL: {{base_url}}/api/admin/dashboard
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "farmersCount": 0,
    "dealersCount": 0,
    "tractorsCount": 0,
    "pendingFormsCount": 0
  }
}
```

#### Test 2: Create Your First Dealer
```
Method: POST
URL: {{base_url}}/api/admin/dealers
Headers: Content-Type: application/json
Body (raw JSON):
```
```json
{
  "name": "Test Dealer",
  "email": "dealer@test.com",
  "phone": "9876543210",
  "password": "dealer123",
  "address": "123 Test Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Dealer created successfully",
  "data": {
    "id": 1,
    "dealer_id": "DLR0001",
    "name": "Test Dealer",
    "email": "dealer@test.com",
    ...
  }
}
```

✅ **Note the `dealer_id`: DLR0001** - You'll need this!

### Step 3: Test Dealer Authentication

#### Test 3: Dealer Login (Password)
```
Method: POST
URL: {{base_url}}/api/dealers/login
Headers: Content-Type: application/json
Body (raw JSON):
```
```json
{
  "email": "dealer@test.com",
  "password": "dealer123"
}
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "dealer": {
    "id": 1,
    "dealer_id": "DLR0001",
    "name": "Test Dealer",
    ...
  }
}
```

✅ **IMPORTANT: Copy the `token` value!**

#### Test 4: Set Auth Token
1. Go to your environment `Captain Sathi - Local`
2. Paste the token into `auth_token` variable
3. Save the environment

### Step 4: Test Authenticated Dealer Endpoints

#### Test 5: Get Dealer Dashboard
```
Method: GET
URL: {{base_url}}/api/dealers/dashboard
Authorization: Bearer Token (automatically added from environment)
```

**Expected Response:**
```json
{
  "status": true,
  "farmerData": [],
  "tractorData": [],
  "dashboardSummaryData": {
    "userName": "Test Dealer",
    "activeClients": 0,
    "tractorModels": 0,
    "syncPending": 0
  }
}
```

#### Test 6: Create a Farmer (by Dealer)
```
Method: POST
URL: {{base_url}}/api/dealers/farmers
Headers: Content-Type: application/json
Authorization: Bearer Token (automatically added)
Body (raw JSON):
```
```json
{
  "first_name": "Ramesh",
  "middle_name": "Kumar",
  "last_name": "Patel",
  "mobile": "9123456789",
  "date_of_birth": "1985-05-15",
  "date_of_marriage": "2010-12-20",
  "dealership_name": "Patel Tractors",
  "password": "farmer123"
}
```

**Expected Response:**
```json
{
  "status": true,
  "message": "Farmer created successfully",
  "data": {
    "id": 1,
    "farmer_id": "FMR0001",
    "first_name": "Ramesh",
    ...
  }
}
```

✅ **Note the `farmer_id`: FMR0001**

### Step 5: Test Farmer Authentication

#### Test 7: Farmer Login
```
Method: POST
URL: {{base_url}}/api/farmers/login
Headers: Content-Type: application/json
Body (raw JSON):
```
```json
{
  "mobile": "9123456789",
  "password": "farmer123"
}
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "farmer": {
    "id": 1,
    "farmer_id": "FMR0001",
    ...
  }
}
```

✅ **Copy this token and update `auth_token` to test farmer endpoints**

#### Test 8: Get Farmer Dashboard
```
Method: GET
URL: {{base_url}}/api/farmers/dashboard
Authorization: Bearer Token (automatically added)
```

**Expected Response:**
```json
{
  "status": true,
  "recentStories": [],
  "topVideos": [],
  "upcomingEvents": []
}
```

### Step 6: Test OTP Login Flow

#### Test 9: Send OTP to Dealer
```
Method: POST
URL: {{base_url}}/api/dealers/send-otp
Headers: Content-Type: application/json
Body (raw JSON):
```
```json
{
  "email": "dealer@test.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otp": "1234"
}
```

✅ **Note the OTP** (in production, this won't be returned)

#### Test 10: Login with OTP
```
Method: POST
URL: {{base_url}}/api/dealers/login
Headers: Content-Type: application/json
Body (raw JSON):
```
```json
{
  "email": "dealer@test.com",
  "otp": "1234"
}
```

### Step 7: Test File Upload

#### Test 11: Upload Dealer Profile Image
```
Method: POST
URL: {{base_url}}/api/dealers/profile/image
Authorization: Bearer Token (use dealer token)
Body: form-data
```

**Form Data:**
- Key: `image`
- Type: File
- Value: Select any image file from your computer

**Expected Response:**
```json
{
  "status": true,
  "message": "Profile image updated successfully",
  "data": {
    "profile_image": "/assets/uploads/profiles/xxxxx.jpg"
  }
}
```

### Step 8: Test Admin CRUD Operations

#### Test 12: Get All Dealers
```
Method: GET
URL: {{base_url}}/api/admin/dealers
```

#### Test 13: Get All Farmers
```
Method: GET
URL: {{base_url}}/api/admin/farmers
```

#### Test 14: Create Event with Image
```
Method: POST
URL: {{base_url}}/api/admin/events
Body: form-data
```

**Form Data:**
- `title`: Farmer Meet 2024
- `description`: Annual farmer gathering
- `event_date`: 2024-12-25
- `location`: Mumbai
- `status`: true
- `image`: (select image file)

## 🎯 Quick Test Checklist

- [ ] Backend server running on port 5000
- [ ] Environment created in Postman
- [ ] Admin dashboard tested
- [ ] Dealer created via admin
- [ ] Dealer login successful
- [ ] Auth token saved in environment
- [ ] Dealer dashboard accessed
- [ ] Farmer created by dealer
- [ ] Farmer login successful
- [ ] Farmer dashboard accessed
- [ ] OTP flow tested
- [ ] File upload tested
- [ ] Admin CRUD operations tested

## 🐛 Troubleshooting

### Issue: "Cannot connect to server"
**Solution:** Make sure backend is running on port 5000
```bash
cd backend/auth-service
npm start
```

### Issue: "No token provided" or "Invalid token"
**Solution:** 
1. Login again to get fresh token
2. Copy the token from response
3. Update `auth_token` in environment
4. Make sure environment is selected

### Issue: "Dealer not found" when logging in
**Solution:** Create dealer first using Admin endpoint

### Issue: File upload fails
**Solution:** 
1. Make sure you're using `form-data` body type
2. Select file properly in Postman
3. Ensure auth token is set

## 📊 Testing Order Recommendation

1. ✅ Admin endpoints (no auth needed)
2. ✅ Create dealer via admin
3. ✅ Dealer login & authentication
4. ✅ Dealer operations (create farmer, manage tractors)
5. ✅ Farmer login & authentication
6. ✅ Farmer operations (view content, update profile)
7. ✅ File uploads
8. ✅ OTP flows

## 💡 Pro Tips

1. **Save Requests**: Click "Save" after testing each request for future use
2. **Use Tests Tab**: Add tests to auto-save tokens
   ```javascript
   // In Tests tab of login request
   pm.environment.set("auth_token", pm.response.json().token);
   ```
3. **Use Collections Runner**: Test multiple requests in sequence
4. **Check Console**: View detailed request/response in Postman Console (View → Show Postman Console)

## 🎉 Success Indicators

- ✅ Status code: 200 or 201
- ✅ Response has `"success": true`
- ✅ Data is returned in expected format
- ✅ Auto-increment IDs working (DLR0001, FMR0001)
- ✅ Tokens are valid for 24 hours
- ✅ File uploads return file paths

---

**Happy Testing! 🚀**

If you encounter any issues, check the backend console for error messages.
