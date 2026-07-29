// Room Allotment System Script

// State
let entries = [];
let editingIndex = null;
let roomRowCounts = {};

// Helper functions for room-specific row counts
function loadRoomRowCounts() {
  const stored = localStorage.getItem('roomRowCounts');
  if (stored) {
    try {
      roomRowCounts = JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing roomRowCounts", e);
      roomRowCounts = {};
    }
  }
}

function getRoomRowCount(roomName) {
  return roomRowCounts[roomName] || 10;
}

function setRoomRowCount(roomName, count) {
  roomRowCounts[roomName] = count;
  localStorage.setItem('roomRowCounts', JSON.stringify(roomRowCounts));
}

// Header Settings State
let univName = "UNIVERSITY NAME";
let examName = "EXAMINATION NAME";
let examDate = "";
let examSession = "";
let logoBase64 = "";

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
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const previewPdfBtn = document.getElementById('previewPdfBtn');
const copyListBtn = document.getElementById('copyListBtn');

// DOM Theme Toggle Elements
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');

// DOM Preview Modal Elements
const previewModal = document.getElementById('previewModal');
const closePreviewBtn = document.getElementById('closePreviewBtn');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');
const previewBody = document.getElementById('previewBody');

// DOM Settings Elements
const settingsToggleBtn = document.getElementById('settingsToggleBtn');
const settingsPanel = document.getElementById('settingsPanel');
const univNameInput = document.getElementById('univNameInput');
const examNameInput = document.getElementById('examNameInput');
const examDateInput = document.getElementById('examDateInput');
const examSessionInput = document.getElementById('examSessionInput');
const logoFileInput = document.getElementById('logoFileInput');
const removeLogoBtn = document.getElementById('removeLogoBtn');
const fileNameLabel = document.getElementById('fileNameLabel');

// Load initial state
function init() {
  // Initialize Theme (Default to Light Mode, check storage for user override)
  const theme = localStorage.getItem('themePreference') || 'light';
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    updateThemeToggleIcon(true);
  } else {
    document.body.classList.remove('dark-theme');
    updateThemeToggleIcon(false);
  }
  
  // Theme Toggle Button Click
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Load room row counts
  loadRoomRowCounts();
  
  // Load entries
  const stored = localStorage.getItem('roomEntries');
  if (stored) {
    try {
      entries = JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing roomEntries from localStorage", e);
      entries = [];
    }
  }
  
  // Load settings
  univName = localStorage.getItem('univName') || "UNIVERSITY NAME";
  examName = localStorage.getItem('examName') || "EXAMINATION NAME";
  examDate = localStorage.getItem('examDate') || "";
  examSession = localStorage.getItem('examSession') || "";
  logoBase64 = localStorage.getItem('logoBase64') || "";
  
  univNameInput.value = univName;
  examNameInput.value = examName;
  examDateInput.value = examDate;
  examSessionInput.value = examSession;
  if (logoBase64) {
    fileNameLabel.textContent = "Logo image loaded";
  }
  
  // Settings panel toggle
  settingsToggleBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('expanded');
    settingsPanel.classList.toggle('collapsed');
  });
  
  // Close settings panel when clicking outside of it
  document.addEventListener('click', (e) => {
    const isClickInsidePanel = settingsPanel.contains(e.target);
    const isClickOnToggleBtn = settingsToggleBtn.contains(e.target);
    
    if (!isClickInsidePanel && !isClickOnToggleBtn) {
      settingsPanel.classList.remove('expanded');
      settingsPanel.classList.add('collapsed');
    }
  });
  
  // Settings inputs listeners
  univNameInput.addEventListener('input', (e) => {
    univName = e.target.value;
    localStorage.setItem('univName', univName);
    render();
  });
  
  examNameInput.addEventListener('input', (e) => {
    examName = e.target.value;
    localStorage.setItem('examName', examName);
    render();
  });
  
  examDateInput.addEventListener('change', (e) => {
    examDate = e.target.value;
    localStorage.setItem('examDate', examDate);
    render();
  });
  
  examSessionInput.addEventListener('change', (e) => {
    examSession = e.target.value;
    localStorage.setItem('examSession', examSession);
    render();
  });
  
  // Logo file upload listener
  logoFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        logoBase64 = evt.target.result;
        localStorage.setItem('logoBase64', logoBase64);
        fileNameLabel.textContent = file.name;
        render();
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Remove logo listener
  removeLogoBtn.addEventListener('click', () => {
    logoBase64 = "";
    localStorage.removeItem('logoBase64');
    logoFileInput.value = "";
    fileNameLabel.textContent = "No logo selected";
    render();
  });
  
  // Set up listeners for form filters
  setupFilters();
  
  // Set up form submit
  addBtn.addEventListener('click', addEntry);
  
  // Clear button click
  clearBtn.addEventListener('click', clearAllEntries);
  
  // Download button click
  downloadBtn.addEventListener('click', downloadExcel);
  
  // Download PDF button click
  downloadPdfBtn.addEventListener('click', downloadPDF);
  
  // Preview PDF button click
  previewPdfBtn.addEventListener('click', showPDFPreview);
  
  // Close Modal Preview button click
  closePreviewBtn.addEventListener('click', closePDFPreview);
  
  // Modal Download PDF button click
  modalDownloadBtn.addEventListener('click', () => {
    closePDFPreview();
    downloadPDF();
  });
  
  // Close preview modal on backdrop click
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
      closePDFPreview();
    }
  });
  
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

// Group entries helper (groups by Room, then by Course and Subject combination)
function groupEntries() {
  return entries.reduce((acc, entry, originalIndex) => {
    const r = entry.room;
    const key = `${entry.course}::${entry.subject}`;
    
    if (!acc[r]) acc[r] = {};
    if (!acc[r][key]) acc[r][key] = [];
    
    acc[r][key].push({ ...entry, index: originalIndex });
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

// Format date helper (converts YYYY-MM-DD to DD-MM-YYYY)
function formatDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

// Render dynamic UI
function render() {
  // Capture current scroll states before wiping elements (by room, course, and subject)
  const scrollMap = {};
  document.querySelectorAll('.table-excel').forEach(el => {
    const room = el.getAttribute('data-room');
    const course = el.getAttribute('data-course');
    const subject = el.getAttribute('data-subject');
    if (room && course && subject) {
      scrollMap[`${room}_${course}_${subject}`] = el.scrollLeft;
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

  // Render University/Exam Seating Arrangement Header Banner Card
  const bannerCard = document.createElement('div');
  bannerCard.className = 'university-banner-card';
  
  const logoBox = document.createElement('div');
  logoBox.className = 'univ-banner-logo';
  if (logoBase64) {
    logoBox.innerHTML = `<img src="${logoBase64}" alt="University Logo">`;
  } else {
    logoBox.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2.5 3 6 3s6-1 6-3v-5"/></svg>`;
  }
  bannerCard.appendChild(logoBox);
  
  const formattedDate = formatDate(examDate);
  const dateDisplay = formattedDate ? ` | Date: ${formattedDate}${examSession ? ` (${examSession})` : ''}` : '';
  const textBox = document.createElement('div');
  textBox.className = 'univ-banner-text';
  textBox.innerHTML = `
    <h2>${univName}</h2>
    <h3>${examName}</h3>
    <p>Room-wise Seating Arrangement${dateDisplay}</p>
  `;
  bannerCard.appendChild(textBox);
  roomsContainer.appendChild(bannerCard);
  
  roomEntriesList.forEach(([roomName, coursesMap]) => {
    const colorClass = getRoomColorClass(grouped, roomName);
    
    // Calculate total students in this room
    const totalStudents = Object.values(coursesMap).reduce((sum, list) => sum + list.length, 0);
    
    // Create Room Card
    const roomDiv = document.createElement('div');
    roomDiv.className = `room ${colorClass}`;
    
    const rowCount = getRoomRowCount(roomName);
    
    // Room Header
    const roomHeader = document.createElement('div');
    roomHeader.className = 'room-header';
    
    const roomTitle = document.createElement('h3');
    roomTitle.textContent = `Room No: ${roomName}`;
    roomHeader.appendChild(roomTitle);
    
    // Controls for dynamic row count
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'room-header-controls';
    controlsDiv.innerHTML = `
      <div class="row-count-control">
        <label>Rows:</label>
        <input type="number" min="1" max="100" class="room-row-input" data-room="${roomName}" value="${rowCount}">
      </div>
      <p>Total Students: ${totalStudents}</p>
    `;
    roomHeader.appendChild(controlsDiv);
    roomDiv.appendChild(roomHeader);
    
    // Course and Subject blocks
    Object.entries(coursesMap).forEach(([courseSubjectKey, studentList]) => {
      const [courseName, subjectName] = courseSubjectKey.split('::');
      
      const courseBlock = document.createElement('div');
      courseBlock.className = 'course-block';
      
      const courseTitle = document.createElement('h4');
      courseTitle.textContent = `Course: ${courseName} | Subject: ${subjectName}`;
      courseBlock.appendChild(courseTitle);
      
      // Excel-like display grid wrapper
      const tableExcel = document.createElement('div');
      tableExcel.className = 'table-excel';
      tableExcel.setAttribute('data-room', roomName);
      tableExcel.setAttribute('data-course', courseName);
      tableExcel.setAttribute('data-subject', subjectName);
      
      // Chunk students into groups of chunkSize
      const chunkSize = getRoomRowCount(roomName);
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
        
        // Dynamic Rows per column
        for (let rowIdx = 0; rowIdx < chunkSize; rowIdx++) {
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
              input.style.background = 'transparent';
              input.style.border = 'none';
              input.style.color = 'var(--text-main)';
              input.style.fontSize = '15px';
              input.style.textAlign = 'center';
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
            // Empty Row to fill grid to chunkSize rows
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
  
  // Set up listeners for room row inputs
  document.querySelectorAll('.room-row-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const room = e.target.getAttribute('data-room');
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 10;
      setRoomRowCount(room, val);
      render();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.target.blur();
      }
    });
  });

  // Restore captured scroll states
  document.querySelectorAll('.table-excel').forEach(el => {
    const room = el.getAttribute('data-room');
    const course = el.getAttribute('data-course');
    const subject = el.getAttribute('data-subject');
    if (room && course && subject) {
      const key = `${room}_${course}_${subject}`;
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
    // Structure data by Room, then by unique Course and Subject key
    const excelGroup = entries.reduce((acc, t) => {
      const r = t.room;
      const key = `${t.course}::${t.subject}`;
      if (!acc[r]) acc[r] = {};
      if (!acc[r][key]) {
        acc[r][key] = {
          course: t.course,
          subject: t.subject,
          time: t.time,
          students: []
        };
      }
      acc[r][key].students.push(t);
      return acc;
    }, {});
    
    const rows = [];
    const merges = [];
    const studentRowIndices = new Set(); // Track actual student row indices for bold formatting
    
    // Calculate max columns across all room layouts to know how wide to merge the University Header
    let maxColsInWorkbook = 0;
    Object.entries(excelGroup).forEach(([roomName, coursesMap]) => {
      let roomCols = 0;
      const R = getRoomRowCount(roomName);
      Object.values(coursesMap).forEach(courseData => {
        const neededCols = Math.ceil(courseData.students.length / R);
        roomCols += 2 * neededCols;
      });
      if (roomCols > maxColsInWorkbook) {
        maxColsInWorkbook = roomCols;
      }
    });
    
    const formattedDate = formatDate(examDate);
    const dateSessionText = formattedDate ? `DATE: ${formattedDate}${examSession ? ` (${examSession.toUpperCase()})` : ''}` : "";
    
    // Initialize first 3 rows for University Header details (logo placeholder columns left if logo exists)
    const rightMergeCol = Math.max(2, maxColsInWorkbook - 1);
    const startTextCol = logoBase64 ? 2 : 0;
    const textColsCount = rightMergeCol - startTextCol + 1;
    
    if (logoBase64) {
      rows.push(["", "", univName]);
      rows.push(["", "", examName]);
      
      merges.push({ s: { r: 0, c: 2 }, e: { r: 0, c: rightMergeCol } });
      merges.push({ s: { r: 1, c: 2 }, e: { r: 1, c: rightMergeCol } });
      
      if (textColsCount >= 3 && dateSessionText) {
        const row3 = ["", ""];
        row3[2] = "ROOM-WISE SEATING ARRANGEMENT";
        row3[rightMergeCol - 1] = dateSessionText;
        rows.push(row3);
        
        merges.push({ s: { r: 2, c: 2 }, e: { r: 2, c: rightMergeCol - 2 } });
        merges.push({ s: { r: 2, c: rightMergeCol - 1 }, e: { r: 2, c: rightMergeCol } });
      } else {
        const subtitleText = dateSessionText ? `ROOM-WISE SEATING ARRANGEMENT - ${dateSessionText}` : "ROOM-WISE SEATING ARRANGEMENT";
        rows.push(["", "", subtitleText]);
        merges.push({ s: { r: 2, c: 2 }, e: { r: 2, c: rightMergeCol } });
      }
    } else {
      rows.push([univName]);
      rows.push([examName]);
      
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: rightMergeCol } });
      merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: rightMergeCol } });
      
      if (textColsCount >= 3 && dateSessionText) {
        const row3 = [];
        row3[0] = "ROOM-WISE SEATING ARRANGEMENT";
        row3[rightMergeCol - 1] = dateSessionText;
        rows.push(row3);
        
        merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: rightMergeCol - 2 } });
        merges.push({ s: { r: 2, c: rightMergeCol - 1 }, e: { r: 2, c: rightMergeCol } });
      } else {
        const subtitleText = dateSessionText ? `ROOM-WISE SEATING ARRANGEMENT - ${dateSessionText}` : "ROOM-WISE SEATING ARRANGEMENT";
        rows.push([subtitleText]);
        merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: rightMergeCol } });
      }
    }
    
    Object.entries(excelGroup).forEach(([roomName, coursesMap]) => {
      const coursesList = Object.entries(coursesMap);
      let totalCols = 0;
      
      const R = getRoomRowCount(roomName);
      const coursesLayout = coursesList.map(([courseSubjectKey, courseData]) => {
        const neededCols = Math.ceil(courseData.students.length / R);
        const colsCount = 2 * neededCols;
        totalCols += colsCount;
        return {
          courseSubjectKey,
          courseName: courseData.course,
          subjectName: courseData.subject,
          students: courseData.students,
          colsCount,
          neededCols
        };
      });
      
      // 1. Room Header Row (shifted down naturally by initial 3 rows)
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
        const sName = layout.subjectName;
        const cData = coursesMap[layout.courseSubjectKey];
        
        // Course header: CourseName (Time)
        rows[courseRowIdx][colOffset] = `${cName} (${cData.time})`;
        merges.push({
          s: { r: courseRowIdx, c: colOffset },
          e: { r: courseRowIdx, c: colOffset + layout.colsCount - 1 }
        });
        
        // Subject header
        rows[subjectRowIdx][colOffset] = sName || "";
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
      
      // 2. Student Data Rows (R rows)
      for (let r = 0; r < R; r++) {
        rows.push(Array(totalCols).fill(""));
        studentRowIndices.add(rows.length - 1); // Track this row index as a student row
      }
      
      colOffset = 0;
      coursesLayout.forEach(layout => {
        for (let sub = 0; sub < layout.neededCols; sub++) {
          for (let r = 0; r < R; r++) {
            const studentIdx = R * sub + r;
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
      
      // Push 2 empty rows for spacing between rooms
      rows.push([]);
      rows.push([]);
    });
    
    // Create workbook and populate sheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Room Allotments");
    
    // Embed logo image at top left (covering cell range A1:B3) if it exists
    if (logoBase64) {
      try {
        // Detect uploader file type or default to png
        const format = logoBase64.includes("image/jpeg") || logoBase64.includes("image/jpg") ? "jpeg" : "png";
        const imageId = workbook.addImage({
          base64: logoBase64,
          extension: format,
        });
        sheet.addImage(imageId, 'A1:B3');
      } catch (e) {
        console.error("Error embedding logo in Excel worksheet:", e);
      }
    }
    
    rows.forEach((rowCells, rIdx) => {
      const row = sheet.getRow(rIdx + 1);
      
      // Set row heights
      if (rIdx === 0) {
        row.height = 35; // Univ Name row
      } else if (rIdx === 1) {
        row.height = 28; // Exam Name row
      } else if (rIdx === 2) {
        row.height = 24; // Subtitle row
      } else if (studentRowIndices.has(rIdx)) {
        row.height = 45; // Data rows height 45
      } else {
        // Set height 50 for rows containing subheaders (SL NO, REGISTER NUMBER) or COUNT
        const hasSubHeader = rowCells.some(val => typeof val === 'string' && (val === "SL NO" || val === "REGISTER NUMBER"));
        const hasCount = rowCells.some(val => typeof val === 'string' && val.startsWith("COUNT - "));
        if (hasSubHeader || hasCount) {
          row.height = 50;
        } else {
          // Check if this is a course header row and calculate wrapped height
          let maxLinesInRow = 1;
          let isCourseRow = false;
          rowCells.forEach((cellVal, cIdx) => {
            if (typeof cellVal === 'string' && cellVal.includes(" | ") && cellVal.includes("(") && cellVal.includes(")")) {
              isCourseRow = true;
              const merge = merges.find(m => m.s.r === rIdx && m.s.c === cIdx);
              if (merge) {
                const colsSpanned = merge.e.c - merge.s.c + 1;
                // Times New Roman size 20 Bold characters are ~1.8x wider than default,
                // so a standard column pair (width 34) holds roughly 15 characters of size 20 bold text.
                const approxWidth = Math.max(14, (colsSpanned / 2) * 15);
                const lines = Math.ceil(cellVal.length / approxWidth);
                if (lines > maxLinesInRow) {
                  maxLinesInRow = lines;
                }
              }
            }
          });
          if (isCourseRow) {
            row.height = Math.max(28, maxLinesInRow * 26); // 26pt per line ensures no cutting off
          }
        }
      }
      
      rowCells.forEach((cellVal, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.value = cellVal;
        
        // Style University Header cells (no grid borders, align left if logo exists)
        if (rIdx < 3) {
          const startTextCol = logoBase64 ? 2 : 0;
          const textColsCount = rightMergeCol - startTextCol + 1;
          let horizontalAlign = "left";
          if (logoBase64 && cIdx < 2) {
            horizontalAlign = "center";
          } else if (rIdx === 2 && dateSessionText && textColsCount >= 3 && cIdx >= rightMergeCol - 1) {
            horizontalAlign = "right";
          }
          
          cell.alignment = {
            vertical: "middle",
            horizontal: horizontalAlign
          };
          
          cell.font = {
            name: "Times New Roman",
            size: rIdx === 0 ? 22 : rIdx === 1 ? 16 : 12,
            bold: true,
            italic: false,
            color: { argb: "FF000000" }
          };
          
          cell.border = {};
          if (rIdx === 2) {
            cell.border = {
              bottom: { style: "medium", color: { argb: "FF000000" } }
            };
          }
          return;
        }
        
        const isHeaderLabel = cellVal === "SL NO" || cellVal === "REGISTER NUMBER";
        
        // Style all headers (room, course, time, subject, sl no, register number, count) as bold.
        // Student data rows (identified dynamically by studentRowIndices) are NOT bold.
        const isBoldHeader = !studentRowIndices.has(rIdx);
        
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true
        };
        
        cell.font = {
          name: "Times New Roman",
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
    
    // Download format: date-session-room allotment.xlsx
    const sessionStr = examSession ? `${examSession}-` : '';
    const dateStr = formattedDate ? `${formattedDate}-` : '';
    const filename = `${dateStr}${sessionStr}room allotment.xlsx`;
    saveAs(blob, filename);
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
    copyListBtn.style.borderColor = 'var(--accent-save)';
    copyListBtn.style.color = '#ffffff';
    
    setTimeout(() => {
      copyListBtn.innerHTML = originalHTML;
      copyListBtn.style.backgroundColor = '';
      copyListBtn.style.borderColor = '';
      copyListBtn.style.color = '';
    }, 2000);
  }).catch(err => {
    console.error("Could not copy register list to clipboard", err);
    alert("Failed to copy list: " + err.message);
  });
}

// Build seating plan page markup to share between Preview and Download
function buildPDFMarkup() {
  const excelGroup = entries.reduce((acc, t) => {
    const r = t.room;
    const key = `${t.course}::${t.subject}`;
    if (!acc[r]) acc[r] = {};
    if (!acc[r][key]) {
      acc[r][key] = {
        course: t.course,
        subject: t.subject,
        time: t.time,
        students: []
      };
    }
    acc[r][key].students.push(t);
    return acc;
  }, {});
  
  const printArea = document.createElement('div');
  printArea.style.width = '297mm';
  printArea.style.backgroundColor = '#ffffff';
  printArea.style.color = '#000000';
  printArea.style.position = 'relative';
  
  const formattedDate = formatDate(examDate);
  const dateSessionText = formattedDate ? `DATE: ${formattedDate}${examSession ? ` (${examSession.toUpperCase()})` : ''}` : "";
  
  const roomEntries = Object.entries(excelGroup);
  let globalPageIndex = 0;
  
  roomEntries.forEach(([roomName, coursesMap]) => {
    const R = getRoomRowCount(roomName);
    
    // Deconstruct all student list columns (block pairs) for this room
    const roomBlocks = [];
    Object.entries(coursesMap).forEach(([courseSubjectKey, courseData]) => {
      const neededCols = Math.ceil(courseData.students.length / R);
      for (let col = 0; col < neededCols; col++) {
        roomBlocks.push({
          course: courseData.course,
          subject: courseData.subject,
          time: courseData.time,
          courseSubjectKey: courseSubjectKey,
          blockIndex: col,
          totalBlocksInCourse: neededCols,
          students: courseData.students.slice(col * R, (col + 1) * R),
          studentStartIdx: col * R,
          totalStudentsInCourse: courseData.students.length
        });
      }
    });
    
    // Chunk the room blocks into groups of at most 7 columns (to fit nicely on A4 Landscape page)
    const blockSize = 7;
    const pageChunks = [];
    for (let i = 0; i < roomBlocks.length; i += blockSize) {
      pageChunks.push(roomBlocks.slice(i, i + blockSize));
    }
    
    // Render a separate A4 Landscape page for each chunk
    pageChunks.forEach((pageChunk) => {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'pdf-page';
      pageDiv.style.width = '297mm';
      pageDiv.style.height = '200mm'; // Safe size slightly under A4 height to prevent sub-pixel overflow breaks
      pageDiv.style.padding = '8mm 12mm'; // Tighter padding for 100% single page safety
      pageDiv.style.boxSizing = 'border-box';
      pageDiv.style.backgroundColor = '#ffffff';
      pageDiv.style.color = '#000000';
      pageDiv.style.fontFamily = '"Times New Roman", Times, serif';
      pageDiv.style.position = 'relative';
      pageDiv.style.overflow = 'hidden'; // Avoid any sub-pixel layout spills
      
      if (globalPageIndex > 0) {
        pageDiv.style.pageBreakBefore = 'always';
      }
      globalPageIndex++;
      
      // 1. University Header Banner (matches Excel rows 1-3 format)
      const headerDiv = document.createElement('div');
      headerDiv.style.display = 'flex';
      headerDiv.style.alignItems = 'center';
      headerDiv.style.gap = '15px';
      headerDiv.style.borderBottom = '2px solid #000000';
      headerDiv.style.paddingBottom = '6px';
      headerDiv.style.marginBottom = '10px';
      
      const logoBox = document.createElement('div');
      logoBox.style.width = '72px';
      logoBox.style.height = '72px';
      logoBox.style.display = 'flex';
      logoBox.style.alignItems = 'center';
      logoBox.style.justifyContent = 'center';
      logoBox.style.border = '1px solid #333333';
      
      if (logoBase64) {
        logoBox.innerHTML = `<img src="${logoBase64}" style="width:100%; height:100%; object-fit:contain;">`;
      } else {
        logoBox.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" style="width:48px; height:48px;"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2.5 3 6 3s6-1 6-3v-5"/></svg>`;
      }
      headerDiv.appendChild(logoBox);
      
      const titleBox = document.createElement('div');
      titleBox.style.flexGrow = '1';
      titleBox.style.display = 'flex';
      titleBox.style.flexDirection = 'column';
      
      const topRow = document.createElement('div');
      topRow.style.fontSize = '26px';
      topRow.style.fontWeight = 'bold';
      topRow.style.textAlign = 'left';
      topRow.textContent = univName;
      titleBox.appendChild(topRow);
      
      const middleRow = document.createElement('div');
      middleRow.style.fontSize = '18px';
      middleRow.style.fontWeight = 'bold';
      middleRow.style.textAlign = 'left';
      middleRow.style.marginTop = '2px';
      middleRow.textContent = examName;
      titleBox.appendChild(middleRow);
      
      const subRow = document.createElement('div');
      subRow.style.display = 'flex';
      subRow.style.justifyContent = 'space-between';
      subRow.style.fontSize = '18px';
      subRow.style.fontWeight = 'bold';
      subRow.style.marginTop = '2px';
      subRow.innerHTML = `
        <span>ROOM-WISE SEATING ARRANGEMENT</span>
        <span>${dateSessionText}</span>
      `;
      titleBox.appendChild(subRow);
      
      headerDiv.appendChild(titleBox);
      pageDiv.appendChild(headerDiv);
      
      // 2. Room Seating Table (matches Excel Grid structure)
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.fontFamily = '"Times New Roman", Times, serif';
      table.style.fontSize = '12px';
      table.style.tableLayout = 'fixed';
      
      const totalCols = pageChunk.length * 2;
      const totalPairs = pageChunk.length;
      
      const colgroup = document.createElement('colgroup');
      pageChunk.forEach(() => {
        for (let c = 0; c < 2; c++) {
          const col = document.createElement('col');
          const pct = (c % 2 === 0) ? 0.25 : 0.75;
          col.style.width = `${(100 / totalPairs) * pct}%`;
          colgroup.appendChild(col);
        }
      });
      table.appendChild(colgroup);
      
      // Room Name Row (height 42px, font size 20px, no background)
      const roomRow = document.createElement('tr');
      roomRow.style.height = '42px';
      const roomCell = document.createElement('td');
      roomCell.colSpan = totalCols;
      roomCell.style.border = '1px solid #000000';
      roomCell.style.textAlign = 'center';
      roomCell.style.fontWeight = 'bold';
      roomCell.style.fontSize = '20px';
      roomCell.textContent = `ROOM NO: ${roomName}`;
      roomRow.appendChild(roomCell);
      table.appendChild(roomRow);
      
      // Group adjacent blocks by their courseSubjectKey to draw merged Course Headers
      const courseHeaders = [];
      let currentHeader = null;
      pageChunk.forEach(block => {
        if (!currentHeader || currentHeader.courseSubjectKey !== block.courseSubjectKey) {
          currentHeader = {
            course: block.course,
            subject: block.subject,
            time: block.time,
            courseSubjectKey: block.courseSubjectKey,
            colsCount: 2,
            totalStudentsCount: block.totalStudentsInCourse
          };
          courseHeaders.push(currentHeader);
        } else {
          currentHeader.colsCount += 2;
        }
      });
      
      // Course Headers Row (height 36px base, font size 18px)
      const courseRow = document.createElement('tr');
      let maxLines = 1;
      courseHeaders.forEach(header => {
        const text = `${header.course} | ${header.subject} (${header.time || ''})`;
        const approxWidth = Math.max(14, (header.colsCount / 2) * 15);
        const lines = Math.ceil(text.length / approxWidth);
        if (lines > maxLines) maxLines = lines;
      });
      courseRow.style.height = `${Math.max(36, maxLines * 26)}px`;
      
      courseHeaders.forEach(header => {
        const cCell = document.createElement('td');
        cCell.colSpan = header.colsCount;
        cCell.style.border = '1px solid #000000';
        cCell.style.textAlign = 'center';
        cCell.style.fontWeight = 'bold';
        cCell.style.fontSize = '18px';
        cCell.style.padding = '4px';
        cCell.style.wordWrap = 'break-word';
        cCell.textContent = `${header.course} | ${header.subject} (${header.time || ''})`;
        courseRow.appendChild(cCell);
      });
      table.appendChild(courseRow);
      
      // Sub-Headers Row (SL NO, REGISTER NUMBER)
      const subHeaderRow = document.createElement('tr');
      subHeaderRow.style.height = '42px';
      pageChunk.forEach(() => {
        for (let c = 0; c < 2; c++) {
          const sCell = document.createElement('td');
          sCell.style.border = '1px solid #000000';
          sCell.style.textAlign = 'center';
          sCell.style.fontWeight = 'bold';
          sCell.style.fontSize = '15px';
          sCell.style.padding = '4px 2px';
          sCell.style.wordWrap = 'break-word';
          sCell.style.whiteSpace = 'normal';
          sCell.textContent = (c % 2 === 0) ? "SL NO" : "REGISTER NUMBER";
          subHeaderRow.appendChild(sCell);
        }
      });
      table.appendChild(subHeaderRow);
      
      // Student Data Rows
      for (let r = 0; r < R; r++) {
        const dataRow = document.createElement('tr');
        dataRow.style.height = '28px';
        
        pageChunk.forEach(block => {
          const student = block.students[r];
          const studentIdx = block.studentStartIdx + r;
          
          const slCell = document.createElement('td');
          slCell.style.border = '1px solid #000000';
          slCell.style.textAlign = 'center';
          slCell.style.fontSize = '14px';
          slCell.style.padding = '4px 2px';
          slCell.style.wordWrap = 'break-word';
          slCell.style.whiteSpace = 'normal';
          
          const regCell = document.createElement('td');
          regCell.style.border = '1px solid #000000';
          regCell.style.textAlign = 'center';
          regCell.style.fontSize = '15px';
          regCell.style.padding = '4px 2px';
          regCell.style.wordWrap = 'break-word';
          regCell.style.whiteSpace = 'normal';
          
          if (student) {
            slCell.textContent = studentIdx + 1;
            regCell.textContent = student.studentId;
          } else {
            slCell.innerHTML = '&nbsp;';
            regCell.innerHTML = '&nbsp;';
          }
          
          dataRow.appendChild(slCell);
          dataRow.appendChild(regCell);
        });
        table.appendChild(dataRow);
      }
      
      // Count Row
      const countRow = document.createElement('tr');
      countRow.style.height = '42px';
      courseHeaders.forEach(header => {
        const coCell = document.createElement('td');
        coCell.colSpan = header.colsCount;
        coCell.style.border = '1px solid #000000';
        coCell.style.textAlign = 'center';
        coCell.style.fontWeight = 'bold';
        coCell.style.fontSize = '16px';
        coCell.style.padding = '6px';
        coCell.textContent = `COUNT - ${header.totalStudentsCount}`;
        countRow.appendChild(coCell);
      });
      table.appendChild(countRow);
      
      pageDiv.appendChild(table);
      printArea.appendChild(pageDiv);
    });
  });
  
  return printArea;
}

// Download Seating Plan as PDF in identical Excel layout format
async function downloadPDF() {
  if (entries.length === 0) {
    alert("No entries to export.");
    return;
  }
  
  const originalText = downloadPdfBtn.innerHTML;
  downloadPdfBtn.innerHTML = `
    <svg class="animate-spin" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
    <span>Generating PDF...</span>
  `;
  downloadPdfBtn.disabled = true;
  
  try {
    // Create temporary print area wrapper (placed at 0,0 but zIndex -9999 behind the body background)
    const printWrapper = document.createElement('div');
    printWrapper.style.position = 'absolute';
    printWrapper.style.left = '0';
    printWrapper.style.top = '0';
    printWrapper.style.width = '297mm';
    printWrapper.style.zIndex = '-9999';
    printWrapper.style.overflow = 'visible';
    document.body.appendChild(printWrapper);
    
    const printArea = buildPDFMarkup();
    printWrapper.appendChild(printArea);
    
    const formattedDate = formatDate(examDate);
    const opt = {
      margin:       0,
      filename:     `${formattedDate ? `${formattedDate}-` : ''}${examSession ? `${examSession}-` : ''}room allotment.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak:    { mode: 'css' }
    };
    
    await html2pdf().from(printArea).set(opt).save();
    
    document.body.removeChild(printWrapper);
  } catch (err) {
    console.error("Error generating PDF document", err);
    alert("An error occurred during PDF generation: " + err.message);
  } finally {
    downloadPdfBtn.innerHTML = originalText;
    downloadPdfBtn.disabled = false;
  }
}

// Show interactive PDF Preview inside UI modal overlay
function showPDFPreview() {
  if (entries.length === 0) {
    alert("No entries to preview.");
    return;
  }
  
  // Clear previous preview contents
  previewBody.innerHTML = '';
  
  // Compile print layout
  const printArea = buildPDFMarkup();
  
  // Transfer compiled pages into the modal preview panel
  const pages = Array.from(printArea.childNodes);
  pages.forEach(page => {
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-page-container';
    const clone = page.cloneNode(true);
    wrapper.appendChild(clone);
    previewBody.appendChild(wrapper);
  });
  
  // Render and fade in
  previewModal.style.display = 'flex';
  setTimeout(() => {
    previewModal.classList.add('active');
  }, 10);
}

// Close and hide interactive PDF Preview modal
function closePDFPreview() {
  previewModal.classList.remove('active');
  setTimeout(() => {
    previewModal.style.display = 'none';
    previewBody.innerHTML = '';
  }, 300);
}

// Toggle between Light and Dark mode UI themes
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('themePreference', isDark ? 'dark' : 'light');
  updateThemeToggleIcon(isDark);
}

// Update the theme toggle SVG icon based on active theme state
function updateThemeToggleIcon(isDark) {
  if (isDark) {
    // Show Sun icon in dark theme to toggle back to light theme
    themeIcon.innerHTML = `
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.07" x2="5.64" y2="17.64"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    `;
    themeToggleBtn.setAttribute('title', 'Switch to Light Theme');
  } else {
    // Show Moon icon in light theme to toggle to dark theme
    themeIcon.innerHTML = `
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    `;
    themeToggleBtn.setAttribute('title', 'Switch to Dark Theme');
  }
}

// Boot application
document.addEventListener('DOMContentLoaded', init);
