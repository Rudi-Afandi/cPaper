# Notes App Implementation Plan

## Overview
- **Stack:** React + HeroUI + PocketBase
- **Goal:** Notes app dengan folder support, accessible via web + AI Agent (Hermes)
- **Ports:** PocketBase (8090), Frontend (8091)

---

## Phase 1: PocketBase Setup ✅

### Admin UI: http://127.0.0.1:8090/_/

- [ ] Buat admin account (jika belum)
- [ ] Buat `folders` collection
  - Fields: `name` (text, required), `owner` (relation to users)
  - Rules: `owner = @request.auth.id`
- [ ] Buat `notes` collection
  - Fields: `title` (text), `content` (text, long), `folder` (relation, optional), `owner` (relation)
  - Rules: `owner = @request.auth.id`
- [ ] Buat user untuk frontend login
- [ ] Buat agent user untuk Hermes: `agent@notes.local`

---

## Phase 2: Frontend Setup ✅

### Install Dependencies
```bash
npm install pocketbase react-markdown
```

### Files Structure
```
src/
├── lib/
│   └── pocketbase.js          # PocketBase client instance
├── context/
│   └── AuthContext.jsx         # Auth state management
├── components/
│   ├── Sidebar.jsx             # Folder list + create folder
│   ├── NoteList.jsx            # Notes list in folder
│   └── NoteEditor.jsx          # Markdown editor
├── pages/
│   ├── Login.jsx               # Login page
│   └── Dashboard.jsx           # Main app layout
└── App.jsx                     # Router + providers
```

### API Endpoints (PocketBase)
```
POST   /api/collections/users/auth-with-password    # Login
GET    /api/collections/notes/records                # List notes
POST   /api/collections/notes/records                # Create note
PATCH  /api/collections/notes/records/:id            # Update note
DELETE /api/collections/notes/records/:id            # Delete note
GET    /api/collections/folders/records             # List folders
POST   /api/collections/folders/records             # Create folder
PATCH  /api/collections/folders/records/:id          # Update folder
DELETE /api/collections/folders/records/:id          # Delete folder
```

### Frontend Checklist
- [x] Setup PocketBase client
- [x] Create AuthContext for login/logout state
- [x] Create Login page with HeroUI form
- [x] Create Dashboard layout (sidebar + main)
- [x] Implement folder CRUD in Sidebar
- [x] Implement note CRUD with markdown preview
- [x] Add logout functionality

---

## Phase 3: Hermes Agent Integration

### Agent Credentials
```
PocketBase URL: http://127.0.0.1:8090
Agent Email: agent@notes.local
Agent Password: [SET_PASSWORD]
```

### Auth Flow (Hermes must do first)
```bash
# 1. Login to get token
curl -X POST http://127.0.0.1:8090/api/collections/users/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{"identity":"agent@notes.local","password":"[PASSWORD]"}'

# Response: { "token": "...", "user": {...} }
# Use token in Authorization header for subsequent calls
```

### Hermes CRUD Commands

#### List All Notes
```bash
curl http://127.0.0.1:8090/api/collections/notes/records \
  -H "Authorization: [TOKEN]"
```

#### Get Single Note
```bash
curl http://127.0.0.1:8090/api/collections/notes/records/:id \
  -H "Authorization: [TOKEN]"
```

#### Create Note
```bash
curl -X POST http://127.0.0.1:8090/api/collections/notes/records \
  -H "Authorization: [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"title":"Note Title","content":"Note content in markdown"}'
```

#### Create Note in Folder
```bash
curl -X POST http://127.0.0.1:8090/api/collections/notes/records \
  -H "Authorization: [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"title":"Work Note","content":"# Work\n\nTask list here","folder":"[FOLDER_ID]"}'
```

#### Update Note
```bash
curl -X PATCH http://127.0.0.1:8090/api/collections/notes/records/:id \
  -H "Authorization: [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","content":"Updated content"}'
```

#### Delete Note
```bash
curl -X DELETE http://127.0.0.1:8090/api/collections/notes/records/:id \
  -H "Authorization: [TOKEN]"
```

#### List Folders
```bash
curl http://127.0.0.1:8090/api/collections/folders/records \
  -H "Authorization: [TOKEN]"
```

#### Create Folder
```bash
curl -X POST http://127.0.0.1:8090/api/collections/folders/records \
  -H "Authorization: [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"name":"Work"}'
```

#### Delete Folder
```bash
curl -X DELETE http://127.0.0.1:8090/api/collections/folders/records/:id \
  -H "Authorization: [TOKEN]"
```

---

## Phase 4: External Access (Optional)

### Tunneling (for external access)
```bash
# ngrok
ngrok http 8090

# cloudflare tunnel
cloudflared tunnel --url http://localhost:8090
```

### Deployment Options
- Railway (railway.app)
- Render (render.com)
- VPS (DigitalOcean, Linode, etc.)

---

## Notes

- **Frontend user:** untuk login via web UI
- **Agent user:** untuk Hermes AI access via REST API
- **Token expires:** PocketBase tokens need refresh/re-auth periodically
- **Folder nesting:** 1 level only (no sub-folders)
- **Content:** Markdown format supported

---

## Design System (ZED IDE Inspired) ✅

### Theme Overview
- **Color Palette:** Dark theme inspired by ZED IDE
- **Typography:** Monospace font throughout (SF Mono, Monaco, Cascadia Code)
- **Layout:** Clean, minimal, efficient space utilization
- **Components:** Custom-styled with ZED-like appearance

### Color Scheme
```css
--zed-bg: #0d1117              /* Main background */
--zed-bg-secondary: #161b22    /* Panel backgrounds */
--zed-border: #30363d          /* Borders */
--zed-text-primary: #c9d1d9    /* Main text */
--zed-text-secondary: #8b949e  /* Secondary text */
--zed-accent: #58a6ff          /* Blue accent */
--zed-success: #3fb950         /* Green success */
--zed-danger: #f85149         /* Red danger */
--zed-hover: #26292f          /* Hover states */
--zed-focus: #1f6feb           /* Focus indicators */
```

### Component Updates
- **Sidebar:** ZED-style folder list with custom list items
- **Notes List:** Compact, efficient note display with metadata
- **Editor:** Full-featured markdown editor with monospace font
- **Toolbar:** Clean button group for edit/preview/save actions
- **Status Bar:** ZED-inspired status bar with user and file info

### Key Features
- **Monospace font** throughout for consistency
- **Custom scrollbar** styling for ZED-like appearance
- **Efficient layout** maximizing content space
- **Keyboard-first** workflow support
- **Dark theme** optimized for long sessions

### Implementation Files
- `src/index.css` - Complete ZED theme CSS with custom properties
- `ZED_IDE_DESIGN.md` - Comprehensive design documentation

### Design Benefits
- **Reduced eye strain** with dark theme
- **Improved readability** with monospace fonts
- **Better focus** on content and functionality
- **Professional appearance** inspired by modern IDEs
- **Consistent experience** across all components
