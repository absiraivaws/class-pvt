# Private Class Student Payment Web Platform

## Software Development & System Requirement Document

**Project Type:** Web-Based Student Registration and Class Fee Payment System\
**Purpose:** Allow private-class students to register, log in, select classes/subjects, view fees, generate an invoice, and make payment using an amount-specific Dynamic QR.

---

# 1. Project Objective

The objective is to develop a secure web platform where students attending private classes can:

- Register online.
- Log in securely.
- Reset a forgotten password using email.
- View available classes by **Month / Year**.
- Select a class session:
  - Day
  - Evening
  - Special
- Select one or more subjects.
- View the individual subject fee.
- View the cumulative total automatically.
- Generate an invoice.
- Generate an amount-specific Dynamic QR.
- Download the payment QR.
- Make the payment.
- Receive confirmation after successful payment.
- Download the final paid invoice/receipt.
- View their previous payment history.

The system should also provide an **Admin Portal** to manage students, months, classes, subjects, fees, payments, invoices, and reports.

---

# 2. Proposed User Roles

## 2.1 Student

Student can:

- Register.
- Log in.
- Reset password.
- View profile.
- Select Month/Year.
- Select class session.
- Select subjects.
- View fees.
- Generate invoice.
- Generate payment QR.
- Download QR.
- Check payment status.
- Download receipt.
- View payment history.

## 2.2 Administrator

Administrator can:

- Log in to Admin Portal.
- Create/update students.
- Activate/deactivate students.
- Create Month/Year class periods.
- Create subjects.
- Create class sessions.
- Configure subject fees.
- View invoices.
- View payments.
- Check pending payments.
- View failed payments.
- Generate reports.
- Download Excel/PDF reports.
- View system audit records.

---

# 3. Student Registration

The student registration form should collect the following information.

| Field                  | Required | Example                                        |
| ---------------------- | -------: | ---------------------------------------------- |
| SID                    |      Yes | STU000123                                      |
| Student Name           |      Yes | John Fernando                                  |
| NIC                    |      Yes | 200012345678                                   |
| Stream                 |      Yes | Bio Science                                    |
| Parent / Guardian Name |      Yes | Peter Fernando                                 |
| Phone Number           |      Yes | 0771234567                                     |
| Email Address          |      Yes | [student@email.com](mailto\:student@email.com) |
| Password               |      Yes | \*\*\*\*\*\*\*\*                               |
| Confirm Password       |      Yes | \*\*\*\*\*\*\*\*                               |

---

# 4. Registration Validation

The system must validate:

### SID

- Must be unique.
- Cannot be used by two students.

Example:

`STU000001`

### NIC

- Must be valid format.
- Must be unique.

Support both:

- Old NIC format
- New NIC format

### Phone Number

Example:

`0771234567`

### Email

Must be a valid email address.

The same email should not normally be registered twice unless permitted by the administrator.

### Password

Recommended minimum:

- 8 characters
- At least one uppercase character
- At least one lowercase character
- At least one number

Passwords must never be stored as plain text.

They should be securely hashed before storing in the database.

---

# 5. Student Registration Workflow

```text
Student
   ↓
Open Registration Page
   ↓
Enter Student Details
   ↓
Validate SID / NIC / Email
   ↓
Create Password
   ↓
Accept Terms & Conditions
   ↓
Click Register
   ↓
System Creates Student Account
   ↓
Optional Email Verification
   ↓
Account Activated
   ↓
Student Login
```

---

# 6. Student Login

Login page should contain:

- SID or Email
- Password
- Login button
- Forgot Password
- Register New Student

Example:

```text
----------------------------------------
          STUDENT LOGIN
----------------------------------------

SID / Email
[____________________________]

Password
[____________________________]

[ Login ]

Forgot Password?

New Student? Register
----------------------------------------
```

---

# 7. Forgot Password Function

The system must provide password recovery using the registered email address.

## Workflow

```text
Student
   ↓
Click "Forgot Password"
   ↓
Enter Registered Email
   ↓
System Checks Email
   ↓
Password Reset Link Sent
   ↓
Student Opens Email
   ↓
Click Reset Password
   ↓
Enter New Password
   ↓
Confirm New Password
   ↓
Password Updated
   ↓
Student Can Login
```

The password reset link should expire, for example, within **15–30 minutes**.

---

# 8. Student Dashboard

After login, the student should see a dashboard similar to:

```text
-----------------------------------------------------
Welcome, John Fernando
SID: STU000123
Stream: Bio Science
-----------------------------------------------------

Class Payment

Month / Year:
[ May / 2026 ▼ ]

Class Time:
[ Day ▼ ]

Available Subjects

☐ Bio Science            Rs. 2,500.00
☐ Chemistry              Rs. 2,000.00
☐ Physics                Rs. 2,000.00
☐ Mathematics            Rs. 2,500.00

--------------------------------------
Selected Total:           Rs. 0.00
--------------------------------------

[ Proceed to Invoice ]

Payment History
Profile
Logout
```

---

# 9. Month / Year Selection

Administrator should create available payment periods.

Examples:

- May / 2026
- June / 2026
- July / 2026
- August / 2026

The system should not hard-code these values.

Admin must be able to:

- Create month.
- Activate month.
- Close month.
- Reopen month if required.

---

# 10. Class Time / Session

The system initially supports:

1. Day
2. Evening
3. Special

Admin should be able to create additional session types later.

Example:

```text
Month: May / 2026

Class Time:

○ Day
○ Evening
○ Special
```

---

# 11. Subjects

Initial subjects:

- Bio Science
- Chemistry
- Physics
- Mathematics

Subjects should be maintained from the Admin Portal rather than hard-coded.

Administrator should be able to:

- Add subjects.
- Edit subjects.
- Disable subjects.
- Set fees.
- Change fees for different periods/classes.

---

# 12. Subject Fee Configuration

Different subjects may have different fees.

Example:

| Month    | Session | Subject     |       Fee |
| -------- | ------- | ----------- | --------: |
| May/2026 | Day     | Bio Science | Rs. 2,500 |
| May/2026 | Day     | Chemistry   | Rs. 2,000 |
| May/2026 | Day     | Physics     | Rs. 2,000 |
| May/2026 | Day     | Mathematics | Rs. 2,500 |
| May/2026 | Evening | Chemistry   | Rs. 2,500 |
| May/2026 | Special | Physics     | Rs. 3,000 |

This makes the system flexible.

---

# 13. Subject Selection

Students should be able to select subjects individually.

Example:

```text
☑ Bio Science             Rs. 2,500
☑ Chemistry               Rs. 2,000
☐ Physics                 Rs. 2,000
☑ Mathematics             Rs. 2,500
```

The system immediately calculates:

```text
Bio Science      Rs. 2,500
Chemistry        Rs. 2,000
Mathematics      Rs. 2,500
-------------------------
Total             Rs. 7,000
```

The total must update automatically when a student selects or deselects a subject.

---

# 14. Important Payment Validation

Before creating an invoice, the system must check whether the selected subject has already been paid for the same:

- Student
- Month
- Year
- Session
- Subject

Example:

If Student `STU000123` has already paid:

> May/2026 – Day – Chemistry

the system should show:

**PAID**

and prevent another accidental payment.

Example:

```text
☐ Bio Science            Rs. 2,500
✓ Chemistry              PAID
☐ Physics                Rs. 2,000
☐ Mathematics            Rs. 2,500
```

---

# 15. Cumulative Amount Calculation

Calculation:

```text
Total Amount =
Sum of all selected subject fees
```

Example:

```text
Bio Science       Rs. 2,500
Chemistry         Rs. 2,000
Physics           Rs. 2,000
--------------------------------
TOTAL              Rs. 6,500
```

The amount used for the payment QR must always be generated by the server.

The browser must never be allowed to manually modify the payable amount.

---

# 16. Invoice Generation

After selecting subjects, the student clicks:

**Proceed to Invoice**

The system creates a unique invoice.

Example invoice number:

`INV-2026-00001234`

---

# 17. Invoice Format

## PRIVATE CLASS STUDENT PAYMENT

**Invoice No:** INV-2026-00001234\
**Invoice Date:** 18/08/2026\
**Payment Status:** Pending

### Student Details

| Description  | Details                                        |
| ------------ | ---------------------------------------------- |
| SID          | STU000123                                      |
| Student Name | John Fernando                                  |
| NIC          | 200012345678                                   |
| Stream       | Bio Science                                    |
| Phone        | 0771234567                                     |
| Email        | [student@email.com](mailto\:student@email.com) |

### Class Details

**Month / Year:** May / 2026\
**Class Session:** Day

### Selected Subjects

| Subject     |           Amount |
| ----------- | ---------------: |
| Bio Science |     Rs. 2,500.00 |
| Chemistry   |     Rs. 2,000.00 |
| Physics     |     Rs. 2,000.00 |
| **Total**   | **Rs. 6,500.00** |

### Payment Status

**Pending Payment**

Buttons:

**PAY NOW**

**Cancel**

---

# 18. Dynamic QR Payment

When the student clicks:

**PAY NOW**

the system sends a request to the connected bank/payment service.

Example:

```text
Invoice Number:
INV-2026-00001234

Amount:
Rs. 6,500.00

Reference:
STU000123-MAY2026
```

The payment provider generates a **Dynamic QR containing the transaction-specific payment information and amount**.

---

# 19. Dynamic QR Screen

Example:

```text
------------------------------------------------

        PAY YOUR CLASS FEE

Invoice:
INV-2026-00001234

Student:
John Fernando

SID:
STU000123

Amount:
Rs. 6,500.00


             [ QR CODE ]


Scan using a supported banking/payment application.

QR Expiry:
09:42

[ Download Payment QR ]

[ Check Payment Status ]

------------------------------------------------
```

---

# 20. Download Payment QR

Student should have the option:

**Download Payment QR**

The downloaded QR image/PDF should include:

- Institute name/logo
- Student Name
- SID
- Invoice Number
- Amount
- QR Code
- QR expiry information where applicable
- Payment instructions

Example filename:

`PaymentQR_INV-2026-00001234.png`

or:

`PaymentQR_INV-2026-00001234.pdf`

---

# 21. QR Expiry

Dynamic QR should preferably have an expiry period.

Example:

`10 Minutes`

After expiry:

```text
QR EXPIRED

[ Generate New QR ]
```

Generating a new QR must not create a duplicate invoice.

The same invoice should normally receive a new payment attempt/QR.

---

# 22. Payment Processing Workflow

```text
Student Login
      ↓
Select Month / Year
      ↓
Select Class Session
      ↓
Select Subjects
      ↓
System Loads Subject Fees
      ↓
Calculate Cumulative Total
      ↓
Student Reviews Details
      ↓
Generate Invoice
      ↓
Click PAY
      ↓
System Sends Payment Request
      ↓
Dynamic QR Generated
      ↓
Student Scans QR
      ↓
Payment Completed
      ↓
Payment Provider Confirms Transaction
      ↓
System Validates Transaction
      ↓
Update Payment = SUCCESS
      ↓
Update Invoice = PAID
      ↓
Generate Receipt
      ↓
Email Confirmation
      ↓
Student Downloads Receipt
```

---

# 23. Critical Payment Rule

**Generating a QR does not mean payment is successful.**

The system must update an invoice to **PAID** only after receiving and validating confirmation from the payment provider.

Payment confirmation should preferably be received through:

```text
Payment Provider
       ↓
Webhook / Payment Notification API
       ↓
Payment Server
       ↓
Verify Signature
       ↓
Verify Transaction ID
       ↓
Verify Amount
       ↓
Verify Invoice
       ↓
Update Database
```

This prevents fraudulent payment confirmations.

---

# 24. Payment Statuses

Recommended statuses:

### Invoice

- DRAFT
- PENDING\_PAYMENT
- PAID
- CANCELLED
- EXPIRED

### Payment

- INITIATED
- QR\_GENERATED
- PENDING
- SUCCESS
- FAILED
- EXPIRED
- CANCELLED
- REFUNDED

---

# 25. Successful Payment Screen

After successful payment:

```text
✓ PAYMENT SUCCESSFUL

Student:
John Fernando

SID:
STU000123

Invoice:
INV-2026-00001234

Payment Reference:
TXN938472934

Amount:
Rs. 6,500.00

Payment Date:
18/08/2026 03:25 PM

[ Download Receipt ]

[ Back to Dashboard ]
```

---

# 26. Payment Receipt

Receipt should contain:

- Institute name
- Institute address
- Contact details
- Receipt Number
- Invoice Number
- Student SID
- Student Name
- Month/Year
- Session
- Selected subjects
- Amount
- Payment Method
- Transaction Reference
- Payment Date/Time
- Payment Status

Example receipt number:

`RCT-2026-00000987`

---

# 27. Student Payment History

Dashboard should provide:

## Payment History

| Month    | Session | Subjects       |   Amount | Status  | Action  |
| -------- | ------- | -------------- | -------: | ------- | ------- |
| May/2026 | Day     | Bio, Chemistry | Rs.4,500 | Paid    | Receipt |
| Jun/2026 | Evening | Physics        | Rs.2,000 | Paid    | Receipt |
| Jul/2026 | Day     | Mathematics    | Rs.2,500 | Pending | Pay     |

Student can:

- View invoice.
- Download receipt.
- Continue pending payment.

---

# 28. Admin Dashboard

Example dashboard:

```text
--------------------------------------------------
              ADMIN DASHBOARD
--------------------------------------------------

Total Students             1,250

Today's Payments           Rs. 350,000

This Month                 Rs. 3,250,000

Pending Payments           175

Successful Payments        1,075

Failed Payments            25

--------------------------------------------------

Students
Classes
Subjects
Fees
Invoices
Payments
Reports
Users
Settings
Audit Logs

--------------------------------------------------
```

---

# 29. Admin – Student Management

Administrator can:

- Search SID.
- Search NIC.
- Search student name.
- Search phone number.
- Search email.
- View student.
- Edit student.
- Disable account.
- Reset account.
- View payments.

---

# 30. Admin – Class Period Management

Example:

| Period      | Status |
| ----------- | ------ |
| May/2026    | Closed |
| June/2026   | Closed |
| July/2026   | Active |
| August/2026 | Active |

Actions:

- Create
- Edit
- Activate
- Close

---

# 31. Admin – Subject Management

Example:

| Code | Subject     | Status |
| ---- | ----------- | ------ |
| BIO  | Bio Science | Active |
| CHEM | Chemistry   | Active |
| PHY  | Physics     | Active |
| MATH | Mathematics | Active |

---

# 32. Admin – Fee Management

Administrator selects:

```text
Month: August/2026
Session: Evening
```

Then enters:

```text
Bio Science       Rs. 2,500
Chemistry         Rs. 2,000
Physics           Rs. 2,000
Mathematics       Rs. 2,500
```

---

# 33. Reports

Administrator should be able to generate reports by:

- Date
- Month
- Year
- Student
- SID
- Subject
- Stream
- Class session
- Payment status

Recommended reports:

### Daily Collection

```text
18/08/2026

Bio Science       Rs. 75,000
Chemistry         Rs. 60,000
Physics           Rs. 52,000
Mathematics       Rs. 65,000

Total             Rs.252,000
```

### Monthly Collection

### Subject-Wise Collection

### Student-Wise Payment

### Outstanding Students

### Successful Transactions

### Failed Transactions

### Payment Reconciliation Report

Reports should support:

- View
- PDF download
- Excel download

---

# 34. Proposed Database Structure

Recommended database:

**PostgreSQL**

---

# 35. Students Table

### `students`

| Field           | Type      |
| --------------- | --------- |
| id              | UUID      |
| sid             | VARCHAR   |
| student\_name   | VARCHAR   |
| nic             | VARCHAR   |
| stream\_id      | UUID      |
| guardian\_name  | VARCHAR   |
| phone           | VARCHAR   |
| email           | VARCHAR   |
| password\_hash  | VARCHAR   |
| email\_verified | BOOLEAN   |
| status          | VARCHAR   |
| created\_at     | TIMESTAMP |
| updated\_at     | TIMESTAMP |

Unique fields:

```text
sid
nic
email
```

---

# 36. Streams Table

### `streams`

| Field        | Type    |
| ------------ | ------- |
| id           | UUID    |
| stream\_name | VARCHAR |
| status       | BOOLEAN |

Example:

```text
Bio Science
Mathematics
```

---

# 37. Subjects Table

### `subjects`

| Field         | Type      |
| ------------- | --------- |
| id            | UUID      |
| subject\_code | VARCHAR   |
| subject\_name | VARCHAR   |
| status        | BOOLEAN   |
| created\_at   | TIMESTAMP |

---

# 38. Class Period Table

### `class_periods`

| Field         | Type    |
| ------------- | ------- |
| id            | UUID    |
| month         | INTEGER |
| year          | INTEGER |
| display\_name | VARCHAR |
| status        | VARCHAR |

Example:

```text
month = 5
year = 2026
display_name = May/2026
```

---

# 39. Class Sessions Table

### `class_sessions`

| Field         | Type    |
| ------------- | ------- |
| id            | UUID    |
| session\_name | VARCHAR |
| status        | BOOLEAN |

Example values:

```text
Day
Evening
Special
```

---

# 40. Subject Fees Table

### `subject_fees`

| Field             | Type      |
| ----------------- | --------- |
| id                | UUID      |
| class\_period\_id | UUID      |
| session\_id       | UUID      |
| subject\_id       | UUID      |
| amount            | DECIMAL   |
| status            | BOOLEAN   |
| created\_at       | TIMESTAMP |

---

# 41. Invoices Table

### `invoices`

| Field             | Type      |
| ----------------- | --------- |
| id                | UUID      |
| invoice\_number   | VARCHAR   |
| student\_id       | UUID      |
| class\_period\_id | UUID      |
| session\_id       | UUID      |
| subtotal          | DECIMAL   |
| total\_amount     | DECIMAL   |
| status            | VARCHAR   |
| created\_at       | TIMESTAMP |
| paid\_at          | TIMESTAMP |

---

# 42. Invoice Items Table

### `invoice_items`

| Field         | Type    |
| ------------- | ------- |
| id            | UUID    |
| invoice\_id   | UUID    |
| subject\_id   | UUID    |
| subject\_name | VARCHAR |
| unit\_amount  | DECIMAL |
| amount        | DECIMAL |

The subject name and amount should also be captured in the invoice item so historical invoices are not changed when future fees change.

---

# 43. Payments Table

### `payments`

| Field                     | Type      |
| ------------------------- | --------- |
| id                        | UUID      |
| invoice\_id               | UUID      |
| student\_id               | UUID      |
| payment\_reference        | VARCHAR   |
| provider\_transaction\_id | VARCHAR   |
| payment\_method           | VARCHAR   |
| amount                    | DECIMAL   |
| status                    | VARCHAR   |
| qr\_reference             | VARCHAR   |
| qr\_expiry                | TIMESTAMP |
| initiated\_at             | TIMESTAMP |
| paid\_at                  | TIMESTAMP |

---

# 44. Payment QR Table

### `payment_qr`

| Field         | Type      |
| ------------- | --------- |
| id            | UUID      |
| payment\_id   | UUID      |
| qr\_reference | VARCHAR   |
| qr\_data      | TEXT      |
| amount        | DECIMAL   |
| generated\_at | TIMESTAMP |
| expires\_at   | TIMESTAMP |
| status        | VARCHAR   |

Do not store unnecessary sensitive payment credentials inside this table.

---

# 45. Password Reset Table

### `password_reset_tokens`

| Field       | Type      |
| ----------- | --------- |
| id          | UUID      |
| student\_id | UUID      |
| token\_hash | VARCHAR   |
| expires\_at | TIMESTAMP |
| used\_at    | TIMESTAMP |
| created\_at | TIMESTAMP |

---

# 46. Audit Logs Table

### `audit_logs`

| Field        | Type      |
| ------------ | --------- |
| id           | UUID      |
| user\_id     | UUID      |
| user\_type   | VARCHAR   |
| action       | VARCHAR   |
| entity\_type | VARCHAR   |
| entity\_id   | UUID      |
| ip\_address  | VARCHAR   |
| created\_at  | TIMESTAMP |

Examples:

```text
STUDENT_LOGIN
PASSWORD_RESET
INVOICE_CREATED
PAYMENT_QR_GENERATED
PAYMENT_SUCCESS
FEE_CHANGED
STUDENT_UPDATED
```

---

# 47. Database Relationship

```text
STUDENT
   │
   ├───────────────┐
   │               │
   ▼               ▼
INVOICE          PAYMENT
   │               │
   ▼               ▼
INVOICE ITEMS   PAYMENT QR
   │
   ▼
SUBJECT
   │
   ▼
SUBJECT FEES
   │
   ├──────── CLASS PERIOD
   │
   └──────── CLASS SESSION
```

More precisely:

```text
Students
   │
   └── 1:N ── Invoices
                    │
                    ├── 1:N ── Invoice Items
                    │              │
                    │              └── N:1 Subject
                    │
                    └── 1:N ── Payments
                                   │
                                   └── 1:N Payment QR
```

---

# 48. Recommended API Structure

Example backend APIs:

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

## Student

```text
GET  /api/student/profile
PUT  /api/student/profile
GET  /api/student/payment-history
```

## Classes

```text
GET /api/class-periods
GET /api/class-sessions
GET /api/subjects
GET /api/fees
```

## Invoice

```text
POST /api/invoices
GET  /api/invoices/:id
GET  /api/invoices/:id/status
```

## Payment

```text
POST /api/payments/create
POST /api/payments/:id/generate-qr
GET  /api/payments/:id/status
POST /api/payments/webhook
```

## Receipt

```text
GET /api/receipts/:id
GET /api/receipts/:id/pdf
```

---

# 49. QR Payment API Workflow

```text
Frontend
   │
   │ POST /payments/create
   ▼
Backend
   │
   │ Validate Student
   │ Validate Invoice
   │ Validate Amount
   ▼
Payment Provider API
   │
   │ Generate Dynamic QR
   ▼
Backend
   │
   │ Save Payment Reference
   ▼
Frontend
   │
   ▼
Display QR
```

Payment completion:

```text
Bank / Payment Provider
           │
           │ Payment Notification
           ▼
       Webhook API
           │
           ▼
Verify Digital Signature
           │
           ▼
Verify Transaction ID
           │
           ▼
Verify Amount
           │
           ▼
Verify Invoice Number
           │
           ▼
Update Payment SUCCESS
           │
           ▼
Update Invoice PAID
           │
           ▼
Generate Receipt
```

---

# 50. Dynamic QR Integration

The application should be designed so it can integrate with a bank, payment gateway, or approved payment service capable of generating amount-specific dynamic QR payments.

The provider integration layer should accept approximately:

```json
{
  "invoiceNumber": "INV-2026-00001234",
  "studentId": "STU000123",
  "amount": 6500.00,
  "currency": "LKR",
  "description": "May 2026 Class Fee"
}
```

Provider may return:

```json
{
  "paymentReference": "PAY9384734",
  "qrData": "...",
  "expiry": "2026-08-18T15:30:00",
  "status": "PENDING"
}
```

Actual request/response fields must follow the selected bank/payment provider's API specification.

---

# 51. Preventing Payment Manipulation

This is very important.

Suppose the invoice amount is:

`Rs. 6,500`

The frontend must not be allowed to submit:

`Rs. 100`

for the same invoice.

The backend should retrieve the actual invoice amount directly from the database.

Correct flow:

```text
Invoice ID
    ↓
Backend
    ↓
Database
    ↓
Get Actual Amount = Rs.6,500
    ↓
Send Rs.6,500 to Payment Provider
```

---

# 52. Duplicate Payment Protection

Before accepting payment confirmation, check:

```text
Invoice already paid?
```

If:

`YES`

the system must not create a second successful payment against the same liability without an approved business process.

A unique constraint/idempotency mechanism should also protect provider transaction IDs and callback retries.

---

# 53. Payment Reconciliation

The system should reconcile:

```text
Invoice Amount
      =
Payment Amount
      =
Provider Confirmed Amount
```

Example:

```text
Invoice:                Rs. 6,500
QR Payment:             Rs. 6,500
Confirmed Transaction:  Rs. 6,500

Result: MATCHED
```

If:

```text
Invoice:                Rs. 6,500
Confirmed Payment:      Rs. 5,500
```

the system must not automatically mark the invoice as fully paid.

Status:

**RECONCILIATION EXCEPTION**

for administrator review.

---

# 54. Email Notifications

Recommended emails:

### Registration

> Your student account has been successfully registered.

### Password Reset

> Click the secure link below to reset your password.

### Invoice

> Invoice INV-2026-00001234 has been generated.

### Payment Success

> Your payment of Rs. 6,500 has been successfully received.

Attach or link the receipt.

---

# 55. Main Website Pages

## Public Pages

```text
/
 /login
 /register
 /forgot-password
 /reset-password
 /contact
 /privacy-policy
 /terms
```

## Student Pages

```text
/student/dashboard
/student/payment
/student/invoices
/student/payments
/student/profile
```

## Admin Pages

```text
/admin
/admin/students
/admin/periods
/admin/sessions
/admin/subjects
/admin/fees
/admin/invoices
/admin/payments
/admin/reconciliation
/admin/reports
/admin/settings
/admin/audit
```

---

# 56. Recommended Technology Stack

## Frontend

**Next.js**

Benefits:

- Responsive web application.
- Good performance.
- Server-side functionality.
- SEO support for public pages.

## UI

- React
- Tailwind CSS

## Backend

Either:

- Next.js Server/API functionality

or a separate:

- Node.js backend

## Database

**PostgreSQL**

## Authentication

Secure session-based authentication or a reputable authentication framework.

## Email

Email service/provider API for:

- Verification
- Password reset
- Receipt notifications

## Payment

Selected bank/payment service Dynamic QR API.

## Hosting

Possible architecture:

```text
Browser
   ↓
HTTPS
   ↓
Next.js Application
   ↓
Backend/API
   ├──────── PostgreSQL
   ├──────── Email Service
   └──────── Payment Provider
```

---

# 57. Responsive Design

The website should work properly on:

- Mobile phones
- Tablets
- Laptops
- Desktop computers

Since students will frequently make payments using mobile banking/payment applications, the student payment experience must be designed mobile-first.

---

# 58. Mobile Payment Convenience

When a student opens the website on a mobile phone, downloading the QR is useful because scanning a QR displayed on the same phone may not always be convenient.

Recommended options:

```text
[ Download QR ]

[ Share QR ]

[ Save QR ]

[ Open supported payment method ]
```

The last option depends on capabilities provided by the selected payment provider.

---

# 59. Security Requirements

System should implement:

- HTTPS
- Secure password hashing
- CSRF protection where applicable
- Input validation
- SQL injection protection
- XSS protection
- Rate limiting
- Secure authentication cookies/tokens
- Password reset expiry
- Email verification
- Role-based access control
- Payment callback authentication
- Webhook signature verification
- Audit logging
- Session timeout
- Database backup
- Duplicate-payment protection
- Server-side amount validation
- Idempotency for payment requests

Sensitive credentials should be stored in environment variables or a secrets-management service.

---

# 60. Role-Based Access

Example:

```text
STUDENT
   ↓
Student Dashboard Only


ADMIN
   ↓
Administration Functions


FINANCE
   ↓
Payments
Invoices
Reconciliation
Reports
```

A Finance user role can be added if the organisation wants to separate administrative and financial access.

---

# 61. Invoice Number Generation

Recommended:

```text
INV-YYYY-########
```

Example:

`INV-2026-00001234`

---

# 62. Receipt Number Generation

Recommended:

```text
RCT-YYYY-########
```

Example:

`RCT-2026-00000985`

---

# 63. SID Format

If the institute generates student IDs:

```text
STU-YYYY-#####
```

Example:

`STU-2026-00125`

If SID already exists in another student-management process, this system should use the existing SID instead.

---

# 64. Payment Reference

Recommended internal reference:

```text
PAY-YYYYMMDD-########
```

Example:

`PAY-20260818-00001234`

Payment-provider transaction/reference numbers should be stored separately.

---

# 65. Full System Workflow

```text
                    ┌─────────────────┐
                    │     STUDENT     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    REGISTER     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │      LOGIN      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ SELECT MONTH /  │
                    │      YEAR       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ SELECT SESSION  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ SELECT SUBJECTS │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ CALCULATE TOTAL │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │GENERATE INVOICE │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   CLICK PAY     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ GENERATE DYNAMIC│
                    │       QR        │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ STUDENT PAYMENT │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ PAYMENT PROVIDER│
                    │  CONFIRMATION   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │VERIFY PAYMENT   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ INVOICE = PAID  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │GENERATE RECEIPT │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │EMAIL + DOWNLOAD │
                    └─────────────────┘
```

---

# 66. Suggested Student Dashboard UI

```text
┌───────────────────────────────────────────────┐
│                  CLASS PAY                    │
├───────────────────────────────────────────────┤
│ Welcome John Fernando             [Profile]   │
│ SID: STU000123                     [Logout]   │
├───────────────────────────────────────────────┤
│                                               │
│ Month / Year                                  │
│ [ May / 2026 ▼ ]                              │
│                                               │
│ Class Time                                    │
│ [ Day ▼ ]                                     │
│                                               │
│ Select Subjects                               │
│                                               │
│ ☑ Bio Science                 Rs. 2,500       │
│ ☑ Chemistry                   Rs. 2,000       │
│ ☐ Physics                     Rs. 2,000       │
│ ☐ Mathematics                 Rs. 2,500       │
│                                               │
│ --------------------------------------------- │
│ Total                          Rs. 4,500       │
│ --------------------------------------------- │
│                                               │
│             [ PROCEED TO PAYMENT ]            │
│                                               │
├───────────────────────────────────────────────┤
│ Payment History                               │
└───────────────────────────────────────────────┘
```

---

# 67. Recommended Additional Functions

Although not mandatory for the first release, the system should be designed to later support:

- SMS payment confirmation.
- WhatsApp confirmation.
- Student ID cards.
- Teacher management.
- Attendance.
- Exam marks.
- Class schedules.
- Multiple branches.
- Multiple teachers.
- Promotions/discounts.
- Scholarships.
- Late-payment charges.
- Parent login.
- Mobile application.
- Automated reminder notifications.

---

# 68. Development Phases

## Phase 1 – Core Student Management

Develop:

- Student registration
- Login
- Forgot password
- Student profile
- Admin student management

## Phase 2 – Class Management

Develop:

- Month/Year
- Session
- Subject
- Subject fee management

## Phase 3 – Invoice

Develop:

- Subject selection
- Amount calculation
- Invoice creation
- Duplicate payment validation

## Phase 4 – Payment

Develop:

- Payment API
- Dynamic QR
- QR download
- Payment status
- Webhook confirmation
- Reconciliation

## Phase 5 – Receipt & Reporting

Develop:

- Receipt PDF
- Student payment history
- Admin reports
- Excel exports
- Reconciliation report

## Phase 6 – Security & Production

Implement:

- Security review
- Audit logging
- Backup
- Monitoring
- Performance testing
- User Acceptance Testing
- Production deployment

---

# 69. Minimum Viable Product – MVP

The first production version should include:

1. Student registration.
2. Student login.
3. Forgot password through email.
4. Student profile.
5. Month/Year selection.
6. Day/Evening/Special selection.
7. Subject selection.
8. Subject fees.
9. Automatic cumulative calculation.
10. Invoice generation.
11. Dynamic QR generation.
12. QR download.
13. Payment confirmation.
14. Receipt generation.
15. Payment history.
16. Admin dashboard.
17. Student management.
18. Subject management.
19. Fee management.
20. Payment reports.
21. Reconciliation.
22. Audit logs.

---

# 70. Acceptance Criteria

The project can be considered ready for production when:

- [ ] Student can register successfully.
- [ ] Duplicate SID is prevented.
- [ ] Duplicate NIC is prevented.
- [ ] Student can log in securely.
- [ ] Forgot-password email works.
- [ ] Student can select Month/Year.
- [ ] Student can select Day/Evening/Special.
- [ ] Student can select multiple subjects.
- [ ] Correct subject fee is displayed.
- [ ] Cumulative amount updates correctly.
- [ ] Previously paid subjects cannot accidentally be paid twice.
- [ ] Invoice is generated with a unique number.
- [ ] Payment amount is calculated on the server.
- [ ] Dynamic QR contains the correct amount.
- [ ] Student can download QR.
- [ ] Expired QR can be regenerated safely.
- [ ] QR generation alone does not mark the invoice paid.
- [ ] Successful payment confirmation is received from the provider.
- [ ] Transaction reference is stored.
- [ ] Payment amount is reconciled with the invoice.
- [ ] Duplicate provider callbacks do not create duplicate payments.
- [ ] Invoice status changes to PAID only after validated confirmation.
- [ ] Receipt is automatically generated.
- [ ] Student can download the receipt.
- [ ] Student can view payment history.
- [ ] Admin can manage students.
- [ ] Admin can manage subjects.
- [ ] Admin can manage class sessions.
- [ ] Admin can manage monthly fees.
- [ ] Admin can see payment transactions.
- [ ] Admin can generate reports.
- [ ] All important changes are audit logged.

---

# 71. Recommended Final Architecture

```text
                  STUDENT / ADMIN
                        │
                        ▼
               ┌─────────────────┐
               │    WEB APP      │
               │ Next.js / React │
               └────────┬────────┘
                        │
                        ▼
               ┌─────────────────┐
               │ BACKEND / APIs  │
               └──────┬────┬─────┘
                      │    │
            ┌─────────┘    └────────────┐
            ▼                           ▼
     ┌───────────────┐          ┌───────────────┐
     │  PostgreSQL   │          │ Email Service │
     └───────────────┘          └───────────────┘
            │
            │
            ▼
     ┌──────────────────┐
     │ PAYMENT SERVICE  │
     │ Dynamic QR / API │
     └────────┬─────────┘
              │
              ▼
       Banking / Payment App
              │
              ▼
          PAYMENT
              │
              ▼
       Provider Callback
              │
              ▼
     Payment Verification
              │
              ▼
       Invoice = PAID
              │
              ▼
          RECEIPT
```

# 72. Final Recommended Payment Experience

The best student journey should be:

**Register → Login → Select May/2026 → Select Day/Evening/Special → Select Subjects → View Individual Fees → View Cumulative Total → Review Invoice → Click Pay → Dynamic QR Generated for Exact Amount → Download/Scan QR → Make Payment → Automatic Payment Confirmation → Receipt Generated → Download Receipt.**

This keeps the payment process simple for the student while giving the institute proper payment control, automatic reconciliation, transaction history, and reporting.
