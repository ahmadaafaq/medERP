## CRITICAL DATA PROTECTION POLICY (HIGHEST PRIORITY)

This application is a production system.

The AI MUST NEVER create, insert, update, delete, seed, import, or synchronize any business or academic data into PostgreSQL or any database without explicit user action through the application's UI or an authorized backend API request.

STRICT RULES

1. AI IS READ-ONLY BY DEFAULT.

2. NEVER save any AI-generated content to PostgreSQL.

3. NEVER automatically insert records obtained from:
   - AI responses
   - Internet
   - LLM
   - Generated examples
   - Sample datasets
   - Mock data
   - Dummy records
   - Seed data
   - Scraped content

4. Database writes are allowed ONLY when:
   - The user explicitly submits a form through the frontend.
   - The frontend calls an authenticated backend API.
   - The backend validates the request.
   - The backend successfully performs Create/Update/Delete operations.

5. AI suggestions must remain temporary and exist only in memory until the user explicitly confirms saving through the application interface.

6. Never bypass the UI.

7. Never call INSERT, UPDATE, DELETE, UPSERT, MERGE, or BULK INSERT automatically.

8. Never execute SQL that modifies data unless explicitly instructed by the developer and initiated through approved application workflows.

9. Never create automatic background jobs that populate the database.

10. Never synchronize AI-generated content into PostgreSQL.

PROTECTED MODULES

The AI must NEVER automatically create or save records for:

- Universities
- Colleges
- Courses
- Programs
- Subjects
- Topics
- Competencies
- Chapters
- Learning Objectives
- Faculty
- Staff
- Students
- Parents
- Departments
- Branches
- Batches
- Academic Sessions
- Timetables
- Attendance
- Results
- Marks
- Internal Assessment
- Practical Marks
- Questions
- Question Banks
- MCQs
- Descriptive Questions
- Exams
- Notices
- Events
- Fees
- Payments
- Hostel
- Library
- Inventory
- Users
- Roles
- Permissions
- Any Master Data

FRONTEND RULES

The frontend may:
- Display AI-generated suggestions.
- Preview AI-generated content.
- Allow users to edit AI-generated content.
- Allow users to discard AI-generated content.

The frontend MUST NOT:
- Automatically save AI-generated content.
- Automatically call Create APIs.
- Automatically trigger Save operations.
- Automatically submit forms.

BACKEND RULES

The backend MUST:
- Accept only authenticated API requests.
- Validate every request.
- Reject AI-initiated database writes.
- Reject automatic persistence.
- Save only data explicitly submitted by the user.
- Log all Create/Update/Delete operations.

AI RESPONSE POLICY

Whenever generating content:

"This content is a temporary AI suggestion only.
It must NOT be stored in PostgreSQL.
It may only be saved if the user explicitly confirms through the application interface."

NO ASSUMPTIONS

If saving is required, always ask:

"Do you want to save this through the application?"

Never assume "Yes."

DEFAULT STATE

Read Only = TRUE
Auto Save = FALSE
Auto