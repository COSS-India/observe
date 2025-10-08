# User Profile APIs Documentation

This document describes the new user profile APIs that match the official Bhashini API response format.

## Database Changes

### New Tables Created:
- `organizations` - Organization details for users
- `supervisor_details` - Supervisor information
- `mou_infos` - Memorandum of Understanding details
- `reference_documents` - Reference documents uploaded by users
- `associated_managers` - Associated managers for different applications

### Updated User Table:
Added new fields to match the official API:
- `designation`, `gender`, `email_id`, `personal_email`, `phone`
- `status`, `product_access`, `additional_contacts`
- `is_exisiting_user`, `is_test_user`, `is_deleted`, `deleted_on`
- `pending_req_count`, `last_login`, `tnc_accepted`, `is_parichay`

## API Endpoints

### 1. Get All Users
```
GET /api/v1/auth/users
```

**Query Parameters:**
- `skip` (int, optional): Number of users to skip (default: 0)
- `limit` (int, optional): Number of users to return (default: 100, max: 1000)
- `include_deleted` (bool, optional): Include deleted users (default: false)

**Response:**
```json
{
  "users": [
    {
      "_id": "1",
      "first_name": "John",
      "last_name": "Doe",
      "designation": "CPO",
      "gender": "male",
      "email_id": "john.doe@karmayogi.in",
      "personal_email": "john.doe@gmail.com",
      "phone": "1234567890",
      "org": {
        "org_name": "Karmayogi Bharat",
        "org_type": "Central Government",
        "org_details": {
          "ministry_name": "Ministry of Personnel, Public Grievances and Pensions",
          "department_name": "Department of Personnel and Training"
        },
        "org_website": "https://igotkarmayogi.gov.in/#/",
        "org_address": {
          "address_type": "Primary",
          "address": "Capital Tower 7th Floor, Vir Marg, Sector 4, Market, New Delhi, Delhi 110001",
          "pincode": "110001",
          "state": "Delhi",
          "city": "CENTRAL DELHI"
        }
      },
      "status": "Engaged",
      "role": "customer",
      "user_type": ["government"],
      "product_access": ["Bhashini Translation Plugin", "Udyat"],
      "mou_info": {
        "mou_format": "",
        "mou_custom_file_upload": null,
        "mou_custom_filename": null,
        "mou_status": "MoU Not Requested",
        "remarks": "",
        "mou_requested_by": "",
        "requested_on": null,
        "updated_on": null,
        "is_deleted": false,
        "deleted_on": null
      },
      "supervisor_details": [
        {
          "first_name": "Jane",
          "last_name": "Smith",
          "official_email": "jane.smith@tarento.com",
          "designation": "Product Manager",
          "phone": "1234567890",
          "id_proof": "234e57db-9938-421c-8330-328907055b66.pdf"
        }
      ],
      "additional_contacts": null,
      "created_on": "2024-01-01T00:00:00",
      "updated_on": "2024-01-02T00:00:00",
      "is_fresh": false,
      "is_profile_updated": true,
      "is_deleted": false,
      "deleted_on": null,
      "tnc_url": "https://userdatav1.blob.core.windows.net/dashboardblob/Terms_and_Conditions_Bhashini.pdf",
      "tnc_accepted": true,
      "reference_documents": [
        {
          "file_name": "IMG_8131.pdf",
          "blob_file_name": "234e57db-9938-421c-8330-328907055b66.pdf",
          "role": "customer",
          "uploaded_by": "John Doe",
          "uploaded_on": "2024-01-01T00:00:00"
        }
      ],
      "last_login": null,
      "is_exisiting_user": false,
      "is_test_user": false,
      "pending_req_count": 0,
      "associated_manager": [
        {
          "application_name": "Bhashini Translation Plugin",
          "manager_email": "manager1@digitalindia.gov.in"
        },
        {
          "application_name": "Udyat",
          "manager_email": "manager2@digitalindia.gov.in"
        }
      ],
      "is_parichay": false
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 100
}
```

### 2. Get User by ID
```
GET /api/v1/auth/users/{user_id}
```

**Path Parameters:**
- `user_id` (int): User ID

**Response:** Same as individual user object in the users list above.

### 3. Get User by Email
```
GET /api/v1/auth/users/email/{email}
```

**Path Parameters:**
- `email` (string): User email address

**Response:** Same as individual user object in the users list above.

## Setup Instructions

### 1. Run Database Migration
```bash
python migrate_database.py
```

### 2. Create Sample Data (Optional)
```bash
python create_sample_data.py
```

### 3. Test the APIs
```bash
# Get all users
curl -X GET "http://localhost:8000/api/v1/auth/users"

# Get user by ID
curl -X GET "http://localhost:8000/api/v1/auth/users/1"

# Get user by email
curl -X GET "http://localhost:8000/api/v1/auth/users/email/john.doe@example.com"
```

## Error Responses

### 404 Not Found
```json
{
  "detail": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to fetch user: [error message]"
}
```

## Notes

1. **ID Format**: The API returns `_id` as a string to match the original API format, even though the database uses integer IDs.

2. **Relationships**: All related data (organization, supervisor details, MOU info, etc.) is loaded using SQLAlchemy's `joinedload` for optimal performance.

3. **Pagination**: The `get_all_users` endpoint supports pagination with `skip` and `limit` parameters.

4. **Soft Delete**: Users can be soft-deleted using the `is_deleted` flag. Use `include_deleted=true` to include deleted users in results.

5. **Data Types**: JSON fields like `user_type`, `product_access`, and `additional_contacts` are stored as JSON in the database.

6. **Timestamps**: All timestamps are in UTC timezone format.

## Migration from Existing Data

If you have existing users in your database, you may need to:

1. Update existing user records with the new fields
2. Create related records (organizations, supervisor details, etc.) for existing users
3. Migrate any existing organization data from the JSON `org_details` field to the new `organizations` table



