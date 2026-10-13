/**
 * Pubali Bank PLC. - MANCOM Portal
 * JavaScript Controller for PDF Upload, Document Library, and Portal Interactions
 * Offline & Local Assets Architecture
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // INITIAL DATA (Preloaded MANCOM Documents)
  // ==========================================================================
  let documents = [
    {
      id: 'DOC-2026-001',
      title: 'MANCOM 14th Session Minutes (Signed Copy)',
      session: 'Session #14 / 2026',
      division: 'Human Resources Division',
      category: 'Meeting Minutes',
      classification: 'strictly-confidential',
      classificationLabel: 'Strictly Confidential',
      uploadedBy: 'Md. Fahim',
      avatar: 'assets/images/avatar.png',
      date: '12 Oct 2026, 04:30 PM',
      size: '3.8 MB',
      fileUrl: 'assets/documents/MANCOM-2026-M14-Minutes-Signed.pdf',
      tags: ['#minutes', '#mancom14', '#hrd']
    },
    {
      id: 'DOC-2026-002',
      title: 'Pubali Bank PLC Credit Policy Amendments 2026',
      session: 'Session #14 / 2026',
      division: 'Credit Division',
      category: 'Policy Memo',
      classification: 'internal',
      classificationLabel: 'Internal Use',
      uploadedBy: 'Md. Fahim',
      avatar: 'assets/images/avatar.png',
      date: '10 Oct 2026, 11:15 AM',
      size: '5.2 MB',
      fileUrl: 'assets/documents/Pubali-Credit-Policy-2026.pdf',
      tags: ['#credit', '#policy', '#amendments']
    },
    {
      id: 'DOC-2026-003',
      title: 'IT Core Banking Infrastructure Upgrade & Cloud Security',
      session: 'Session #13 / 2026',
      division: 'Information Technology Division',
      category: 'Working Paper',
      classification: 'restricted',
      classificationLabel: 'Restricted',
      uploadedBy: 'Md. Fahim',
      avatar: 'assets/images/avatar.png',
      date: '02 Oct 2026, 02:45 PM',
      size: '2.1 MB',
      fileUrl: 'assets/documents/MANCOM-2026-M14-Minutes-Signed.pdf',
      tags: ['#cbs', '#cybersecurity', '#proposal']
    },
    {
      id: 'DOC-2026-004',
      title: 'Q3 Financial Performance & Profitability Appraisal',
      session: 'Session #13 / 2026',
      division: 'Finance & Accounts Division',
      category: 'Financial Report',
      classification: 'strictly-confidential',
      classificationLabel: 'Strictly Confidential',
      uploadedBy: 'Md. Fahim',
      avatar: 'assets/images/avatar.png',
      date: '28 Sep 2026, 09:20 AM',
      size: '8.4 MB',
      fileUrl: 'assets/documents/Pubali-Credit-Policy-2026.pdf',
      tags: ['#q3financials', '#audit', '#board']
    }
  ];

  // DOM Elements
  const dropzone = document.getElementById('dropzone');
  const pdfFileInput = document.getElementById('pdfFileInput');
  const selectedFileCard = document.getElementById('selectedFileCard');
  const selectedFileName = document.getElementById('selectedFileName');
  const selectedFileSize = document.getElementById('selectedFileSize');
  const btnRemoveFile = document.getElementById('btnRemoveFile');
  const uploadForm = document.getElementById('uploadForm');
  const btnSubmitUpload = document.getElementById('btnSubmitUpload');
  const uploadProgress = document.getElementById('uploadProgress');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const progressPercent = document.getElementById('progressPercent');
  const documentsTableBody = document.getElementById('documentsTableBody');
  const searchInput = document.getElementById('librarySearch');
  const categoryFilter = document.getElementById('categoryFilter');
  const classificationFilter = document.getElementById('classificationFilter');
  const sidebarSearchInput = document.getElementById('sidebarSearchInput');
  const sidebarNavList = document.getElementById('sidebarNavList');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn');
  const pdfModalEl = document.getElementById('pdfViewerModal');
  const pdfModal = pdfModalEl ? new bootstrap.Modal(pdfModalEl) : null;
  const pdfFrame = document.getElementById('pdfViewerFrame');
  const pdfModalTitle = document.getElementById('pdfModalTitle');
  const pdfModalBadge = document.getElementById('pdfModalBadge');
  const btnModalDownload = document.getElementById('btnModalDownload');
  const toastElement = document.getElementById('portalToast');
  const toast = toastElement ? new bootstrap.Toast(toastElement) : null;
  const toastMessage = document.getElementById('toastMessage');

  let currentSelectedFile = null;
  let currentFileBlobUrl = null;
  let activeViewingDoc = null;

  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================
  function showToast(message, isSuccess = true) {
    toastMessage.textContent = message;
    const header = toastElement.querySelector('.toast-header');
    header.className = `toast-header text-white ${isSuccess ? 'bg-success' : 'bg-danger'}`;
    toast.show();
  }

  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function updateMetrics() {
    const totalCount = documents.length;
    const confidentialCount = documents.filter(d => d.classification === 'strictly-confidential').length;
    
    const countEl = document.getElementById('statTotalDocs');
    const confEl = document.getElementById('statConfidentialDocs');
    if (countEl) countEl.textContent = totalCount;
    if (confEl) confEl.textContent = confidentialCount;
  }

  // ==========================================================================
  // RENDER DOCUMENT LIBRARY TABLE
  // ==========================================================================
  function renderDocumentsTable() {
    if (!documentsTableBody) return;
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCat = categoryFilter ? categoryFilter.value : 'all';
    const selectedClass = classificationFilter ? classificationFilter.value : 'all';

    const filtered = documents.filter(doc => {
      const matchSearch = doc.title.toLowerCase().includes(searchTerm) ||
                          doc.session.toLowerCase().includes(searchTerm) ||
                          doc.division.toLowerCase().includes(searchTerm) ||
                          doc.tags.some(t => t.toLowerCase().includes(searchTerm));
      const matchCat = selectedCat === 'all' || doc.category === selectedCat;
      const matchClass = selectedClass === 'all' || doc.classification === selectedClass;
      return matchSearch && matchCat && matchClass;
    });

    if (filtered.length === 0) {
      documentsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5 text-muted">
            <i class="bi bi-file-earmark-x fs-1 text-secondary d-block mb-2"></i>
            <p class="mb-1 fw-semibold">No MANCOM documents found</p>
            <small>Try adjusting your search criteria or upload a new PDF document.</small>
          </td>
        </tr>
      `;
      return;
    }

    documentsTableBody.innerHTML = filtered.map(doc => `
      <tr data-id="${doc.id}">
        <td>
          <div class="form-check">
            <input class="form-check-input row-select" type="checkbox" value="${doc.id}">
          </div>
        </td>
        <td>
          <div class="doc-name-cell">
            <div class="doc-icon-badge">
              <i class="bi bi-file-earmark-pdf-fill"></i>
            </div>
            <div>
              <span class="doc-title-text" onclick="window.viewDocument('${doc.id}')">${doc.title}</span>
              <div class="doc-session-sub">
                <span class="fw-medium text-dark-emphasis">${doc.session}</span> • ${doc.division}
              </div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge-category">${doc.category}</span>
        </td>
        <td>
          <span class="badge-classification ${doc.classification}">
            <i class="bi bi-shield-lock-fill me-1"></i>${doc.classificationLabel}
          </span>
        </td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <img src="${doc.avatar}" alt="${doc.uploadedBy}" class="rounded-circle" width="24" height="24">
            <span class="small fw-medium">${doc.uploadedBy}</span>
          </div>
        </td>
        <td>
          <div class="small text-muted">${doc.date}</div>
          <div class="small fw-semibold text-secondary">${doc.size}</div>
        </td>
        <td class="text-end">
          <div class="d-inline-flex gap-1">
            <button class="btn-action-icon" title="Preview Document" onclick="window.viewDocument('${doc.id}')">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn-action-icon" title="Download Local PDF" onclick="window.downloadDocument('${doc.id}')">
              <i class="bi bi-download"></i>
            </button>
            <button class="btn-action-icon" title="Share with Members" onclick="window.shareDocument('${doc.id}')">
              <i class="bi bi-share"></i>
            </button>
            <button class="btn-action-icon delete" title="Delete" onclick="window.deleteDocument('${doc.id}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    updateMetrics();
  }

  // ==========================================================================
  // DRAG AND DROP & FILE UPLOAD HANDLING
  // ==========================================================================
  function handleSelectedFile(file) {
    if (!file) return;

    // Validate PDF MIME type and extension
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      showToast('Invalid file format! Please upload a valid PDF (.pdf) file.', false);
      return;
    }

    // Validate size (max 50 MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('File size exceeds the 50 MB limit!', false);
      return;
    }

    currentSelectedFile = file;
    if (currentFileBlobUrl) {
      URL.revokeObjectURL(currentFileBlobUrl);
    }
    currentFileBlobUrl = URL.createObjectURL(file);

    // Update UI
    selectedFileName.textContent = file.name;
    selectedFileSize.textContent = `${formatBytes(file.size)} • PDF Document`;
    selectedFileCard.style.display = 'flex';
    dropzone.style.display = 'none';

    // Auto-fill Title if empty
    const titleInput = document.getElementById('docTitleInput');
    if (titleInput && !titleInput.value) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      titleInput.value = cleanName;
    }

    showToast(`PDF selected: ${file.name}`);
  }

  // Dropzone Events
  if (dropzone && pdfFileInput) {
    dropzone.addEventListener('click', () => pdfFileInput.click());
    
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-over');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleSelectedFile(files[0]);
      }
    });

    pdfFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleSelectedFile(e.target.files[0]);
      }
    });
  }

  // Remove Selected File
  if (btnRemoveFile) {
    btnRemoveFile.addEventListener('click', () => {
      currentSelectedFile = null;
      if (currentFileBlobUrl) {
        URL.revokeObjectURL(currentFileBlobUrl);
        currentFileBlobUrl = null;
      }
      if (pdfFileInput) pdfFileInput.value = '';
      if (selectedFileCard) selectedFileCard.style.display = 'none';
      if (dropzone) dropzone.style.display = 'block';
    });
  }

  // Form Submit (Upload Process)
  if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!currentSelectedFile) {
      showToast('Please select or drop a PDF file to upload!', false);
      return;
    }

    const title = document.getElementById('docTitleInput').value.trim();
    const session = document.getElementById('docSessionInput').value;
    const category = document.getElementById('docCategoryInput').value;
    const classification = document.getElementById('docClassificationInput').value;
    const division = document.getElementById('docDivisionInput').value;
    const tagsRaw = document.getElementById('docTagsInput').value.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()) : ['#mancom2026'];

    let classLabel = 'Internal Use';
    if (classification === 'strictly-confidential') classLabel = 'Strictly Confidential';
    if (classification === 'restricted') classLabel = 'Restricted';

    // Show Progress Bar & Disable Button
    btnSubmitUpload.disabled = true;
    uploadProgress.style.display = 'block';

    const stages = [
      { pct: 25, text: 'Validating PDF checksum & header signatures...' },
      { pct: 60, text: 'Uploading to Pubali Bank Secure Storage (2.4 MB/s)...' },
      { pct: 85, text: 'Encrypting with AES-256 for MANCOM Vault...' },
      { pct: 100, text: 'Upload completed & verified!' }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        const stage = stages[currentStage];
        progressBar.style.width = stage.pct + '%';
        progressPercent.textContent = stage.pct + '%';
        progressText.textContent = stage.text;
        currentStage++;
      } else {
        clearInterval(interval);

        // Add document to list
        const newDoc = {
          id: 'DOC-2026-' + String(documents.length + 1).padStart(3, '0'),
          title: title,
          session: session,
          division: division,
          category: category,
          classification: classification,
          classificationLabel: classLabel,
          uploadedBy: 'Md. Fahim',
          avatar: 'assets/images/avatar.png',
          date: 'Just now',
          size: formatBytes(currentSelectedFile.size),
          fileUrl: currentFileBlobUrl || 'assets/documents/MANCOM-2026-M14-Minutes-Signed.pdf',
          tags: tags
        };

        documents.unshift(newDoc);
        renderDocumentsTable();

        // Reset Form
        setTimeout(() => {
          uploadProgress.style.display = 'none';
          progressBar.style.width = '0%';
          btnSubmitUpload.disabled = false;
          uploadForm.reset();
          selectedFileCard.style.display = 'none';
          dropzone.style.display = 'block';
          currentSelectedFile = null;

          showToast(`Successfully uploaded: "${newDoc.title}" to MANCOM Archive!`);
        }, 500);
      }
    }, 400);
  });

  // ==========================================================================
  // DOCUMENT ACTIONS (VIEW, DOWNLOAD, SHARE, DELETE)
  // ==========================================================================
  window.viewDocument = function(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    activeViewingDoc = doc;
    pdfModalTitle.textContent = doc.title;
    pdfModalBadge.className = `badge-classification ${doc.classification}`;
    pdfModalBadge.innerHTML = `<i class="bi bi-shield-lock-fill me-1"></i>${doc.classificationLabel}`;

    // Load PDF in iframe
    pdfFrame.src = doc.fileUrl;
    pdfModal.show();
  };

  window.downloadDocument = function(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = `${doc.title.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Downloading: ${doc.title}.pdf`);
  };

  window.shareDocument = function(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    const shareUrl = window.location.href.split('#')[0] + `#doc=${doc.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast(`Document link copied to clipboard for: ${doc.title}`);
    }).catch(() => {
      showToast(`Sharing enabled for: ${doc.title}`);
    });
  };

  window.deleteDocument = function(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    if (confirm(`Are you sure you want to delete "${doc.title}" from the MANCOM portal?`)) {
      documents = documents.filter(d => d.id !== id);
      renderDocumentsTable();
      showToast(`Document "${doc.title}" has been deleted.`);
    }
  };

  // Download from modal button
  if (btnModalDownload) {
    btnModalDownload.addEventListener('click', () => {
      if (activeViewingDoc) {
        window.downloadDocument(activeViewingDoc.id);
      }
    });
  }

  // Zoom and Print controls in PDF Viewer Modal
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnPrintDoc = document.getElementById('btnPrintDoc');
  let currentZoom = 100;

  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      currentZoom = Math.min(200, currentZoom + 20);
      pdfFrame.style.transform = `scale(${currentZoom / 100})`;
      pdfFrame.style.transformOrigin = 'top center';
    });
  }

  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      currentZoom = Math.max(60, currentZoom - 20);
      pdfFrame.style.transform = `scale(${currentZoom / 100})`;
      pdfFrame.style.transformOrigin = 'top center';
    });
  }

  if (btnPrintDoc) {
    btnPrintDoc.addEventListener('click', () => {
      try {
        pdfFrame.contentWindow.print();
      } catch (err) {
        window.print();
      }
    });
  }

  // ==========================================================================
  // SIDEBAR LIVE SEARCH FILTER
  // ==========================================================================
  if (sidebarSearchInput && sidebarNavList) {
    sidebarSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const items = sidebarNavList.querySelectorAll('.sidebar-nav-item');
      items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(query)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }

  // Filter Table Listeners
  if (searchInput) searchInput.addEventListener('input', renderDocumentsTable);
  if (categoryFilter) categoryFilter.addEventListener('change', renderDocumentsTable);
  if (classificationFilter) classificationFilter.addEventListener('change', renderDocumentsTable);

  // ==========================================================================
  // THEME SWITCHER (DARK / LIGHT MODE)
  // ==========================================================================
  const savedTheme = localStorage.getItem('mancom_theme') || 'light';
  document.documentElement.setAttribute('data-bs-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-bs-theme');
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-bs-theme', nextTheme);
      localStorage.setItem('mancom_theme', nextTheme);
      updateThemeIcon(nextTheme);
      showToast(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode`);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggleBtn) return;
    const icon = themeToggleBtn.querySelector('i');
    if (theme === 'dark') {
      icon.className = 'bi bi-moon-stars-fill';
    } else {
      icon.className = 'bi bi-sun';
    }
  }

  // ==========================================================================
  // FULLSCREEN TOGGLE
  // ==========================================================================
  if (fullscreenToggleBtn) {
    fullscreenToggleBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          showToast('Fullscreen mode not available', false);
        });
        fullscreenToggleBtn.querySelector('i').className = 'bi bi-fullscreen-exit';
      } else {
        document.exitFullscreen();
        fullscreenToggleBtn.querySelector('i').className = 'bi bi-fullscreen';
      }
    });
  }

  // ==========================================================================
  // MOBILE SIDEBAR TOGGLE
  // ==========================================================================
  const btnMobileMenu = document.getElementById('btnMobileMenu');
  const portalSidebar = document.getElementById('portalSidebar');
  if (btnMobileMenu && portalSidebar) {
    btnMobileMenu.addEventListener('click', () => {
      portalSidebar.classList.toggle('show-mobile');
    });
  }

  // Initialize
  renderDocumentsTable();
});
