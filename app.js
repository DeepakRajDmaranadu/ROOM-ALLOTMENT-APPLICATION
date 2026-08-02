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
let uniformPdfColumns = false;
let repeatPdfHeader = true;
let pdfOrientation = "landscape";
let pdfFontSizeHeading = 16;
let pdfFontSizeValue = 14;
let pdfLogoSize = 72;
let pageUniformColumns = {};
let pdfHeaderAlign = "center";

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
const uniformColumnsInput = document.getElementById('uniformColumnsInput');
const repeatHeaderInput = document.getElementById('repeatHeaderInput');
const pdfFontSizeHeadingInput = document.getElementById('pdfFontSizeHeadingInput');
const pdfFontSizeValueInput = document.getElementById('pdfFontSizeValueInput');
const pdfLogoSizeInput = document.getElementById('pdfLogoSizeInput');
const pdfHeaderAlignInput = document.getElementById('pdfHeaderAlignInput');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const importJsonBtn = document.getElementById('importJsonBtn');
const importJsonFileInput = document.getElementById('importJsonFileInput');

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
  uniformPdfColumns = localStorage.getItem('uniformPdfColumns') === 'true';
  const storedRepeat = localStorage.getItem('repeatPdfHeader');
  repeatPdfHeader = storedRepeat !== null ? storedRepeat === 'true' : true;
  pdfOrientation = localStorage.getItem('pdfOrientation') || 'landscape';
  pdfFontSizeHeading = parseInt(localStorage.getItem('pdfFontSizeHeading'), 10) || 16;
  pdfFontSizeValue = parseInt(localStorage.getItem('pdfFontSizeValue'), 10) || 14;
  pdfLogoSize = parseInt(localStorage.getItem('pdfLogoSize'), 10) || 72;
  pdfHeaderAlign = localStorage.getItem('pdfHeaderAlign') || "center";
  try {
    pageUniformColumns = JSON.parse(localStorage.getItem('pageUniformColumns')) || {};
  } catch (e) {
    pageUniformColumns = {};
  }
  
  univNameInput.value = univName;
  examNameInput.value = examName;
  examDateInput.value = examDate;
  examSessionInput.value = examSession;
  uniformColumnsInput.checked = uniformPdfColumns;
  repeatHeaderInput.checked = repeatPdfHeader;
  pdfFontSizeHeadingInput.value = pdfFontSizeHeading;
  pdfFontSizeValueInput.value = pdfFontSizeValue;
  pdfLogoSizeInput.value = pdfLogoSize;
  pdfHeaderAlignInput.value = pdfHeaderAlign;
  
  if (pdfOrientation === 'portrait') {
    document.getElementById('orientPortrait').checked = true;
  } else {
    document.getElementById('orientLandscape').checked = true;
  }
  
  if (logoBase64) {
    fileNameLabel.textContent = "Logo image loaded";
  }
  
  // Intercept Ctrl+P or Cmd+P to open interactive PDF Preview modal
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      showPDFPreview();
    }
  });
  
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
  
  // Uniform PDF columns checkbox toggle listener
  uniformColumnsInput.addEventListener('change', (e) => {
    uniformPdfColumns = e.target.checked;
    localStorage.setItem('uniformPdfColumns', uniformPdfColumns ? 'true' : 'false');
    // Clear individual page overrides when global uniform columns option changes
    pageUniformColumns = {};
    localStorage.removeItem('pageUniformColumns');
    if (previewModal.classList.contains('active')) {
      showPDFPreview();
    }
  });
  
  // Repeat PDF Header checkbox toggle listener
  repeatHeaderInput.addEventListener('change', (e) => {
    repeatPdfHeader = e.target.checked;
    localStorage.setItem('repeatPdfHeader', repeatPdfHeader ? 'true' : 'false');
    if (previewModal.classList.contains('active')) {
      showPDFPreview();
    }
  });
  
  // PDF orientation radio listeners
  document.getElementById('orientLandscape').addEventListener('change', (e) => {
    if (e.target.checked) {
      pdfOrientation = 'landscape';
      localStorage.setItem('pdfOrientation', 'landscape');
      if (previewModal.classList.contains('active')) {
        showPDFPreview();
      }
    }
  });
  
  document.getElementById('orientPortrait').addEventListener('change', (e) => {
    if (e.target.checked) {
      pdfOrientation = 'portrait';
      localStorage.setItem('pdfOrientation', 'portrait');
      if (previewModal.classList.contains('active')) {
        showPDFPreview();
      }
    }
  });
  
  // Font size change listeners
  pdfFontSizeHeadingInput.addEventListener('change', (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 8) val = 8;
    if (val > 48) val = 48;
    pdfFontSizeHeading = val;
    pdfFontSizeHeadingInput.value = val;
    localStorage.setItem('pdfFontSizeHeading', val);
    if (previewModal.classList.contains('active')) {
      showPDFPreview();
    }
  });
  
  pdfFontSizeValueInput.addEventListener('change', (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 6) val = 6;
    if (val > 36) val = 36;
    pdfFontSizeValue = val;
    pdfFontSizeValueInput.value = val;
    localStorage.setItem('pdfFontSizeValue', val);
    if (previewModal.classList.contains('active')) {
      showPDFPreview();
    }
  });
  
  pdfLogoSizeInput.addEventListener('change', (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 30) val = 30;
    if (val > 150) val = 150;
    pdfLogoSize = val;
    pdfLogoSizeInput.value = val;
    localStorage.setItem('pdfLogoSize', val);
    if (previewModal.classList.contains('active')) {
      showPDFPreview();
    }
  });
  
  pdfHeaderAlignInput.addEventListener('change', (e) => {
    pdfHeaderAlign = e.target.value;
    localStorage.setItem('pdfHeaderAlign', pdfHeaderAlign);
    if (previewModal.classList.contains('active')) {
      showPDFPreview();
    }
  });
  
  // Set up listeners for form filters
  setupFilters();
  
  // Set up form submit
  addBtn.addEventListener('click', addEntry);
  
  // Clear button click
  clearBtn.addEventListener('click', clearAllEntries);
  
  // JSON Backup / Restore listeners
  exportJsonBtn.addEventListener('click', exportJSON);
  importJsonBtn.addEventListener('click', () => {
    importJsonFileInput.click();
  });
  importJsonFileInput.addEventListener('change', handleJSONImport);
  
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
  
  const isLandscape = pdfOrientation === 'landscape';
  const pageWidth = isLandscape ? '297mm' : '210mm';
  const pageHeight = isLandscape ? '200mm' : '287mm';
  const blockSize = isLandscape ? 7 : 5;
  
  const printArea = document.createElement('div');
  printArea.style.width = pageWidth;
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
    
    // Chunk the room blocks into groups based on orientation limits (7 for landscape, 5 for portrait)
    const pageChunks = [];
    for (let i = 0; i < roomBlocks.length; i += blockSize) {
      pageChunks.push(roomBlocks.slice(i, i + blockSize));
    }
    
    // Render a separate A4 page for each chunk
    pageChunks.forEach((pageChunk, chunkIdx) => {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'pdf-page';
      pageDiv.dataset.roomName = roomName;
      pageDiv.dataset.chunkIdx = chunkIdx;
      pageDiv.style.width = pageWidth;
      pageDiv.style.height = pageHeight;
      pageDiv.style.padding = isLandscape ? '8mm 12mm' : '8mm 8mm';
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
      if (repeatPdfHeader || chunkIdx === 0) {
        const headerDiv = document.createElement('div');
        headerDiv.style.position = 'relative';
        headerDiv.style.display = 'flex';
        headerDiv.style.flexDirection = 'column';
        headerDiv.style.alignItems = (pdfHeaderAlign === 'left') ? 'flex-start' : (pdfHeaderAlign === 'right') ? 'flex-end' : 'center';
        headerDiv.style.paddingBottom = '6px';
        headerDiv.style.marginBottom = '10px';
        
        // Top Row: Logo + University & Examination Heading
        const topRowContainer = document.createElement('div');
        topRowContainer.style.display = 'flex';
        topRowContainer.style.flexDirection = (pdfHeaderAlign === 'right') ? 'row-reverse' : 'row';
        topRowContainer.style.alignItems = 'center';
        topRowContainer.style.justifyContent = (pdfHeaderAlign === 'left') ? 'flex-start' : (pdfHeaderAlign === 'right') ? 'flex-end' : 'center';
        topRowContainer.style.gap = '20px';
        topRowContainer.style.width = '100%';
        
        const logoBox = document.createElement('div');
        logoBox.style.width = `${pdfLogoSize}px`;
        logoBox.style.height = `${pdfLogoSize}px`;
        logoBox.style.display = 'flex';
        logoBox.style.alignItems = 'center';
        logoBox.style.justifyContent = 'center';
        logoBox.style.flexShrink = '0';
        
        if (logoBase64) {
          logoBox.innerHTML = `<img src="${logoBase64}" style="width:100%; height:100%; object-fit:contain;">`;
        } else {
          const svgSize = Math.round(pdfLogoSize * 0.66);
          logoBox.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#333333" stroke-width="2" style="width:${svgSize}px; height:${svgSize}px;"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2.5 3 6 3s6-1 6-3v-5"/></svg>`;
        }
        topRowContainer.appendChild(logoBox);
        
        const textBlock = document.createElement('div');
        textBlock.style.display = 'flex';
        textBlock.style.flexDirection = 'column';
        textBlock.style.alignItems = (pdfHeaderAlign === 'left') ? 'flex-start' : (pdfHeaderAlign === 'right') ? 'flex-end' : 'center';
        
        const univTitle = document.createElement('div');
        univTitle.style.fontSize = `${pdfFontSizeHeading + 10}px`;
        univTitle.style.fontWeight = 'bold';
        univTitle.style.textAlign = pdfHeaderAlign;
        univTitle.textContent = univName;
        textBlock.appendChild(univTitle);
        
        const examTitle = document.createElement('div');
        examTitle.style.fontSize = `${pdfFontSizeHeading + 2}px`;
        examTitle.style.fontWeight = 'bold';
        examTitle.style.textAlign = pdfHeaderAlign;
        examTitle.style.marginTop = '2px';
        examTitle.textContent = examName;
        textBlock.appendChild(examTitle);
        
        topRowContainer.appendChild(textBlock);
        headerDiv.appendChild(topRowContainer);
        
        // Bottom Row: Seating Title + Date info
        const bottomRowContainer = document.createElement('div');
        bottomRowContainer.style.display = 'flex';
        bottomRowContainer.style.width = '100%';
        bottomRowContainer.style.justifyContent = 'space-between';
        bottomRowContainer.style.fontSize = `${pdfFontSizeHeading + 2}px`;
        bottomRowContainer.style.fontWeight = 'bold';
        bottomRowContainer.style.marginTop = '8px';
        bottomRowContainer.innerHTML = `
          <span>ROOM-WISE SEATING ARRANGEMENT</span>
          <span>${dateSessionText}</span>
        `;
        headerDiv.appendChild(bottomRowContainer);
        
        pageDiv.appendChild(headerDiv);
      }
      
      // 2. Room Seating Table (matches Excel Grid structure)
      const table = document.createElement('table');
      const pageKey = `${roomName}::${chunkIdx}`;
      const isPageUniform = pageUniformColumns[pageKey] !== undefined ? pageUniformColumns[pageKey] : uniformPdfColumns;
      if (isPageUniform) {
        table.style.width = `${(pageChunk.length / blockSize) * 100}%`;
      } else {
        table.style.width = '100%';
      }
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
      roomCell.style.fontSize = `${pdfFontSizeHeading + 4}px`;
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
        cCell.style.fontSize = `${pdfFontSizeHeading + 2}px`;
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
          sCell.style.fontSize = `${pdfFontSizeHeading - 1}px`;
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
          slCell.style.fontSize = `${pdfFontSizeValue - 1}px`;
          slCell.style.padding = '4px 2px';
          slCell.style.wordWrap = 'break-word';
          slCell.style.whiteSpace = 'normal';
          
          const regCell = document.createElement('td');
          regCell.style.border = '1px solid #000000';
          regCell.style.textAlign = 'center';
          regCell.style.fontSize = `${pdfFontSizeValue}px`;
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
        coCell.style.fontSize = `${pdfFontSizeHeading}px`;
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
    printWrapper.style.width = (pdfOrientation === 'landscape') ? '297mm' : '210mm';
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
      jsPDF:        { unit: 'mm', format: 'a4', orientation: pdfOrientation },
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
  
  // Apply portrait layout sizing class if toggled
  if (pdfOrientation === 'portrait') {
    previewBody.classList.add('portrait-layout');
  } else {
    previewBody.classList.remove('portrait-layout');
  }
  
  // Compile print layout
  const printArea = buildPDFMarkup();
  
  // Transfer compiled pages into the modal preview panel
  const pages = Array.from(printArea.childNodes);
  const isLandscape = pdfOrientation === 'landscape';
  const mmWidth = isLandscape ? 297 : 210;
  
  pages.forEach(page => {
    const roomName = page.dataset.roomName;
    const chunkIdx = parseInt(page.dataset.chunkIdx, 10);
    const pageKey = `${roomName}::${chunkIdx}`;
    
    const sheetWrapper = document.createElement('div');
    sheetWrapper.className = 'pdf-preview-sheet-wrapper';
    sheetWrapper.style.width = `calc(${mmWidth}mm * var(--pdf-scale, 0.9))`;
    
    const controls = document.createElement('div');
    controls.className = 'pdf-page-controls';
    
    const label = document.createElement('span');
    label.className = 'pdf-page-label';
    label.textContent = `Room ${roomName} - Page ${chunkIdx + 1}`;
    controls.appendChild(label);
    
    const chkLabel = document.createElement('label');
    chkLabel.className = 'pdf-page-chk-label';
    
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.className = 'pdf-page-chk';
    const isPageUniform = pageUniformColumns[pageKey] !== undefined ? pageUniformColumns[pageKey] : uniformPdfColumns;
    chk.checked = isPageUniform;
    
    chk.addEventListener('change', (e) => {
      pageUniformColumns[pageKey] = e.target.checked;
      localStorage.setItem('pageUniformColumns', JSON.stringify(pageUniformColumns));
      showPDFPreview();
    });
    
    const chkText = document.createElement('span');
    chkText.textContent = 'Uniform Width';
    
    chkLabel.appendChild(chk);
    chkLabel.appendChild(chkText);
    controls.appendChild(chkLabel);
    sheetWrapper.appendChild(controls);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'pdf-page-container';
    const clone = page.cloneNode(true);
    wrapper.appendChild(clone);
    sheetWrapper.appendChild(wrapper);
    
    previewBody.appendChild(sheetWrapper);
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

// Import and restore complete project state from an uploaded Excel file
async function handleExcelImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async function(evt) {
    try {
      const buffer = evt.target.result;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const sheet = workbook.getWorksheet("Room Allotments") || workbook.getWorksheet(1) || workbook.worksheets[0];
      if (!sheet) {
        alert("No worksheet found in the uploaded Excel workbook.");
        return;
      }
      
      // Parse header settings
      const row1Val = sheet.getRow(1).getCell(1).value;
      const row2Val = sheet.getRow(2).getCell(1).value;
      
      let tempUniv = "";
      let tempExam = "";
      
      if (row1Val && typeof row1Val === 'string') tempUniv = row1Val.trim();
      if (row2Val && typeof row2Val === 'string') tempExam = row2Val.trim();
      
      // Extract date & session text from row 3 if present
      let row3DateCellVal = "";
      for (let c = 1; c <= 20; c++) {
        const val = sheet.getRow(3).getCell(c).value;
        if (val && typeof val === 'string' && val.includes("DATE:")) {
          row3DateCellVal = val;
          break;
        }
      }
      
      let tempDate = "";
      let tempSession = "";
      if (row3DateCellVal) {
        const dateMatch = row3DateCellVal.match(/DATE:\s*([\d-]+)/i);
        if (dateMatch) {
          const dParts = dateMatch[1].split('-');
          if (dParts.length === 3) {
            tempDate = `${dParts[2]}-${dParts[1]}-${dParts[0]}`;
          }
        }
        const sessionMatch = row3DateCellVal.match(/\((.*?)\)/);
        if (sessionMatch) {
          const rawSess = sessionMatch[1].toLowerCase();
          if (rawSess.includes("morning")) tempSession = "Morning";
          else if (rawSess.includes("afternoon")) tempSession = "Afternoon";
        }
      }
      
      // Parse logo image if embedded in sheet
      let tempLogo = "";
      if (sheet.getImages && sheet.getImages().length > 0) {
        try {
          const imgObj = sheet.getImages()[0];
          const media = workbook.model.media[imgObj.imageId];
          if (media && media.buffer) {
            // Convert buffer to Base64 manually
            let binary = "";
            const bytes = new Uint8Array(media.buffer);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            const mime = media.type === 'jpg' || media.type === 'jpeg' ? 'image/jpeg' : 'image/png';
            tempLogo = `data:${mime};base64,${base64}`;
          }
        } catch (imgErr) {
          console.error("Could not extract image from Excel file:", imgErr);
        }
      }
      
      // Scan rows to extract student allotment entries
      const newEntries = [];
      const tempRoomRowCounts = {};
      
      let currentRoomName = "";
      const rowCount = sheet.rowCount;
      
      for (let rIdx = 1; rIdx <= rowCount; rIdx++) {
        const row = sheet.getRow(rIdx);
        const cell1Val = row.getCell(1).value;
        
        if (cell1Val && typeof cell1Val === 'string' && cell1Val.startsWith("ROOM-")) {
          currentRoomName = cell1Val.substring(5).trim();
          
          const courseRow = sheet.getRow(rIdx + 1);
          const subjectRow = sheet.getRow(rIdx + 2);
          const subheaderRow = sheet.getRow(rIdx + 3);
          
          // Let's identify the course blocks in this room
          const blocks = [];
          let col = 1;
          while (col <= 100) {
            const courseVal = courseRow.getCell(col).value;
            if (courseVal) {
              let courseName = String(courseVal).trim();
              let timeStr = "";
              const timeMatch = courseName.match(/\((.*?)\)$/);
              if (timeMatch) {
                timeStr = timeMatch[1].trim();
                courseName = courseName.replace(/\s*\(.*?\)$/, "").trim();
              }
              
              const subjectVal = subjectRow.getCell(col).value || "";
              const subjectName = String(subjectVal).trim();
              
              let span = 1;
              let checkCol = col + 1;
              while (checkCol <= 100 && !courseRow.getCell(checkCol).value && subheaderRow.getCell(checkCol).value) {
                span++;
                checkCol++;
              }
              
              blocks.push({
                startCol: col,
                spanCount: span,
                course: courseName,
                time: timeStr || tempSession || "",
                subject: subjectName
              });
              col += span;
            } else {
              if (!subheaderRow.getCell(col).value) {
                break;
              }
              col++;
            }
          }
          
          // Count student rows in this room until we hit COUNT row
          let dataRowOffset = 4;
          let studentRowsInRoom = 0;
          while (rIdx + dataRowOffset <= rowCount) {
            const dataRow = sheet.getRow(rIdx + dataRowOffset);
            const val = dataRow.getCell(1).value;
            if (val && typeof val === 'string' && val.startsWith("COUNT -")) {
              break;
            }
            studentRowsInRoom++;
            dataRowOffset++;
          }
          
          if (currentRoomName) {
            tempRoomRowCounts[currentRoomName] = studentRowsInRoom;
          }
          
          // Extract student IDs
          for (let studentRowIdx = 0; studentRowIdx < studentRowsInRoom; studentRowIdx++) {
            const dataRow = sheet.getRow(rIdx + 4 + studentRowIdx);
            
            blocks.forEach(block => {
              const pairsCount = Math.floor(block.spanCount / 2);
              for (let p = 0; p < pairsCount; p++) {
                const regCol = block.startCol + (2 * p) + 1;
                const regVal = dataRow.getCell(regCol).value;
                if (regVal) {
                  newEntries.push({
                    room: currentRoomName,
                    time: block.time,
                    course: block.course,
                    subject: block.subject,
                    studentId: String(regVal).trim().toUpperCase()
                  });
                }
              }
            });
          }
          
          rIdx += dataRowOffset;
        }
      }
      
      if (newEntries.length === 0) {
        alert("Could not extract any student allotment entries from the Excel file. Please make sure the uploaded file is a valid Excel file downloaded from this application.");
        return;
      }
      
      if (window.confirm(`Successfully parsed ${newEntries.length} student entries across ${Object.keys(tempRoomRowCounts).length} rooms. Load this data? (This will replace your current entries)`)) {
        entries = newEntries;
        saveToStorage();
        
        roomRowCounts = tempRoomRowCounts;
        localStorage.setItem('roomRowCounts', JSON.stringify(roomRowCounts));
        
        if (tempUniv) {
          univName = tempUniv;
          localStorage.setItem('univName', univName);
          univNameInput.value = univName;
        }
        if (tempExam) {
          examName = tempExam;
          localStorage.setItem('examName', examName);
          examNameInput.value = examName;
        }
        if (tempDate) {
          examDate = tempDate;
          localStorage.setItem('examDate', examDate);
          examDateInput.value = examDate;
        }
        if (tempSession) {
          examSession = tempSession;
          localStorage.setItem('examSession', examSession);
          examSessionInput.value = examSession;
        }
        if (tempLogo) {
          logoBase64 = tempLogo;
          localStorage.setItem('logoBase64', logoBase64);
          fileNameLabel.textContent = "Logo restored from Excel";
        }
        
        render();
        alert("Allotment plan restored successfully!");
      }
      
    } catch (err) {
      console.error("Failed to parse Excel file", err);
      alert("Error parsing Excel file: " + err.message);
    } finally {
      importFileInput.value = "";
    }
  };
  reader.readAsArrayBuffer(file);
}

// Export complete current allotment state to a downloaded JSON file
function exportJSON() {
  if (entries.length === 0) {
    alert("No entries to export.");
    return;
  }
  const state = {
    univName,
    examName,
    examDate,
    examSession,
    logoBase64,
    uniformPdfColumns,
    repeatPdfHeader,
    pdfOrientation,
    pdfFontSizeHeading,
    pdfFontSizeValue,
    pdfLogoSize,
    pdfHeaderAlign,
    roomRowCounts,
    pageUniformColumns,
    entries
  };
  
  const formattedDate = formatDate(examDate);
  const filename = `${formattedDate ? `${formattedDate}-` : ''}${examSession ? `${examSession}-` : ''}room-allotment-backup.json`;
  
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", url);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(url);
}

// Import and restore complete current allotment state from an uploaded JSON file
function handleJSONImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = JSON.parse(evt.target.result);
      if (!data.entries) {
        alert("Invalid backup file: 'entries' array is missing.");
        return;
      }
      
      if (window.confirm(`Successfully read backup file with ${data.entries.length} student entries. Overwrite current workspace?`)) {
        // Apply state
        entries = data.entries || [];
        roomRowCounts = data.roomRowCounts || {};
        pageUniformColumns = data.pageUniformColumns || {};
        
        univName = data.univName || "UNIVERSITY NAME";
        examName = data.examName || "EXAMINATION NAME";
        examDate = data.examDate || "";
        examSession = data.examSession || "";
        logoBase64 = data.logoBase64 || "";
        
        uniformPdfColumns = data.uniformPdfColumns !== undefined ? data.uniformPdfColumns : false;
        repeatPdfHeader = data.repeatPdfHeader !== undefined ? data.repeatPdfHeader : true;
        pdfOrientation = data.pdfOrientation || "landscape";
        pdfFontSizeHeading = parseInt(data.pdfFontSizeHeading, 10) || 16;
        pdfFontSizeValue = parseInt(data.pdfFontSizeValue, 10) || 14;
        pdfLogoSize = parseInt(data.pdfLogoSize, 10) || 72;
        pdfHeaderAlign = data.pdfHeaderAlign || "center";
        
        // Persist all to localStorage
        localStorage.setItem('roomEntries', JSON.stringify(entries));
        localStorage.setItem('roomRowCounts', JSON.stringify(roomRowCounts));
        localStorage.setItem('pageUniformColumns', JSON.stringify(pageUniformColumns));
        
        localStorage.setItem('univName', univName);
        localStorage.setItem('examName', examName);
        localStorage.setItem('examDate', examDate);
        localStorage.setItem('examSession', examSession);
        localStorage.setItem('logoBase64', logoBase64);
        
        localStorage.setItem('uniformPdfColumns', uniformPdfColumns ? 'true' : 'false');
        localStorage.setItem('repeatPdfHeader', repeatPdfHeader ? 'true' : 'false');
        localStorage.setItem('pdfOrientation', pdfOrientation);
        localStorage.setItem('pdfFontSizeHeading', pdfFontSizeHeading);
        localStorage.setItem('pdfFontSizeValue', pdfFontSizeValue);
        localStorage.setItem('pdfLogoSize', pdfLogoSize);
        localStorage.setItem('pdfHeaderAlign', pdfHeaderAlign);
        
        // Sync UI input values
        univNameInput.value = univName;
        examNameInput.value = examName;
        examDateInput.value = examDate;
        examSessionInput.value = examSession;
        uniformColumnsInput.checked = uniformPdfColumns;
        repeatHeaderInput.checked = repeatPdfHeader;
        pdfFontSizeHeadingInput.value = pdfFontSizeHeading;
        pdfFontSizeValueInput.value = pdfFontSizeValue;
        pdfLogoSizeInput.value = pdfLogoSize;
        pdfHeaderAlignInput.value = pdfHeaderAlign;
        
        if (pdfOrientation === 'portrait') {
          document.getElementById('orientPortrait').checked = true;
        } else {
          document.getElementById('orientLandscape').checked = true;
        }
        
        if (logoBase64) {
          fileNameLabel.textContent = "Logo image loaded";
        } else {
          fileNameLabel.textContent = "No logo selected";
        }
        
        render();
        alert("Workspace restored from JSON backup successfully!");
      }
    } catch (err) {
      console.error("Failed to parse JSON backup file", err);
      alert("Error parsing JSON backup file: " + err.message);
    } finally {
      importJsonFileInput.value = "";
    }
  };
  reader.readAsText(file);
}

// Boot application
document.addEventListener('DOMContentLoaded', init);
