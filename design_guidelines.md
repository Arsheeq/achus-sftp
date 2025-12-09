# EnlitEDU SFTP - Design Guidelines

## Design Approach

**Selected Approach:** Design System - Material Design 3 principles adapted for file management
**Justification:** This is a utility-focused application where efficiency, clarity, and reliability are paramount. The interface prioritizes quick file operations, clear status indicators, and intuitive navigation over visual flourish.

**Core Design Principles:**
1. **Clarity First:** Every action and status must be immediately understandable
2. **Efficiency:** Minimize clicks and cognitive load for frequent operations
3. **Trust:** Professional appearance that instills confidence in file handling
4. **Consistency:** Predictable patterns throughout the application

---

## Typography

### Font System
- **Primary Font:** Inter (via Google Fonts CDN)
- **Monospace Font:** "SF Mono", Menlo, Consolas (for file names, sizes, metadata)

### Type Scale
- **Hero Heading (Auth screens):** 3xl (30px), font-bold
- **Page Title:** 2xl (24px), font-semibold
- **Section Headers:** xl (20px), font-semibold
- **Card Titles:** base (16px), font-medium
- **Body Text:** sm (14px), font-normal
- **Metadata/Labels:** xs (12px), font-normal
- **File Details:** xs (12px), font-mono for paths and sizes

---

## Layout System

### Spacing Primitives
Use Tailwind units: **2, 4, 6, 8, 12, 16, 20, 24**
- Component padding: `p-4`, `p-6`, `p-8`
- Section spacing: `space-y-6`, `space-y-8`
- Grid gaps: `gap-4`, `gap-6`
- Tight spacing (badges, pills): `px-2 py-1`

### Grid Structure
- **Container Max Width:** `max-w-7xl mx-auto`
- **Content Padding:** `px-4 sm:px-6 lg:px-8`
- **File Grid:** 
  - Mobile: 2 columns (`grid-cols-2`)
  - Tablet: 3-4 columns (`sm:grid-cols-3 md:grid-cols-4`)
  - Desktop: 5-6 columns (`lg:grid-cols-5 xl:grid-cols-6`)
- **List View:** Single column with full-width rows

### Page Structure
1. **Header Bar** (sticky top): Logo, navigation, user menu, actions
2. **Upload Zone** (prominent): Drag-drop area with clear visual hierarchy
3. **Toolbar** (sticky): Search, filters, view toggles, bulk actions
4. **Content Area**: File grid/list with infinite scroll or pagination
5. **Dialogs/Modals**: Centered overlays for operations (copy, delete, share)

---

## Component Library

### Navigation & Header
**Top Navigation Bar:**
- Height: `h-16` (64px)
- Background: Card background with subtle border-bottom
- Logo: Left-aligned, `h-8` (32px height)
- User Menu: Right-aligned with avatar, dropdown
- Action Buttons: Primary actions (New Folder, Upload) in header

**Sidebar (Optional for folder navigation):**
- Width: `w-64` (256px) on desktop, collapsible on mobile
- Tree structure for folder hierarchy
- Quick access sections (Recent, Shared, Trash)

### Upload Zone
**Drag-and-Drop Area:**
- Large target: `min-h-48` (192px) when empty
- Dashed border: `border-2 border-dashed`
- Centered content with icon and instructions
- Active state: Highlight with primary color overlay
- Upload progress: Linear progress bars with file names

### File Display

**Grid View Cards:**
- Aspect ratio: Square or 4:3 for file previews
- Padding: `p-4`
- Border radius: `rounded-lg`
- Shadow: `shadow-sm` on hover `shadow-md`
- File icon: Large centered icon (48px) with type color coding
- File name: Truncated with ellipsis, tooltip on hover
- Metadata: Size and date below name, `text-xs text-muted-foreground`
- Actions: Kebab menu (three dots) top-right corner

**List View Rows:**
- Height: `h-16` (64px)
- Hover background: Subtle elevation
- Structure: Icon | Name | Size | Modified | Actions
- Checkbox: Left-most for bulk selection
- Name column: Flex-1 with truncation
- Metadata columns: Fixed width

### File Type Icons
Use Lucide React icons with color coding:
- Documents: `FileText` - Blue
- Images: `Image` - Green
- Videos: `Video` - Purple
- Audio: `Music` - Orange
- Archives: `Archive` - Gray
- Folders: `Folder` - Yellow

### Buttons & Actions

**Primary Actions:**
- Size: `h-10 px-4` (40px height)
- Prominent positioning in header/toolbar
- Icons with text labels on desktop, icon-only on mobile

**Secondary Actions:**
- Icon buttons: `h-8 w-8` (32px square)
- Outline variant
- Tooltips on hover

**Contextual Actions:**
- Dropdown menus from kebab icon
- List items with icons and clear labels
- Destructive actions (delete) separated with divider

### Dialogs & Modals

**Structure:**
- Max width: `max-w-md` for simple dialogs, `max-w-2xl` for complex
- Padding: `p-6`
- Header: Title with close button
- Content: Form fields or information
- Footer: Cancel and confirm buttons (right-aligned)

**Types:**
- **Delete Confirmation:** Warning icon, clear consequences, two-button choice
- **Copy/Move:** Input for destination, folder tree picker
- **Share Link:** URL display with copy button, expiration settings
- **Folder Creation:** Simple name input with validation

### Forms & Inputs

**Text Inputs:**
- Height: `h-10` (40px)
- Padding: `px-3`
- Border radius: `rounded-md`
- Focus ring: Primary color

**Search Bar:**
- Icon: Magnifying glass left-aligned
- Placeholder: "Search files and folders..."
- Clear button when text present
- Width: `max-w-md` in toolbar

**Dropdowns:**
- Trigger: Button with chevron icon
- Menu: Card-styled with shadow-lg
- Options: Hover highlighting, keyboard navigation

### Status & Feedback

**Upload Progress:**
- Fixed bottom-right toast container
- Individual file cards with progress bars
- Success/error states with icons
- Auto-dismiss on completion (3s delay)

**Toast Notifications:**
- Position: Top-right corner
- Types: Success (green), Error (red), Info (blue)
- Duration: 3-5 seconds auto-dismiss
- Icon + message + optional action button

**Empty States:**
- Large icon (96px)
- Heading and description
- Call-to-action button
- Different states: No files, no search results, error state

**Loading States:**
- Skeleton screens for file grids
- Spinner for actions in progress
- Disabled states for buttons during operations

### Authentication Screens

**Login/Register Pages:**
- Centered card on plain background
- Logo at top
- Form fields with clear labels
- Primary CTA button
- Social login options (Google, GitHub)
- Links for password reset, sign up toggle

**Layout:**
- Two-column on desktop: Form (left 40%) | Brand visual (right 60%)
- Single column on mobile: Form only
- Form card: `max-w-md` centered, `p-8`

---

## Animations

**Use Sparingly - Functional Only:**
- **Hover States:** Subtle elevation change (shadow increase)
- **Clicks:** Quick scale down (0.98) on active state
- **Transitions:** 150ms ease for color/shadow changes
- **Upload Progress:** Smooth bar animation
- **Skeleton Loading:** Subtle pulse effect
- **No decorative animations** - this is a productivity tool

---

## Responsive Behavior

**Breakpoints:**
- Mobile: Base (< 640px)
- Tablet: sm (640px+)
- Desktop: lg (1024px+)
- Wide: xl (1280px+)

**Mobile Adaptations:**
- Collapse sidebar to hamburger menu
- Stack toolbar items vertically
- Reduce grid columns to 2
- Icon-only buttons where appropriate
- Bottom navigation for primary actions

---

## Images

**Logo Usage:**
- Header logo: Full color EnlitEDU logo, height 32px
- Auth pages: Larger logo (64px) at top of form
- Favicon: Icon-only version

**Illustrations:**
- Empty state illustrations: Simple, flat-style illustrations for "no files" states
- Error states: Friendly illustrations for 404, server errors
- Style: Match brand colors (blue/gold from logo)

**No Hero Images:** This is a utility application - focus on functionality, not marketing visuals.

---

## Accessibility

- All interactive elements: Focus rings with primary color
- Icon buttons: aria-labels and tooltips
- Form inputs: Proper labels and error messages
- Keyboard navigation: Full support for all actions
- Color contrast: WCAG AA minimum for all text
- Screen reader: Semantic HTML with appropriate ARIA attributes