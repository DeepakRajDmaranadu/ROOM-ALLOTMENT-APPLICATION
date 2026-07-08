# Room Allotment System (Clone)

A professional, high-fidelity, fully functioning clone of the Room Allotment seating system. This application manages student seat allocations for examinations in different rooms, displays them in a dynamic grid layout grouped by course, and features custom tools for inline management and Excel reporting.

Live Target Reference: [https://rrexamv2.netlify.app](https://rrexamv2.netlify.app)

---

## Key Features

1. **Local Storage Persistence**:
   Automatically saves, updates, and restores seating states using the browser's `localStorage` key `roomEntries`.

2. **Smart Forms & Filters**:
   - Validation filtering on forms inputs ensuring only valid text blocks are input for Rooms, Times, Courses, Subjects, and Student IDs.
   - **Auto-Increment**: Suggests and fills the next incremented Student ID based on numerical trailing patterns (e.g. `CSE001` auto-increments to `CSE002` on submit).
   - **Keyboard Shortcuts**: Use `Arrow Up` and `Arrow Down` inside the Student ID field to increment/decrement numbers, and hit `Enter` to submit.

3. **Spreadsheet-style Management Grid**:
   - Seating layout chunks students into easy-to-read grids of 10 seats per column.
   - Inline action controls (using vector SVG icons) allow you to:
     - **Edit**: Toggle edit state and rewrite student IDs.
     - **Save**: Confirm changes directly in-grid.
     - **Delete**: Wipes the specific student entry.
     - **Insert (+)**: Instantly inserts a blank seat right below the selected row for flexible additions.

4. **Smooth Scroll & Focus Preservation**:
   - Preserves horizontal scroll positions of course grids and page vertical scroll positions on re-renders, preventing viewport jumps.
   - Automatically focuses and scrolls new student additions or empty seat insertions into view.

5. **Advanced Excel Exports**:
   - **Download Excel Plan**: Generates a structured multi-column workbook mapping Rooms, Courses, Subjects, and counts. Features border outlines, font scales, merged headers, and grid blocks.
   - **Download Register List**: Generates a single-column, cleanly styled workbook containing only active student register IDs.

---

## Tech Stack

- **HTML5**: Semantic tags for UI structure.
- **CSS3 (Vanilla)**: Responsive grid layouts, HSL token systems, glassmorphism blur effects, custom scrollbars, and keyframes.
- **JavaScript (ES6+)**: Custom reactive state rendering logic and DOM manipulation.
- **ExcelJS & FileSaver.js (via CDN)**: Compiles and saves raw XML-based spreadsheet data directly from the client browser.

---

## Local Setup

To run this application locally:
1. Clone this repository.
2. Double-click `index.html` to launch it directly in your web browser, or run a simple local server:
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx serve .
   ```
3. Open `http://localhost:8000` (or the server port) in your web browser.
