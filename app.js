// Room Allotment System Script

// State
let entries = [];
let editingIndex = null;

// DOM Elements
const roomInput = document.getElementById('roomInput');
const timeInput = document.getElementById('timeInput');
const courseInput = document.getElementById('courseInput');
const subjectInput = document.getElementById('subjectInput');
const studentIdInput = document.getElementById('studentIdInput');
const addBtn = document.getElementById('addBtn');
const clearBtn = document.getElementById('clearBtn');
const roomsContainer = document.getElementById('roomsContainer');
const downloadBtn = document.getElementById('downloadBtn');
const copyListBtn = document.getElementById('copyListBtn');

// Load initial state
function init() {
  const stored = localStorage.getItem('roomEntries');
  if (stored) {
    try {
      entries = JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing roomEntries from localStorage", e);
      entries = [];
    }
  }
  
  // Set up listeners for form filters
  setupFilters();
  
  // Set up form submit
  addBtn.addEventListener('click', addEntry);
  
  // Clear button click
  clearBtn.addEventListener('click', clearAllEntries);
  
  // Download button click
  downloadBtn.addEventListener('click', downloadExcel);
  
  // Copy register numbers button click
  copyListBtn.addEventListener('click', copyRegisterNumbersList);
  
  // Initial render
  render();
}

// Setup input character filters (matching original React code logic)
function setupFilters() {
  roomInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z 0-9-:]/g, '');
  });
  
  timeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z - 0-9-:]/g, '');
  });
  
  courseInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z - 0-9-]/g, '');
  });
  
  subjectInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z - 0-9-]/g, '');
  });
  
  studentIdInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });
  
  // Set up Student ID special keys: Enter (submit), ArrowUp/Down (inc/dec trailing number)
  studentIdInput.addEventListener('keydown', (e) => {
    const value = e.target.value;
    const match = value.match(/^(.*?)(\d+)$/);
    
    if (e.key === 'Enter') {
      e.preventDefault();
      addEntry();
    } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && match) {
      e.preventDefault();
      const prefix = match[1];
      const numStr = match[2];
      let num = parseInt(numStr, 10);
      
      if (e.key === 'ArrowUp') {
        num++;
      } else if (e.key === 'ArrowDown' && num > 0) {
        num--;
      }
      
      const paddedNum = String(num).padStart(numStr.length, '0');
      e.target.value = prefix + paddedNum;
    }
  });
}

// Save entries to localStorage
function saveToStorage() {
  localStorage.setItem('roomEntries', JSON.stringify(entries));
}

// Clear all entries with confirmation
function clearAllEntries() {
  if (window.confirm("Are you sure you want to clear all entries?")) {
    entries = [];
    localStorage.removeItem('roomEntries');
    editingIndex = null;
    render();
  }
}

// Add student entry
function addEntry() {
  const room = roomInput.value.trim();
  const time = timeInput.value.trim();
  const course = courseInput.value.trim();
  const subject = subjectInput.value.trim();
  const studentId = studentIdInput.value.trim();
  
  if (!room || !time || !course || !subject || !studentId) {
    alert("Please fill all fields");
    return;
  }
  
  // Push entry
  entries.push({ room, time, course, subject, studentId });
  saveToStorage();
  
  // Auto increment logic
  const match = studentId.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const numStr = match[2];
    const nextNum = parseInt(numStr, 10) + 1;
    const padded = String(nextNum).padStart(numStr.length, '0');
    studentIdInput.value = prefix + padded;
  } else {
    studentIdInput.value = '';
  }
  
  // Refresh and focus student ID input for fast entry
  const newIndex = entries.length - 1;
  render();
  studentIdInput.focus();
  
  // Smoothly scroll the newly added entry into view
  setTimeout(() => {
    const newRow = document.querySelector(`.table-row[data-student-index="${newIndex}"]`);
    if (newRow) {
      newRow.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, 80);
}

// Delete an entry by its master index
function deleteEntry(index) {
  entries.splice(index, 1);
  saveToStorage();
  if (editingIndex === index) {
    editingIndex = null;
  } else if (editingIndex > index) {
    editingIndex--;
  }
  render();
}

// Start inline editing of an entry
function editEntry(index) {
  editingIndex = index;
  render();
  
  // Focus the input being edited
  setTimeout(() => {
    const activeInput = document.querySelector(`.edit-input[data-index="${index}"]`);
    if (activeInput) {
      activeInput.focus();
      // Move cursor to end of input text
      const val = activeInput.value;
      activeInput.value = '';
      activeInput.value = val;
      
      // Smoothly scroll the input into view
      activeInput.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, 50);
}

// Save edited value
function saveEdit(index) {
  const activeInput = document.querySelector(`.edit-input[data-index="${index}"]`);
  if (activeInput) {
    entries[index].studentId = activeInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    saveToStorage();
  }
  editingIndex = null;
  render();
}

// Insert an empty entry right after the specified index
function insertEntryAfter(index) {
  const current = entries[index];
  const newEntry = {
    room: current.room,
    time: current.time,
    course: current.course,
    subject: current.subject,
    studentId: ''
  };
  
  entries.splice(index + 1, 0, newEntry);
  saveToStorage();
  
  // Start editing the newly inserted entry immediately
  editEntry(index + 1);
}

// Group entries helper
function groupEntries() {
  return entries.reduce((acc, entry, originalIndex) => {
    const r = entry.room;
    const c = entry.course;
    
    if (!acc[r]) acc[r] = {};
    if (!acc[r][c]) acc[r][c] = [];
    
    acc[r][c].push({ ...entry, index: originalIndex });
    return acc;
  }, {});
}

// Get border color class for a room based on its position key
function getRoomColorClass(grouped, roomName) {
  const colors = ["pink", "blue", "green", "orange", "purple"];
  const roomKeys = Object.keys(grouped);
  const index = roomKeys.indexOf(roomName);
  return colors[index % colors.length];
}

// Render dynamic UI
function render() {
  // Capture current scroll states before wiping elements
  const scrollMap = {};
  document.querySelectorAll('.table-excel').forEach(el => {
    const room = el.getAttribute('data-room');
    const course = el.getAttribute('data-course');
    if (room && course) {
      scrollMap[`${room}_${course}`] = el.scrollLeft;
    }
  });
  const scrollY = window.scrollY;

  roomsContainer.innerHTML = '';
  
  const grouped = groupEntries();
  const roomEntriesList = Object.entries(grouped);
  
  if (roomEntriesList.length === 0) {
    roomsContainer.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-dim); margin-bottom: 16px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="18" x2="11" y2="18"/></svg>
        <p style="font-size: 16px; font-weight: 600; color: var(--text-main);">No Room Allotments Active</p>
        <p style="font-size: 13px; color: var(--text-dim); text-align: center; margin-top: 8px; max-width: 320px;">Use the top control form to add students, room numbers, times, and course allocations.</p>
      </div>
    `;
    return;
  }
  
  roomEntriesList.forEach(([roomName, coursesMap]) => {
    const colorClass = getRoomColorClass(grouped, roomName);
    
    // Calculate total students in this room
    const totalStudents = Object.values(coursesMap).reduce((sum, list) => sum + list.length, 0);
    
    // Create Room Card
    const roomDiv = document.createElement('div');
    roomDiv.className = `room ${colorClass}`;
    
    // Room Header
    const roomHeader = document.createElement('div');
    roomHeader.className = 'room-header';
    roomHeader.innerHTML = `
      <h3>Room No: ${roomName}</h3>
      <p>Total Students: ${totalStudents}</p>
    `;
    roomDiv.appendChild(roomHeader);
    
    // Course blocks
    Object.entries(coursesMap).forEach(([courseName, studentList]) => {
      const courseBlock = document.createElement('div');
      courseBlock.className = 'course-block';
      
      const courseTitle = document.createElement('h4');
      courseTitle.textContent = `Course: ${courseName}`;
      courseBlock.appendChild(courseTitle);
      
      // Excel-like display grid wrapper
      const tableExcel = document.createElement('div');
      tableExcel.className = 'table-excel';
      tableExcel.setAttribute('data-room', roomName);
      tableExcel.setAttribute('data-course', courseName);
      
      // Chunk students into groups of 10
      const chunkSize = 10;
      const chunksCount = Math.ceil(studentList.length / chunkSize);
      
      for (let colIdx = 0; colIdx < chunksCount; colIdx++) {
        const studentColumn = document.createElement('div');
        studentColumn.className = 'student-column';
        
        // Column Header
        const headerRow = document.createElement('div');
        headerRow.className = 'table-row table-header';
        headerRow.innerHTML = `
          <div class="table-cell slno-header">Sl No</div>
          <div class="table-cell id-header">Student ID</div>
          <div class="table-cell action-header">Actions</div>
        `;
        studentColumn.appendChild(headerRow);
        
        // 10 Rows per column
        for (let rowIdx = 0; rowIdx < 10; rowIdx++) {
          const studentIdx = colIdx * chunkSize + rowIdx;
          const student = studentList[studentIdx];
          
          const rowDiv = document.createElement('div');
          rowDiv.className = 'table-row';
          
          if (student) {
            rowDiv.setAttribute('data-student-index', student.index);
            const slNo = studentIdx + 1;
            const isEditing = editingIndex === student.index;
            
            // Sl No Cell
            const slCell = document.createElement('div');
            slCell.className = 'table-cell slno-cell';
            slCell.textContent = slNo;
            rowDiv.appendChild(slCell);
            
            // Student ID Cell
            const idCell = document.createElement('div');
            idCell.className = 'table-cell id-cell';
            
            if (isEditing) {
              const input = document.createElement('input');
              input.type = 'text';
              input.className = 'edit-input';
              input.dataset.index = student.index;
              input.value = student.studentId;
              input.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
              });
              input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                  saveEdit(student.index);
                } else if (e.key === 'Escape') {
                  editingIndex = null;
                  render();
                }
              });
              idCell.appendChild(input);
            } else {
              const input = document.createElement('input');
              input.type = 'text';
              input.value = student.studentId;
              input.disabled = true;
              input.style.background = '#253348';
              input.style.fontSize = '15px';
              idCell.appendChild(input);
            }
            rowDiv.appendChild(idCell);
            
            // Action Cell
            const actionCell = document.createElement('div');
            actionCell.className = 'table-cell action-cell';
            
            if (isEditing) {
              const saveBtn = document.createElement('button');
              saveBtn.className = 'save-btn';
              saveBtn.title = 'Save Changes';
              saveBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>';
              saveBtn.onclick = () => saveEdit(student.index);
              actionCell.appendChild(saveBtn);
            } else {
              if (student.studentId) {
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-btn';
                editBtn.title = 'Edit Student ID';
                editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
                editBtn.onclick = () => editEntry(student.index);
                actionCell.appendChild(editBtn);
              }
            }
            
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.title = 'Delete Entry';
            delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
            delBtn.onclick = () => deleteEntry(student.index);
            actionCell.appendChild(delBtn);
            
            const addNextBtn = document.createElement('button');
            addNextBtn.className = 'add-btn';
            addNextBtn.title = 'Insert Seat After';
            addNextBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
            addNextBtn.onclick = () => insertEntryAfter(student.index);
            actionCell.appendChild(addNextBtn);
            
            rowDiv.appendChild(actionCell);
          } else {
            // Empty Row to fill grid to 10 rows
            rowDiv.innerHTML = `
              <div class="table-cell slno-cell"></div>
              <div class="table-cell id-cell"></div>
              <div class="table-cell action-cell"></div>
            `;
          }
          
          studentColumn.appendChild(rowDiv);
        }
        
        tableExcel.appendChild(studentColumn);
      }
      
      courseBlock.appendChild(tableExcel);
      roomDiv.appendChild(courseBlock);
    });
    
    roomsContainer.appendChild(roomDiv);
  });

  // Restore captured scroll states
  document.querySelectorAll('.table-excel').forEach(el => {
    const room = el.getAttribute('data-room');
    const course = el.getAttribute('data-course');
    if (room && course) {
      const key = `${room}_${course}`;
      if (scrollMap[key] !== undefined) {
        el.scrollLeft = scrollMap[key];
      }
    }
  });
  window.scrollTo(0, scrollY);
}

// Download Excel Logic (matching the exact workbook structure and cell styles)
async function downloadExcel() {
  if (entries.length === 0) {
    alert("No entries to download.");
    return;
  }
  
  try {
    // Structure data by Room, then by Course
    const excelGroup = entries.reduce((acc, t) => {
      const r = t.room;
      const c = t.course;
      if (!acc[r]) acc[r] = {};
      if (!acc[r][c]) {
        acc[r][c] = {
          subject: t.subject,
          time: t.time,
          students: []
        };
      }
      acc[r][c].students.push(t);
      return acc;
    }, {});
    
    const rows = [];
    const merges = [];
    
    Object.entries(excelGroup).forEach(([roomName, coursesMap]) => {
      const coursesList = Object.entries(coursesMap);
      let totalCols = 0;
      
      const coursesLayout = coursesList.map(([courseName, courseData]) => {
        const neededCols = Math.ceil(courseData.students.length / 10);
        const colsCount = 2 * neededCols;
        totalCols += colsCount;
        return {
          courseName,
          students: courseData.students,
          colsCount,
          neededCols
        };
      });
      
      // 1. Room Header Row
      rows.push([`ROOM-${roomName}`]);
      const roomRowIdx = rows.length - 1;
      
      // Allocate space for header rows
      rows.push([], [], []);
      const courseRowIdx = rows.length - 3;
      const subjectRowIdx = rows.length - 2;
      const headerRowIdx = rows.length - 1;
      
      let colOffset = 0;
      coursesLayout.forEach(layout => {
        const cName = layout.courseName;
        const cData = coursesMap[cName];
        
        // Course header: CourseName (Time)
        rows[courseRowIdx][colOffset] = `${cName} (${cData.time})`;
        merges.push({
          s: { r: courseRowIdx, c: colOffset },
          e: { r: courseRowIdx, c: colOffset + layout.colsCount - 1 }
        });
        
        // Subject header
        rows[subjectRowIdx][colOffset] = cData.subject || "";
        merges.push({
          s: { r: subjectRowIdx, c: colOffset },
          e: { r: subjectRowIdx, c: colOffset + layout.colsCount - 1 }
        });
        
        // Sub-column headers: SL NO, REGISTER NUMBER
        for (let sub = 0; sub < layout.colsCount / 2; sub++) {
          const slIdx = colOffset + 2 * sub;
          const regIdx = slIdx + 1;
          rows[headerRowIdx][slIdx] = "SL NO";
          rows[headerRowIdx][regIdx] = "REGISTER NUMBER";
        }
        
        colOffset += layout.colsCount;
      });
      
      // 2. Student Data Rows (10 rows)
      for (let r = 0; r < 10; r++) {
        rows.push(Array(totalCols).fill(""));
      }
      
      colOffset = 0;
      coursesLayout.forEach(layout => {
        for (let sub = 0; sub < layout.neededCols; sub++) {
          for (let r = 0; r < 10; r++) {
            const studentIdx = 10 * sub + r;
            const targetRowIdx = headerRowIdx + 1 + r;
            const slColIdx = colOffset + 2 * sub;
            const regColIdx = slColIdx + 1;
            
            if (studentIdx < layout.students.length) {
              rows[targetRowIdx][slColIdx] = studentIdx + 1;
              rows[targetRowIdx][regColIdx] = layout.students[studentIdx].studentId;
            }
          }
        }
        colOffset += layout.colsCount;
      });
      
      // 3. Count Row
      const countRow = Array(totalCols).fill("");
      colOffset = 0;
      coursesLayout.forEach(layout => {
        countRow[colOffset] = `COUNT - ${layout.students.length}`;
        merges.push({
          s: { r: rows.length, c: colOffset },
          e: { r: rows.length, c: colOffset + layout.colsCount - 1 }
        });
        colOffset += layout.colsCount;
      });
      rows.push(countRow);
      
      // 4. Merge Room Name Row across all columns of this room
      if (totalCols > 0) {
        merges.push({
          s: { r: roomRowIdx, c: 0 },
          e: { r: roomRowIdx, c: totalCols - 1 }
        });
      }
      
      // Push empty row for spacing
      rows.push([]);
    });
    
    // Create workbook and populate sheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Room Allotments");
    
    rows.forEach((rowCells, rIdx) => {
      const row = sheet.getRow(rIdx + 1);
      rowCells.forEach((cellVal, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.value = cellVal;
        
        const isHeaderLabel = cellVal === "SL NO" || cellVal === "REGISTER NUMBER";
        const isAlphanumericCode = typeof cellVal === "string" && /^[A-Z0-9]+$/.test(cellVal);
        // Style condition for bold title headers (exclude data labels and student ids in grid)
        const isBoldHeader = !isHeaderLabel && !(/^\d+$/.test(String(cellVal))) && !(isAlphanumericCode && rIdx >= 5);
        
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: isHeaderLabel
        };
        
        cell.font = {
          name: "Arial",
          size: 20,
          bold: isBoldHeader
        };
        
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        };
      });
      row.commit();
    });
    
    // Apply merged ranges
    merges.forEach(range => {
      const startCell = sheet.getCell(range.s.r + 1, range.s.c + 1);
      const endCell = sheet.getCell(range.e.r + 1, range.e.c + 1);
      sheet.mergeCells(`${startCell.address}:${endCell.address}`);
    });
    
    // Apply column widths
    const maxColsWidth = Math.max(...rows.map(r => r.length));
    for (let c = 0; c < maxColsWidth; c++) {
      sheet.getColumn(c + 1).width = (c % 2 === 0) ? 7 : 27;
    }
    
    // Generate file buffer and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "room_allotments.xlsx");
  } catch (err) {
    console.error("Error generating Excel sheet", err);
    alert("An error occurred during Excel export: " + err.message);
  }
}

// Copy register numbers only to clipboard (one per line, in order)
function copyRegisterNumbersList() {
  if (entries.length === 0) {
    alert("No entries to copy.");
    return;
  }
  
  // Collect all non-empty register numbers in their added order
  const studentIds = entries
    .map(e => e.studentId.trim())
    .filter(id => id !== "");
    
  if (studentIds.length === 0) {
    alert("No valid student IDs found.");
    return;
  }
  
  const textToCopy = studentIds.join('\n');
  
  navigator.clipboard.writeText(textToCopy).then(() => {
    // Visual success state on the button
    const originalHTML = copyListBtn.innerHTML;
    copyListBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      <span>Copied List!</span>
    `;
    copyListBtn.style.backgroundColor = 'var(--accent-save)';
    
    setTimeout(() => {
      copyListBtn.innerHTML = originalHTML;
      copyListBtn.style.backgroundColor = '';
    }, 2000);
  }).catch(err => {
    console.error("Could not copy register list to clipboard", err);
    alert("Failed to copy list: " + err.message);
  });
}

// Boot application
document.addEventListener('DOMContentLoaded', init);
