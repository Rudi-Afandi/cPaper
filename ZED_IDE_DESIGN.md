# ZED IDE Design Documentation

## Overview

This document outlines the redesign of the Notes App with inspiration from ZED IDE's clean, minimal, and developer-friendly aesthetic. The new design emphasizes readability, efficient use of space, and a modern dark theme.

## Design Principles

### 1. Minimalism
- Clean, uncluttered interfaces
- Remove unnecessary visual elements
- Focus on content and functionality
- Efficient use of screen space

### 2. Developer Experience
- Monospace font throughout
- Keyboard-first workflow
- Clear visual hierarchy
- Consistent spacing and alignment

### 3. Dark Theme
- Easy on the eyes
- Reduces eye strain during long sessions
- Modern, professional appearance
- Consistent with ZED IDE's aesthetic

## Color Scheme

### Primary Colors
```css
:root {
  --zed-bg: #0d1117;           /* Main background */
  --zed-bg-secondary: #161b22;   /* Panels/sidebar background */
  --zed-border: #30363d;       /* Border color */
  --zed-text-primary: #c9d1d9;  /* Main text */
  --zed-text-secondary: #8b949e; /* Secondary text */
  --zed-accent: #58a6ff;        /* Primary accent (blue) */
  --zed-success: #3fb950;       /* Success color (green) */
  --zed-danger: #f85149;       /* Danger color (red) */
  --zed-hover: #26292f;         /* Hover background */
  --zed-focus: #1f6feb;        /* Focus border color */
}
```

### Color Usage
- **Background**: Deep dark gray for reduced eye strain
- **Panels**: Slightly lighter dark for visual separation
- **Text**: High contrast for readability
- **Accent**: Blue for interactive elements and selections
- **Borders**: Subtle gray for visual separation
- **Hover**: Darker gray for interactive feedback

## Typography

### Font Stack
```css
font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
```

### Font Sizes
- **Headers**: 13px (600 weight)
- **Body**: 13px (400 weight) 
- **Small text**: 12px (400 weight)
- **Input placeholders**: 13px (400 weight)

### Line Height
- **Editor**: 1.5 for comfortable reading
- **General content**: 1.5 for consistency

## Component Layout

### 1. Main Layout
```
+---------------------+---------------------+---------------------+
| Navbar              | Sidebar (Folders)   | Notes List          |
| (60px height)       | (256px width)      | (192px width)       |
| User info & Logout  | Folders tree        | Notes list          |
+---------------------+---------------------+---------------------+
|                     |                     |                     |
| Editor Toolbar      |                     |                     |
| (Auto height)       |                     |                     |
|---------------------+---------------------+---------------------+
| Editor/Preview Area|                     |                     |
| (Flex 1)           |                     |                     |
|                     |                     |                     |
+---------------------+---------------------+---------------------+
| Status Bar         |                     |                     |
| (24px height)      |                     |                     |
| User & file info   |                     |                     |
+---------------------+---------------------+---------------------+
```

### 2. Sidebar Layout
```
+---------------------+
| Folders            |
| +-----------------+ |
| | All Notes      | |
| +-----------------+ |
| | +-------------+ | |
| | | Work        | | |
| | +-------------+ | |
| | | Projects    | | |
| | +-------------+ | |
| +-----------------+ |
| + New Folder       |
+---------------------+
```

### 3. Editor Layout
```
+---------------------------------------------------------------------+
| [Title Input]        [Edit] [Preview] [Save] [Clear]                |
+---------------------------------------------------------------------+
|                                                                     |
| [Editor Area - Markdown]                                           |
|                                                                     |
| # My Note                                                           |
|                                                                     |
| This is my note content written in Markdown format.                 |
|                                                                     |
| - Lists work                                                        |
| - **Bold** and *italic* too                                        |
|                                                                     |
| ```                                                                 |
| code blocks too                                                     |
| ```                                                                 |
|                                                                     |
+---------------------------------------------------------------------+
```

## Component Specifications

### 1. Buttons
```css
.zed-button {
  background: transparent;
  border: 1px solid var(--zed-border);
  color: var(--zed-text-primary);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.zed-button:hover {
  background: var(--zed-hover);
  border-color: var(--zed-accent);
}

.zed-button.primary {
  background: var(--zed-accent);
  border-color: var(--zed-accent);
  color: white;
}
```

### 2. Inputs
```css
.zed-input {
  background: var(--zed-bg-secondary);
  border: 1px solid var(--zed-border);
  color: var(--zed-text-primary);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
}

.zed-input:focus {
  outline: none;
  border-color: var(--zed-focus);
  box-shadow: 0 0 0 1px var(--zed-focus);
}
```

### 3. List Items
```css
.zed-list-item {
  background: var(--zed-bg-secondary);
  border: 1px solid var(--zed-border);
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.zed-list-item:hover {
  background: var(--zed-hover);
  border-color: var(--zed-accent);
}

.zed-list-item.selected {
  background: rgba(88, 166, 255, 0.1);
  border-color: var(--zed-accent);
}
```

### 4. Editor
```css
.zed-editor {
  background: var(--zed-bg-secondary);
  border: 1px solid var(--zed-border);
  border-radius: 6px;
  padding: 16px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  min-height: 400px;
  color: var(--zed-text-primary);
}

.zed-editor:focus {
  outline: none;
  border-color: var(--zed-focus);
  box-shadow: 0 0 0 1px var(--zed-focus);
}
```

### 5. Status Bar
```css
.zed-status-bar {
  background: var(--zed-bg-secondary);
  border-top: 1px solid var(--zed-border);
  padding: 4px 16px;
  font-size: 12px;
  color: var(--zed-text-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

## Implementation Details

### 1. CSS Structure
- Custom CSS variables for consistent theming
- Monospace font throughout the application
- Custom scrollbar styling for ZED-like appearance
- Utility classes for quick styling

### 2. Component Classes
- All components use prefixed classes (`zed-`)
- Consistent spacing and sizing
- Responsive design considerations
- Focus states and hover effects

### 3. Styling Approach
- Minimal use of HeroUI components where possible
- Custom styling for better ZED-like appearance
- Consistent border radius (6px)
- Consistent padding and spacing

## Accessibility

### 1. Color Contrast
- High contrast between text and background
- Clear visual distinction between states
- Proper contrast ratios for readability

### 2. Focus Management
- Visible focus indicators
- Keyboard navigation support
- Logical tab order

### 3. Screen Reader Support
- Semantic HTML structure
- Proper ARIA labels where needed
- Accessible form controls

## Performance Considerations

### 1. CSS Optimization
- Minimal CSS rules
- Efficient selectors
- No expensive animations

### 2. Component Performance
- Minimal re-renders
- Efficient state management
- Lazy loading where appropriate

## Testing

### 1. Visual Testing
- Verify color scheme consistency
- Check spacing and alignment
- Test responsive behavior

### 2. Interaction Testing
- Button hover and focus states
- Input validation and feedback
- List item selection behavior

### 3. Cross-browser Testing
- Chrome, Firefox, Safari support
- Consistent font rendering
- CSS variable support

## Future Enhancements

### 1. Additional Themes
- Light theme option
- High contrast theme
- Custom theme support

### 2. Advanced Features
- Custom CSS variables
- Theme switching
- User preferences

### 3. Performance Optimizations
- CSS-in-JS consideration
- Component-level CSS modules
- Better caching strategies

---

This design documentation provides a comprehensive guide for implementing ZED IDE-inspired design in the Notes App. The focus is on creating a clean, minimal, and developer-friendly interface that enhances productivity and reduces eye strain.