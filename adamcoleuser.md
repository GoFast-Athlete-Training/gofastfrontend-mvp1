# Adam Cole User Testing Setup

## Overview
This document outlines how to create a test user (Adam Cole) in the database and hydrate the frontend for easy testing of the AthleteCreateProfile form.

## Step 1: Get Adam's Athlete ID from SQL Admin

### Database Query
```sql
-- Connect to GoFast PostgreSQL database
-- Run this query to get Adam's athlete ID

SELECT id, firebaseId, email, firstName, lastName 
FROM athletes 
WHERE email = 'adam@example.com' OR firstName = 'Adam';
```

### Expected Result
```json
{
  "id": "athlete_123456789",
  "firebaseId": "firebase_uid_123",
  "email": "adam@example.com",
  "firstName": "Adam",
  "lastName": "Cole"
}
```

## Step 2: Create Adam's Athlete Record (if not exists)

### Manual Database Insert
```sql
-- If Adam doesn't exist, create him
INSERT INTO athletes (
  id,
  firebaseId,
  email,
  firstName,
  lastName,
  gofastHandle,
  birthday,
  gender,
  city,
  state,
  primarySport,
  bio,
  instagram,
  createdAt,
  updatedAt,
  status
) VALUES (
  'athlete_adam_cole_001',
  'firebase_adam_cole_001',
  'adam@example.com',
  'Adam',
  'Cole',
  'adam_cole',
  '1990-01-15',
  'male',
  'Charlotte',
  'NC',
  'running',
  'Passionate runner focused on marathon training and community building.',
  '@adamcole_runs',
  NOW(),
  NOW(),
  'active'
);
```

## Step 3: Hydrate Frontend for Testing

### Update AthleteCreateProfile.jsx
```javascript
// Add this to the top of AthleteCreateProfile component
useEffect(() => {
  // Pre-fill form with Adam's data for testing
  const adamData = {
    firstName: 'Adam',
    lastName: 'Cole',
    gofastHandle: 'adam_cole',
    birthday: '1990-01-15',
    gender: 'male',
    city: 'Charlotte',
    state: 'NC',
    primarySport: 'running',
    bio: 'Passionate runner focused on marathon training and community building.',
    instagram: '@adamcole_runs'
  };
  
  setFormData(prev => ({
    ...prev,
    ...adamData
  }));
}, []);
```

### Alternative: localStorage Hydration
```javascript
// In AthleteCreateProfile.jsx, add this to handleSubmit
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // For testing - use Adam's athlete ID
  const athleteId = 'athlete_adam_cole_001'; // From SQL query
  
  try {
    // Call backend to update athlete profile
    const res = await api.put(`/athlete/${athleteId}/profile`, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      gofastHandle: formData.gofastHandle,
      birthday: formData.birthday,
      gender: formData.gender,
      city: formData.city,
      state: formData.state,
      primarySport: formData.primarySport,
      bio: formData.bio,
      instagram: formData.instagram
    });
    
    console.log('✅ Profile updated:', res.data);
    navigate('/athlete-home');
  } catch (error) {
    console.error('❌ Profile update failed:', error);
    alert('Profile update failed. Please try again.');
  }
};
```

## Step 4: Testing Flow

### Quick Test Process
1. **Open MVP1** → Navigate to `/athlete-create-profile`
2. **Form pre-filled** → All Adam's data already there
3. **Hit Submit** → Tests the complete profile update flow
4. **Check Database** → Verify data was saved correctly
5. **Navigate to Home** → Test the routing

### Expected Behavior
- ✅ Form loads with Adam's data pre-filled
- ✅ Submit button updates the athlete record
- ✅ Success message appears
- ✅ Navigates to `/athlete-home`
- ✅ Database shows updated profile data

## Step 5: Database Verification

### Check Updated Record
```sql
-- After form submission, verify the data
SELECT 
  id,
  firstName,
  lastName,
  gofastHandle,
  birthday,
  gender,
  city,
  state,
  primarySport,
  bio,
  instagram,
  updatedAt
FROM athletes 
WHERE id = 'athlete_adam_cole_001';
```

### Expected Updated Data
```json
{
  "id": "athlete_adam_cole_001",
  "firstName": "Adam",
  "lastName": "Cole",
  "gofastHandle": "adam_cole",
  "birthday": "1990-01-15T00:00:00.000Z",
  "gender": "male",
  "city": "Charlotte",
  "state": "NC",
  "primarySport": "running",
  "bio": "Passionate runner focused on marathon training and community building.",
  "instagram": "@adamcole_runs",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

## Troubleshooting

### Common Issues
1. **Athlete ID not found** → Check SQL query, verify ID exists
2. **Form not pre-filling** → Check useEffect in AthleteCreateProfile
3. **API call failing** → Check backend route mounting and athleteCreateRoute
4. **Database not updating** → Check Prisma schema and migration

### Debug Steps
1. **Check browser console** → Look for API errors
2. **Check backend logs** → Verify route is being hit
3. **Check database** → Confirm record exists and is updating
4. **Check network tab** → Verify API calls are being made

## Success Criteria
- ✅ Adam's athlete record exists in database
- ✅ AthleteCreateProfile form pre-fills with Adam's data
- ✅ Submit button successfully updates the record
- ✅ Navigation works correctly
- ✅ Database shows updated timestamp

This setup allows for quick, repeatable testing of the profile creation flow without having to manually fill out the form each time.
