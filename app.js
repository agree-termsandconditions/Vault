/**
 * Intranet File Vault - Client Application Engine
 * Cyber-Aurora Glassmorphism + Interactive Logic
 */

document.addEventListener('DOMContentLoaded', () => {

  // ------------------------------------------------------------------
  // 1. THEME SWITCHER (Light / Dark Mode)
  // ------------------------------------------------------------------
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const themeLabel = document.getElementById('themeLabel');

  const savedTheme = localStorage.getItem('vault_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeUI(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('vault_theme', next);
      updateThemeUI(next);
    });
  }

  function updateThemeUI(theme) {
    if (themeIcon) themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    if (themeLabel) themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
  }

  // ------------------------------------------------------------------
  // 2. VIEW SWITCHER (List vs Tile View)
  // ------------------------------------------------------------------
  const listViewBtn = document.getElementById('listViewBtn');
  const tileViewBtn = document.getElementById('tileViewBtn');
  const listViewContainer = document.getElementById('listViewContainer');
  const tileViewContainer = document.getElementById('tileViewContainer');

  if (listViewBtn && tileViewBtn) {
    listViewBtn.addEventListener('click', () => {
      listViewContainer.classList.remove('hidden');
      tileViewContainer.classList.add('hidden');
      listViewBtn.className = 'px-3 py-1 rounded text-xs font-medium text-white bg-blue-600 shadow-xs flex items-center gap-1';
      tileViewBtn.className = 'px-3 py-1 rounded text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1';
    });

    tileViewBtn.addEventListener('click', () => {
      listViewContainer.classList.add('hidden');
      tileViewContainer.classList.remove('hidden');
      tileViewBtn.className = 'px-3 py-1 rounded text-xs font-medium text-white bg-blue-600 shadow-xs flex items-center gap-1';
      listViewBtn.className = 'px-3 py-1 rounded text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1';
    });
  }

  // ------------------------------------------------------------------
  // 3. DRAG & DROP BATCH FILE UPLOAD & PIN COMPLEXITY
  // ------------------------------------------------------------------
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const selectedFilesContainer = document.getElementById('selectedFilesContainer');
  const fileQueueList = document.getElementById('fileQueueList');
  const pinInput = document.getElementById('pinInput');
  const pinStrengthText = document.getElementById('pinStrengthText');
  const pinStrengthBar = document.getElementById('pinStrengthBar');
  const submitUploadBtn = document.getElementById('submitUploadBtn');

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-cyan-500', 'bg-slate-800/80');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-cyan-500', 'bg-slate-800/80');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-cyan-500', 'bg-slate-800/80');
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelection();
      }
    });

    fileInput.addEventListener('change', handleFileSelection);
  }

  function handleFileSelection() {
    const files = Array.from(fileInput.files).slice(0, 5);
    if (!files.length) {
      selectedFilesContainer.classList.add('hidden');
      validateUploadForm();
      return;
    }

    selectedFilesContainer.classList.remove('hidden');
    fileQueueList.innerHTML = '';

    files.forEach(f => {
      const item = document.createElement('div');
      item.className = 'flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded border border-slate-800';
      item.innerHTML = `
        <span class="truncate max-w-[200px] font-medium text-slate-200">📄 ${f.name}</span>
        <span class="text-[10px] text-slate-400">${(f.size / 1024 / 1024).toFixed(2)} MB</span>
      `;
      fileQueueList.appendChild(item);
    });

    validateUploadForm();
  }

  // Real-time PIN Strength Evaluator
  if (pinInput) {
    pinInput.addEventListener('input', () => {
      const pin = pinInput.value;
      const weakBlacklist = ['123456', '987654', '000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999', '012345', '543210', '654321'];

      if (pin.length < 6) {
        pinStrengthText.textContent = 'Too Short';
        pinStrengthText.className = 'font-semibold text-slate-500';
        pinStrengthBar.style.width = '20%';
        pinStrengthBar.className = 'pin-meter-bar bg-slate-600';
      } else if (weakBlacklist.includes(pin)) {
        pinStrengthText.textContent = 'Blacklisted Weak Pattern!';
        pinStrengthText.className = 'font-semibold text-rose-400';
        pinStrengthBar.style.width = '40%';
        pinStrengthBar.className = 'pin-meter-bar bg-rose-500';
      } else {
        const hasNum = /\d/.test(pin);
        const hasLetter = /[a-zA-Z]/.test(pin);
        if (hasNum && hasLetter) {
          pinStrengthText.textContent = 'Strong (Alpha-Numeric)';
          pinStrengthText.className = 'font-semibold text-emerald-400';
          pinStrengthBar.style.width = '100%';
          pinStrengthBar.className = 'pin-meter-bar bg-emerald-500';
        } else {
          pinStrengthText.textContent = 'Fair (Numeric Only)';
          pinStrengthText.className = 'font-semibold text-amber-400';
          pinStrengthBar.style.width = '70%';
          pinStrengthBar.className = 'pin-meter-bar bg-amber-500';
        }
      }

      validateUploadForm();
    });
  }

  function validateUploadForm() {
    const hasFiles = fileInput.files && fileInput.files.length > 0;
    const pin = pinInput ? pinInput.value : '000000';
    const weakBlacklist = ['123456', '987654', '000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999', '012345', '543210', '654321'];

    const pinValid = !pinInput || (pin.length === 6 && !weakBlacklist.includes(pin));

    if (hasFiles && pinValid) {
      submitUploadBtn.disabled = false;
      submitUploadBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
      submitUploadBtn.disabled = true;
      submitUploadBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
  }

  // ------------------------------------------------------------------
  // 4. GLARE CARD MOUSE POSITION TRACKING
  // ------------------------------------------------------------------
  document.querySelectorAll('.glare-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

});

// ------------------------------------------------------------------
// GLOBAL MODAL & ANIMATED DELETION FUNCTIONS
// ------------------------------------------------------------------
function openAccessModal(fileId, fileName, mimeType) {
  document.getElementById('modalFileId').value = fileId;
  document.getElementById('modalFileName').textContent = `Decrypt: ${fileName}`;
  document.getElementById('accessModal').classList.remove('hidden');
  document.getElementById('accessModal').classList.add('flex');
}

function closeAccessModal() {
  document.getElementById('accessModal').classList.add('hidden');
  document.getElementById('accessModal').classList.remove('flex');
}

function triggerAnimatedDelete(fileId) {
  const pin = prompt('Enter 6-digit file PIN to delete file:');
  if (!pin) return;

  const row = document.getElementById(`file-row-${fileId}`);
  const tile = document.getElementById(`file-tile-${fileId}`);

  fetch('delete.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-x-form-urlencoded' },
    body: `file_id=${fileId}&pin=${encodeURIComponent(pin)}`
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      if (row) row.classList.add('row-deleting');
      if (tile) tile.classList.add('row-deleting');
      setTimeout(() => {
        if (row) row.remove();
        if (tile) tile.remove();
      }, 600);
    } else {
      alert(data.error || 'Incorrect PIN. Contact System Administrator.');
    }
  })
  .catch(() => alert('Deletion failed. Check backend log.'));
}
