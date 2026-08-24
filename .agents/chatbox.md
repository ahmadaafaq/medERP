# Department & Batch-Wise Chat Groups — Implementation Plan

Hand this to a developer or an AI coding assistant. Pairs with
`chat-workspace.jsx` (a portable, drop-in UI reference implementation) and
reuses the brand tokens and auto-reflect pattern from
`medical-erp-design-system.md` and `role-based-dashboard-architecture.md`.

---

## 1. Goal

> A Faculty member picks a **batch** under their department (e.g. "2025 Batch")
> from a left sidebar and sends a message — text, emoji, or a file attachment
> (PDF/DOC/PPT/Image) — to the entire student group for that batch. Every
> targeted student gets a dashboard notification + popup the moment it's sent;
> clicking it opens the chat directly. Students see their own left sidebar of
> department conversations they belong to and can reply the same way. Faculty
> receives replies back in the same batch group thread.

This is a **group chat**, not 1:1 messaging — one thread per
`department + batch`, with faculty and all students of that batch as members.

---

## 2. Roles & Scope

| Role | Sidebar shows | Can send to | Can receive from |
|---|---|---|---|
| Faculty | Batches under their own department (2025 / 2024 / 2023 …) | The batch group they select | Replies from students in that batch |
| Student | Department/batch group(s) they belong to | Their own batch group (replies) | Faculty messages targeted at their batch |
| Clerk / Admin (optional, phase 2) | Read-only oversight view | — | Everything, for moderation |

A student typically belongs to exactly one `department + batch` group, but the
sidebar should support more than one in case a student is in a cross-department
elective group later — don't hardcode "exactly one."

---

## 3. Data Model

```
chat_groups
  id
  department_id
  department_name
  batch_year          -- "2025", "2024", "2023"
  created_at

chat_group_members
  id
  chat_group_id
  user_id
  role                 -- FACULTY | STUDENT
  joined_at

chat_messages
  id
  chat_group_id
  sender_id
  sender_role
  body                 -- nullable if attachment-only
  created_at

chat_attachments
  id
  message_id
  file_name
  file_type             -- pdf | doc | ppt | image
  file_url
  file_size_kb

chat_read_state
  id
  chat_group_id
  user_id
  last_read_message_id
  updated_at
```

- A student's membership in `chat_group_members` is what determines which
  groups appear in their sidebar — **not** a client-side filter. Membership is
  set when the student is enrolled into a department + batch (reuse the same
  admission data already in the system).
- Group creation can be automatic: when the first student is enrolled into a
  `department + batch` combination that doesn't have a group yet, create one.

---

## 4. UI Layout

```
┌───────────────┬─────────────────────────────────────────┐
│  Left Sidebar  │  Chat Window                              │
│                │  ┌─────────────────────────────────────┐ │
│  FACULTY VIEW   │  │ Header: "2025 Batch · CSE"           │ │
│  ├─ 2025 Batch  │  ├─────────────────────────────────────┤ │
│  ├─ 2024 Batch  │  │ Message bubbles (own vs. others)      │ │
│  └─ 2023 Batch  │  │ Attachment bubbles (file icon + name)  │ │
│                │  ├─────────────────────────────────────┤ │
│  STUDENT VIEW   │  │ Composer: [emoji] [attach] [text] [send]│ │
│  ├─ CSE Dept    │  └─────────────────────────────────────┘ │
│  └─ (their batch)│                                           │
└───────────────┴─────────────────────────────────────────┘
```

- Sidebar item shows: name/label, last message preview, timestamp, **unread
  badge** (count or dot) if there are unread messages.
- Selecting a sidebar item opens that group's thread and marks it read (same
  "mark read on open, not on hover" rule as the Notices module).
- Composer: emoji picker button, attachment button (accepts
  `.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png`), text input, send button.
  Attachment preview chip appears above the composer before sending, removable
  before send.

---

## 5. Notifications (reuses the Notices module pattern)

| Trigger | Behavior |
|---|---|
| Faculty sends a message | All online students in that batch get a toast/popup notification within seconds (WebSocket/SSE), plus an unread badge on their dashboard bell and on the relevant sidebar chat item |
| Student is offline | On next login, unread messages show the same way — badge + dashboard notification list entry, no popup interruption on login itself (chat messages are `Normal` priority by default, unlike Urgent notices) |
| Clicking the notification/toast | Navigates directly into the chat workspace with that specific group thread already open |
| Student sends a reply | Faculty gets the same treatment — badge + notification — since this is bidirectional |

Reuse the exact cache-invalidation / WebSocket event pattern already defined:

```ts
// On send
await sendChatMessage(groupId, payload);
queryClient.invalidateQueries(["chat", "groups", userId]);
// Emits "chat:message:new" over WebSocket to all group members currently online
```

---

## 6. API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/chat/groups` | GET | List groups the logged-in user belongs to (role-scoped) |
| `/api/chat/groups/:id/messages` | GET | Paginated message history for a group |
| `/api/chat/groups/:id/messages` | POST | Send a message (text and/or attachment) |
| `/api/chat/groups/:id/read` | PATCH | Mark group as read up to the latest message |
| `/api/chat/attachments/upload` | POST | Upload a file, returns URL for use in the send payload |
| `/api/chat/unread-count` | GET | Badge count across all groups, for header bell |
| `/api/chat/groups/:id/members` | GET | (Faculty/Admin) view group roster |

Authorization: a user can only GET/POST against a `chat_group_id` they're a
member of — enforced server-side via `chat_group_members`, never inferred from
the frontend's currently-selected sidebar item.

---

## 7. File Handling

- Same rules as the Notices module: validate MIME type server-side, not just
  extension; max file size (e.g. 10 MB per attachment); store in object
  storage, keep only the URL + metadata in `chat_attachments`.
- Render file-type icons in the bubble: PDF (`FileText`), Word (`FileType`),
  PowerPoint (`Presentation`), Image (`Image`, with an inline thumbnail).
- Images can render as an inline preview thumbnail in the chat; other file
  types render as a download chip (icon + filename + size + download button).

---

## 8. Non-Negotiables (carried over from the rest of the system)

- No fabricated messages, member counts, or read receipts — real data only,
  loading/empty states otherwise.
- Reuse the existing brand tokens, `Button`, `FloatingInput` patterns — don't
  introduce a new visual language for chat.
- Backend enforces group membership on every read/write — sidebar visibility is
  a UX convenience, not the access boundary.
- Batch/department group membership must come from actual enrollment data
  (admissions/course-branch assignment), never manually re-entered.

---

## 9. Making the UI Portable (copy into another project easily)

The reference component (`chat-workspace.jsx`) is built to be dropped into any
React/Next.js project with minimal friction:

- **Single file, no exotic imports** — only `react` and `lucide-react`
  (already a dependency in the ERP kit). No chat-specific npm package required.
- **Brand tokens isolated in one `T` object at the top** — change five hex
  values to re-skin it for a different product.
- **No backend calls baked in** — the component holds local state and exposes
  clearly-marked seams (`// TODO: replace with real API call`) for `sendMessage`,
  `fetchGroups`, `fetchMessages`, and `markRead`. Wire these to the endpoints in
  §6 and it's production-ready.
- **Role passed as a prop** (`role="FACULTY" | "STUDENT"`) rather than
  hardcoded — the same component serves both sidebars by switching the data
  source, exactly as the role-based dashboard doc specifies.
- **No CSS files** — Tailwind utility classes only, so there's nothing extra to
  import besides Tailwind itself (already required by the rest of the kit).

To reuse elsewhere: copy the file, replace the `DEMO_GROUPS`/`DEMO_MESSAGES`
seed data with real fetch calls at the marked seams, and pass in the real
logged-in user's `role` and `id`.

---

## 10. Suggested File Structure

```
components/
  chat/
    ChatWorkspace.tsx        // top-level, role-aware container
    ChatSidebar.tsx            // batch list (faculty) / department list (student)
    ChatThread.tsx              // message list + bubbles
    ChatComposer.tsx             // text + emoji + attachment
    EmojiPicker.tsx
    AttachmentChip.tsx
hooks/
  useChatGroups.ts
  useChatMessages.ts
  useChatSocket.ts             // WebSocket/SSE subscription for live messages
app/
  (dashboard)/chat/page.tsx     // shared route, renders ChatWorkspace with role from session
```

---

## 11. Not Yet Specified (flag for follow-up)

- Message editing/deletion policy (can faculty delete a sent message for
  everyone?).
- Read-receipt visibility for students (do they see "seen by 40/45 students"?).
- Moderation: can Admin/Clerk view or intervene in a batch group?
- Message retention/archival policy once a batch graduates.