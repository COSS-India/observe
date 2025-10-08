# Database Architecture - Bhashini Login System

## Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                DATABASE ARCHITECTURE                            │
│                              Bhashini Login System                              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    USERS TABLE                                  │
│                              (Primary Entity)                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  users                                                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  id (PK)                    │ INTEGER PRIMARY KEY                             │
│  first_name                 │ VARCHAR(100) NOT NULL                           │
│  last_name                  │ VARCHAR(100) NOT NULL                           │
│  email                      │ VARCHAR(255) UNIQUE NOT NULL                     │
│  password_hash              │ VARCHAR(255) NOT NULL                           │
│  role                       │ VARCHAR(50) DEFAULT 'customer'                  │
│  username                   │ VARCHAR(100)                                    │
│  designation                │ VARCHAR(100)                                    │
│  gender                     │ VARCHAR(20)                                     │
│  email_id                   │ VARCHAR(255)                                    │
│  personal_email             │ VARCHAR(255)                                    │
│  phone                      │ VARCHAR(20)                                     │
│  status                     │ VARCHAR(50) DEFAULT 'Engaged'                   │
│  user_type                  │ JSON                                            │
│  product_access            │ JSON                                            │
│  additional_contacts        │ JSON                                            │
│  is_fresh                   │ BOOLEAN DEFAULT TRUE                            │
│  is_profile_updated         │ BOOLEAN DEFAULT FALSE                           │
│  is_existing_user           │ BOOLEAN DEFAULT FALSE                           │
│  is_exisiting_user          │ BOOLEAN DEFAULT FALSE                            │
│  is_test_user               │ BOOLEAN DEFAULT FALSE                           │
│  is_deleted                 │ BOOLEAN DEFAULT FALSE                           │
│  deleted_on                 │ TIMESTAMP WITH TIME ZONE                        │
│  pending_req_count          │ INTEGER DEFAULT 0                              │
│  last_login                 │ TIMESTAMP WITH TIME ZONE                        │
│  tnc_url                    │ TEXT                                           │
│  tnc_accepted               │ BOOLEAN DEFAULT FALSE                           │
│  is_parichay                │ BOOLEAN DEFAULT FALSE                           │
│  org_type                   │ VARCHAR(100) (Legacy)                           │
│  org_name                   │ VARCHAR(255) (Legacy)                           │
│  org_details                │ JSON (Legacy)                                  │
│  stage_completed            │ VARCHAR(100)                                    │
│  is_external                │ BOOLEAN DEFAULT FALSE                           │
│  created_at                 │ TIMESTAMP WITH TIME ZONE DEFAULT NOW()         │
│  updated_at                 │ TIMESTAMP WITH TIME ZONE ON UPDATE NOW()       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:1
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ORGANIZATIONS TABLE                               │
│                            (One-to-One with Users)                             │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  organizations                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  id (PK)                    │ INTEGER PRIMARY KEY                             │
│  user_id (FK)               │ INTEGER REFERENCES users(id) NOT NULL          │
│  org_name                   │ VARCHAR(255) NOT NULL                           │
│  org_type                   │ VARCHAR(100) NOT NULL                           │
│  org_website                │ VARCHAR(500)                                   │
│  ministry_name              │ VARCHAR(255)                                   │
│  department_name            │ VARCHAR(255)                                   │
│  address_type               │ VARCHAR(50) DEFAULT 'Primary'                   │
│  address                    │ TEXT                                           │
│  pincode                    │ VARCHAR(10)                                    │
│  state                      │ VARCHAR(100)                                   │
│  city                       │ VARCHAR(100)                                   │
│  created_at                 │ TIMESTAMP WITH TIME ZONE DEFAULT NOW()         │
│  updated_at                 │ TIMESTAMP WITH TIME ZONE ON UPDATE NOW()       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SUPERVISOR_DETAILS TABLE                         │
│                            (One-to-Many with Users)                           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  supervisor_details                                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  id (PK)                    │ INTEGER PRIMARY KEY                             │
│  user_id (FK)               │ INTEGER REFERENCES users(id) NOT NULL          │
│  first_name                 │ VARCHAR(100) NOT NULL                           │
│  last_name                  │ VARCHAR(100) NOT NULL                           │
│  official_email             │ VARCHAR(255) NOT NULL                           │
│  designation                │ VARCHAR(100)                                   │
│  phone                      │ VARCHAR(20)                                    │
│  id_proof                   │ VARCHAR(500)                                   │
│  created_at                 │ TIMESTAMP WITH TIME ZONE DEFAULT NOW()         │
│  updated_at                 │ TIMESTAMP WITH TIME ZONE ON UPDATE NOW()       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                MOU_INFOS TABLE                                 │
│                            (One-to-One with Users)                             │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  mou_infos                                                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  id (PK)                    │ INTEGER PRIMARY KEY                             │
│  user_id (FK)               │ INTEGER REFERENCES users(id) NOT NULL          │
│  mou_format                 │ VARCHAR(100)                                    │
│  mou_custom_file_upload     │ VARCHAR(500)                                    │
│  mou_custom_filename        │ VARCHAR(255)                                    │
│  mou_status                 │ VARCHAR(100) DEFAULT 'MoU Not Requested'       │
│  remarks                    │ TEXT                                           │
│  mou_requested_by           │ VARCHAR(255)                                    │
│  requested_on               │ TIMESTAMP WITH TIME ZONE                        │
│  updated_on                 │ TIMESTAMP WITH TIME ZONE                        │
│  is_deleted                 │ BOOLEAN DEFAULT FALSE                           │
│  deleted_on                 │ TIMESTAMP WITH TIME ZONE                        │
│  created_at                 │ TIMESTAMP WITH TIME ZONE DEFAULT NOW()           │
│  updated_at                 │ TIMESTAMP WITH TIME ZONE ON UPDATE NOW()       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            REFERENCE_DOCUMENTS TABLE                           │
│                            (One-to-Many with Users)                            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  reference_documents                                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  id (PK)                    │ INTEGER PRIMARY KEY                             │
│  user_id (FK)               │ INTEGER REFERENCES users(id) NOT NULL          │
│  file_name                  │ VARCHAR(255) NOT NULL                           │
│  blob_file_name             │ VARCHAR(500) NOT NULL                           │
│  role                       │ VARCHAR(50) NOT NULL                            │
│  uploaded_by                │ VARCHAR(255) NOT NULL                          │
│  uploaded_on                │ TIMESTAMP WITH TIME ZONE DEFAULT NOW()         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                            ASSOCIATED_MANAGERS TABLE                           │
│                            (One-to-Many with Users)                            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  associated_managers                                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  id (PK)                    │ INTEGER PRIMARY KEY                             │
│  user_id (FK)               │ INTEGER REFERENCES users(id) NOT NULL          │
│  application_name            │ VARCHAR(255) NOT NULL                           │
│  manager_email              │ VARCHAR(255) NOT NULL                           │
│  created_at                 │ TIMESTAMP WITH TIME ZONE DEFAULT NOW()         │
│  updated_at                 │ TIMESTAMP WITH TIME ZONE ON UPDATE NOW()       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                CAPTCHAS TABLE                                  │
│                              (Authentication)                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  captchas                                                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  id (PK)                    │ INTEGER PRIMARY KEY                             │
│  captcha_id                 │ VARCHAR(50) UNIQUE NOT NULL                     │
│  captcha_text               │ VARCHAR(20) NOT NULL                           │
│  image_data                 │ TEXT NOT NULL                                   │
│  created_at                 │ TIMESTAMP WITH TIME ZONE DEFAULT NOW()         │
│  expires_at                 │ TIMESTAMP WITH TIME ZONE NOT NULL               │
│  is_used                    │ BOOLEAN DEFAULT FALSE                           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RELATIONSHIP DIAGRAM                              │
└─────────────────────────────────────────────────────────────────────────────────┘

                    users (1) ──────────── (1) organizations
                         │
                         │ 1:N
                         ▼
                    supervisor_details
                         │
                    users (1) ──────────── (1) mou_infos
                         │
                         │ 1:N
                         ▼
                    reference_documents
                         │
                    users (1) ──────────── (N) associated_managers

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              KEY FEATURES                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

✅ NORMALIZED DESIGN
   - Separate tables for related entities
   - Proper foreign key relationships
   - No data duplication

✅ SCALABLE ARCHITECTURE
   - Indexed primary keys and foreign keys
   - Efficient query patterns with SQLAlchemy relationships
   - Pagination support

✅ DATA INTEGRITY
   - Foreign key constraints
   - NOT NULL constraints where appropriate
   - Default values for common fields

✅ AUDIT TRAIL
   - created_at and updated_at timestamps
   - Soft delete functionality (is_deleted flag)
   - User tracking for document uploads

✅ FLEXIBILITY
   - JSON fields for dynamic data (user_type, product_access)
   - Optional fields for gradual data population
   - Legacy field support for backward compatibility

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              INDEXES & PERFORMANCE                            │
└─────────────────────────────────────────────────────────────────────────────────┘

PRIMARY INDEXES:
- users.id (Primary Key)
- users.email (Unique Index)
- organizations.user_id (Foreign Key Index)
- supervisor_details.user_id (Foreign Key Index)
- mou_infos.user_id (Foreign Key Index)
- reference_documents.user_id (Foreign Key Index)
- associated_managers.user_id (Foreign Key Index)
- captchas.captcha_id (Unique Index)

QUERY OPTIMIZATION:
- SQLAlchemy joinedload for efficient relationship loading
- Pagination with LIMIT/OFFSET
- Soft delete filtering
- JSON field queries for dynamic data

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MIGRATION STRATEGY                                │
└─────────────────────────────────────────────────────────────────────────────────┘

1. CREATE NEW TABLES
   - organizations
   - supervisor_details
   - mou_infos
   - reference_documents
   - associated_managers

2. ADD NEW COLUMNS TO USERS
   - designation, gender, email_id, personal_email
   - phone, status, product_access, additional_contacts
   - is_exisiting_user, is_test_user, is_deleted, deleted_on
   - pending_req_count, last_login, tnc_accepted, is_parichay

3. DATA MIGRATION
   - Migrate existing org_details JSON to organizations table
   - Create default MOU info for existing users
   - Set appropriate default values for new fields

4. BACKWARD COMPATIBILITY
   - Keep legacy fields (org_type, org_name, org_details)
   - Gradual migration of existing data
   - API versioning support



