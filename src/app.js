/**
 * SahajForm - Dialect-to-Official-Form Translator
 * Premium Civic-Tech Single-Column Wizard Flow
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// State management
let currentStep = 1; // 1, 2, 'loading', 3
let currentResult = null;
let isEditing = false;
let recognition = null;
let isRecording = false;
let loadingInterval = null;

// Presets data with authentic Indian dialect phrases (NO EMOJIS, clean labels)
const PRESETS = [
  {
    type: 'Electricity Complaint',
    dialect: 'Hinglish / Bhojpuri-mix',
    label: 'Power Outage Grievance',
    text: 'Bhaiya hamare mohalle me 3 din se light gayab hai. Transformer se bahut zor se aawaz aayi thi dhuan nikla tha. Bacchon ki pariksha chal rahi hai, inverter bhi dead ho gaya. Line man ko bola to bolta hai mere paas saman nahi hai, koi sunwai nahi kar raha.'
  },
  {
    type: 'Ration Card',
    dialect: 'Rural Colloquial Hindi',
    label: 'Ration Dealer Quota Issue',
    text: 'Hamare gaon ka kotedar pichle do mahine se gehu aur chawal nahi de raha hai. Angootha lagwa leta hai machine me aur bolta hai sarwar down hai kal aana. Ration card me 5 logo ka naam hai par kuch nahi mila. Ham garib log bahut pareshan hain.'
  },
  {
    type: 'Water Supply',
    dialect: 'Colloquial Hindi',
    label: 'Contaminated Tap Water',
    text: 'Jal Nigam walon se request hai ki gali number 4 me pichle 10 din se nalka me se keeda aur kaala badbudar paani aa raha hai. Pipeline shayad nala ke paas toot gayi hai. Bimaari phail rahi hai, peene ka paani bahar se kharidna pad raha hai.'
  },
  {
    type: 'Police Complaint',
    dialect: 'Hinglish',
    label: 'Motorcycle Theft Complaint',
    text: 'Sir kal shaam ko kareeb 7 baje main Sector 18 market gaya tha sabzi lene. Maine apni Hero Splendor bike number UP-16-AB-4321 market ke bahar lock karke khadi ki thi. Aadha ghante baad aaya to bike wahan nahi thi. Aas paas cctv laga hai, kripya FIR darj karke dhoondhne me madad karein.'
  },
  {
    type: 'RTI Application',
    dialect: 'Informal Hindi',
    label: 'Road Works Tender RTI',
    text: 'Hamare ward number 12 me sadak banne ka kaam 6 mahine se ruka hua hai. Pata karna hai ki is sadak ka tender kitne rupaye me aur kis thekedaar ko diya gaya tha, kitna budget pass hua aur kitna kaam abhi tak hua hai. RTI ke tehat jankari chahiye.'
  },
  {
    type: 'School Admission',
    dialect: 'Hinglish',
    label: 'EWS Admission Allotment',
    text: 'Sir mere bete ka naam EWS category ke tehat lottery me select hua tha XYZ Public School ke liye. Par school wale principal milne nahi de rahe aur bol rahe hain ki seat full ho gayi hai jabki allotment letter hamare paas hai. Kripya admission dilwane ka order karein.'
  }
];

// DOM Elements
const formTypeSelect = document.getElementById('form-type');
const problemInput = document.getElementById('problem-input');
const charCount = document.getElementById('char-count');
const btnGenerate = document.getElementById('btn-generate');
const btnClear = document.getElementById('btn-clear');
const btnMic = document.getElementById('btn-mic');
const presetsContainer = document.getElementById('presets-container');

// Step Containers
const step1Card = document.getElementById('step-1-card');
const step2Card = document.getElementById('step-2-card');
const loadingCard = document.getElementById('loading-card');
const step3Card = document.getElementById('step-3-card');
const stepperProgressFill = document.getElementById('stepper-progress-fill');

// Stepper Dots & Labels
const stepDot1 = document.getElementById('step-dot-1');
const stepDot2 = document.getElementById('step-dot-2');
const stepDot3 = document.getElementById('step-dot-3');
const stepLabel1 = document.getElementById('step-label-1');
const stepLabel2 = document.getElementById('step-label-2');
const stepLabel3 = document.getElementById('step-label-3');

const stepNav1 = document.getElementById('step-nav-1');
const stepNav2 = document.getElementById('step-nav-2');
const stepNav3 = document.getElementById('step-nav-3');

const btnGotoStep2 = document.getElementById('btn-goto-step-2');
const btnBackToStep1 = document.getElementById('btn-back-to-step-1');
const btnBackToStep2 = document.getElementById('btn-back-to-step-2');
const btnRestart = document.getElementById('btn-restart');
const btnBottomRestart = document.getElementById('btn-bottom-restart');

// Loading state elements
const loadingStepText = document.getElementById('loading-step-text');
const loadingProgressBar = document.getElementById('loading-progress-bar');

// Results elements
const detectedLanguageBadge = document.getElementById('detected-language-badge');
const grievanceSummaryText = document.getElementById('grievance-summary-text');
const missingChecklistContainer = document.getElementById('missing-checklist-container');
const missingCountBadge = document.getElementById('missing-count-badge');

const letterEnglishBody = document.getElementById('letter-english-body');
const letterHindiBody = document.getElementById('letter-hindi-body');

const btnCopy = document.getElementById('btn-copy');
const btnCopyEnglish = document.getElementById('btn-copy-english');
const btnCopyHindi = document.getElementById('btn-copy-hindi');
const btnDownloadPdf = document.getElementById('btn-download-pdf');
const btnPrint = document.getElementById('btn-print');
const btnToggleEdit = document.getElementById('btn-toggle-edit');

// Modal Elements
const placeholderModal = document.getElementById('placeholder-modal');
const modalPlaceholderList = document.getElementById('modal-placeholder-list');
const btnApplyPlaceholders = document.getElementById('btn-apply-placeholders');
const btnCloseModal = document.getElementById('btn-close-modal');

// ============================================================================
// Wizard Step Transitions
// ============================================================================
function goToStep(step) {
  currentStep = step;

  // Hide all step cards
  [step1Card, step2Card, loadingCard, step3Card].forEach((card) => {
    if (card) card.classList.remove('active');
  });

  // Reset Stepper indicators
  [stepDot1, stepDot2, stepDot3].forEach((dot) => {
    dot.className = 'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm step-indicator-upcoming';
  });
  if (stepLabel1) stepLabel1.className = 'text-xs font-semibold text-[#9ca3af]';
  if (stepLabel2) stepLabel2.className = 'text-xs font-semibold text-[#9ca3af]';
  if (stepLabel3) stepLabel3.className = 'text-xs font-semibold text-[#9ca3af]';

  if (step === 1) {
    if (step1Card) step1Card.classList.add('active');
    stepDot1.className = 'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm step-indicator-active';
    if (stepLabel1) stepLabel1.className = 'text-xs font-semibold text-white';
    if (stepperProgressFill) stepperProgressFill.style.width = '0%';
  } else if (step === 2) {
    if (step2Card) step2Card.classList.add('active');
    stepDot1.className = 'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm step-indicator-completed';
    stepDot2.className = 'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm step-indicator-active';
    if (stepLabel2) stepLabel2.className = 'text-xs font-semibold text-white';
    if (stepperProgressFill) stepperProgressFill.style.width = '50%';
  } else if (step === 'loading') {
    if (loadingCard) loadingCard.classList.add('active');
    stepDot1.className = 'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm step-indicator-completed';
    stepDot2.className = 'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm step-indicator-active';
    if (stepperProgressFill) stepperProgressFill.style.width = '75%';
  } else if (step === 3) {
    if (step3Card) step3Card.classList.add('active');
    stepDot1.className = 'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm step-indicator-completed';
    stepDot2.className = 'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm step-indicator-completed';
    stepDot3.className = 'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm step-indicator-active';
    if (stepLabel3) stepLabel3.className = 'text-xs font-semibold text-white';
    if (stepperProgressFill) stepperProgressFill.style.width = '100%';
  }

  // Smooth scroll up to top of active card
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// Category Tiles Setup (Step 1)
// ============================================================================
function setupCategoryTiles() {
  const tiles = document.querySelectorAll('.category-tile');
  tiles.forEach((tile) => {
    tile.addEventListener('click', () => {
      // Remove selected from all
      tiles.forEach((t) => {
        t.classList.remove('selected');
        const dot = t.querySelector('.checkmark-dot span');
        if (dot) dot.className = 'w-2 h-2 rounded-full bg-transparent';
      });

      // Select clicked
      tile.classList.add('selected');
      const activeDot = tile.querySelector('.checkmark-dot span');
      if (activeDot) activeDot.className = 'w-2 h-2 rounded-full bg-[#f5a623]';

      const val = tile.getAttribute('data-value');
      if (formTypeSelect && val) {
        formTypeSelect.value = val;
      }
    });
  });
}

function selectCategoryTileByValue(val) {
  const tiles = document.querySelectorAll('.category-tile');
  tiles.forEach((tile) => {
    const tileVal = tile.getAttribute('data-value');
    if (tileVal === val) {
      tile.classList.add('selected');
      const dot = tile.querySelector('.checkmark-dot span');
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-[#f5a623]';
    } else {
      tile.classList.remove('selected');
      const dot = tile.querySelector('.checkmark-dot span');
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-transparent';
    }
  });
  if (formTypeSelect) {
    formTypeSelect.value = val;
  }
}

// ============================================================================
// Render Dialect Presets (Step 2 - No Emojis, clean line SVG)
// ============================================================================
function renderPresets() {
  if (!presetsContainer) return;
  presetsContainer.innerHTML = '';
  PRESETS.forEach((preset) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'preset-pill';
    btn.innerHTML = `
      <svg class="w-3.5 h-3.5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span>${preset.label}</span>
    `;
    btn.title = `Dialect: ${preset.dialect} (${preset.type})`;
    btn.addEventListener('click', () => {
      selectCategoryTileByValue(preset.type);
      problemInput.value = preset.text;
      updateCharCount();
      problemInput.focus();
      showToast(`Applied preset: ${preset.label}`, 'info');
    });
    presetsContainer.appendChild(btn);
  });
}

// Update Character Count
function updateCharCount() {
  if (!problemInput || !charCount) return;
  const count = problemInput.value.length;
  charCount.textContent = `${count} characters entered`;
}

// ============================================================================
// Speech Recognition (Web Speech API)
// ============================================================================
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (btnMic) {
      btnMic.title = 'Speech recognition is not supported in this browser';
      btnMic.classList.add('opacity-40', 'cursor-not-allowed');
    }
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'hi-IN'; // Default to Hindi / Hinglish

  recognition.onstart = () => {
    isRecording = true;
    btnMic.classList.add('mic-recording');
    btnMic.innerHTML = `
      <svg class="w-4 h-4 text-[#f5a623] animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="4"></circle>
      </svg>
      <span>Listening...</span>
    `;
    showToast('Microphone listening in Hindi/Hinglish. Speak naturally.', 'info');
  };

  recognition.onresult = (event) => {
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      const currentVal = problemInput.value.trim();
      problemInput.value = currentVal ? `${currentVal} ${finalTranscript}` : finalTranscript;
      updateCharCount();
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    stopRecording();
    showToast(`Microphone error: ${event.error}`, 'error');
  };

  recognition.onend = () => {
    stopRecording();
  };
}

function stopRecording() {
  if (recognition && isRecording) {
    recognition.stop();
  }
  isRecording = false;
  if (btnMic) {
    btnMic.classList.remove('mic-recording');
    btnMic.innerHTML = `
      <svg class="w-4 h-4 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
      </svg>
      <span>Voice Input (Hindi / Hinglish)</span>
    `;
  }
}

function toggleRecording() {
  if (!recognition) {
    showToast('Speech recognition is not supported in this browser.', 'error');
    return;
  }
  if (isRecording) {
    stopRecording();
    showToast('Voice recording stopped.', 'info');
  } else {
    try {
      recognition.start();
    } catch (e) {
      console.warn('Recognition start error', e);
    }
  }
}

// ============================================================================
// Loading Animation (Rotating Status Text & Clean Glowing Progress Bar)
// ============================================================================
function startLoadingAnimation() {
  goToStep('loading');

  const steps = [
    'Analyzing dialect nuances and citizen grievance context...',
    'Structuring respectful formal English administrative application...',
    'Composing शुद्ध कार्यालयीन हिंदी आवेदन पत्र...',
    'Auditing official letterheads and flagging missing reference fields...'
  ];

  let stepIndex = 0;
  loadingStepText.textContent = steps[0];
  loadingProgressBar.style.width = '25%';

  loadingInterval = setInterval(() => {
    stepIndex++;
    if (stepIndex < steps.length) {
      loadingStepText.textContent = steps[stepIndex];
      const percent = Math.min(25 * (stepIndex + 1), 90);
      loadingProgressBar.style.width = `${percent}%`;
    }
  }, 1300);
}

function stopLoadingAnimation() {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
  loadingProgressBar.style.width = '100%';
}

// ============================================================================
// Format and Highlight Placeholders [In Brackets] & Bilingual Unified Mapping
// ============================================================================
const PLACEHOLDER_SYNONYM_GROUPS = [
  // Full Name
  ['name', 'full name', 'your full name', 'applicant name', 'naam', 'poora naam', 'nam', 'नाम', 'पूरा नाम', 'आपका पूरा नाम', 'आवेदक का नाम', 'प्रार्थी का नाम', 'हस्ताक्षरकर्ता'],
  // Complete Address
  ['address', 'complete address', 'your complete address', 'residential address', 'pata', 'poora pata', 'पता', 'पूरा पता', 'आपका पूरा पता', 'निवासी', 'निवास पता'],
  // Contact Number
  ['contact', 'contact number', 'phone', 'phone number', 'mobile', 'mobile number', 'sampark', 'durabhash', 'दूरभाष', 'संपर्क', 'संपर्क संख्या', 'मोबाइल', 'मोबाइल नंबर', 'फोन नंबर'],
  // Consumer / Meter / Connection / CA Number
  ['consumer number', 'consumer/ca number', 'consumer id', 'ca number', 'meter number', 'connection number', 'bijli consumer', 'उपभोक्ता संख्या', 'मीटर संख्या', 'खाता संख्या', 'सीए संख्या', 'कंज्यूमर नंबर'],
  // Date of incident
  ['date', 'date of incident', 'incident date', 'incident time', 'outage date', 'dinank', 'tarikh', 'दिनांक', 'तारीख', 'घटना की तारीख'],
  // Ration card
  ['ration card number', 'ration card no', 'ration card', 'rashan card', 'राशन कार्ड संख्या', 'राशन कार्ड नंबर'],
  // Police / FIR / GD
  ['fir', 'fir number', 'fir reference', 'gd number', 'complaint number', 'शिकायत संख्या', 'प्रथम सूचना रिपोर्ट संख्या'],
  // Authority / Designation
  ['designation', 'authority designation', 'पदनाम', 'अधिकारी का पदनाम']
];

function getAllSynonyms(key) {
  const clean = key.replace(/[\[\]]/g, '').trim().toLowerCase();
  const matched = [clean];
  for (const group of PLACEHOLDER_SYNONYM_GROUPS) {
    const inGroup = group.some(item => {
      const lower = item.toLowerCase();
      return lower === clean || clean.includes(lower) || lower.includes(clean);
    });
    if (inGroup) {
      group.forEach(g => {
        const lowerG = g.toLowerCase();
        if (!matched.includes(lowerG)) {
          matched.push(lowerG);
        }
      });
    }
  }
  return matched;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPlaceholders(text) {
  if (!text) return '';
  return text.replace(/\[([^\]]+)\]/g, (match, p1) => {
    const clean = p1.trim();
    return `<span class="placeholder-highlight cursor-pointer" data-placeholder="${clean}" title="Click to fill: ${clean}">[${clean}]</span>`;
  });
}

// Attach click listener on any inline placeholder inside letter text
function attachPlaceholderClickHandlers() {
  const elements = document.querySelectorAll('.placeholder-highlight');
  elements.forEach((el) => {
    el.addEventListener('click', () => {
      const placeholderKey = el.getAttribute('data-placeholder');
      if (!placeholderKey) return;
      focusChecklistOrPrompt(placeholderKey);
    });
  });
}

// Seamless jump to checklist row or prompt modal
function focusChecklistOrPrompt(rawKey) {
  const cleanKey = rawKey.replace(/[\[\]]/g, '').trim();
  const synonyms = getAllSynonyms(cleanKey);
  const allKeys = [cleanKey.toLowerCase(), ...synonyms.map(s => s.toLowerCase())];

  let matchedRow = null;
  if (missingChecklistContainer) {
    const rows = missingChecklistContainer.querySelectorAll('.checklist-row');
    for (const row of rows) {
      const rowKey = (row.getAttribute('data-key') || '').replace(/[\[\]]/g, '').trim().toLowerCase();
      if (allKeys.some(k => k === rowKey || rowKey.includes(k) || k.includes(rowKey))) {
        matchedRow = row;
        break;
      }
    }
  }

  if (matchedRow) {
    matchedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = matchedRow.querySelector('.checklist-inline-input');
    if (input) {
      matchedRow.classList.add('ring-2', 'ring-[#f5a623]');
      setTimeout(() => {
        input.focus();
        matchedRow.classList.remove('ring-2', 'ring-[#f5a623]');
      }, 400);
    }
  } else {
    openSinglePlaceholderModal(cleanKey);
  }
}

function openSinglePlaceholderModal(cleanKey) {
  if (!placeholderModal || !modalPlaceholderList) return;
  modalPlaceholderList.innerHTML = `
    <div class="flex flex-col gap-2">
      <label class="text-xs font-semibold text-white">Value for [${cleanKey}]:</label>
      <input type="text" id="single-modal-input" placeholder="Enter ${cleanKey}..." class="civic-input text-xs py-2 px-3 font-sans" />
    </div>
  `;
  placeholderModal.classList.remove('hidden');
  const input = document.getElementById('single-modal-input');
  if (input) input.focus();

  if (btnApplyPlaceholders) {
    btnApplyPlaceholders.onclick = () => {
      const val = input ? input.value.trim() : '';
      if (val) {
        replacePlaceholderInDocument(cleanKey, val);
        placeholderModal.classList.add('hidden');
      } else {
        showToast('Please enter a value', 'info');
      }
    };
  }
}

// Replace a specific placeholder text across current letters (Both English & Hindi in real time)
function replacePlaceholderInDocument(placeholderName, replacement) {
  if (!currentResult || !placeholderName) return;

  const rawClean = placeholderName.replace(/[\[\]]/g, '').trim();
  const trimmedVal = replacement.trim();
  if (!rawClean || !trimmedVal) return;

  const synonyms = getAllSynonyms(rawClean);

  // 1. Replace in both English and Hindi letters
  synonyms.forEach((syn) => {
    // Exact bracket match [syn] or [ syn ] (case-insensitive)
    const exactRegex = new RegExp(`\\[\\s*${escapeRegExp(syn)}\\s*\\]`, 'gi');
    currentResult.formal_english = currentResult.formal_english.replace(exactRegex, trimmedVal);
    currentResult.formal_hindi = currentResult.formal_hindi.replace(exactRegex, trimmedVal);

    // Contextual bracket match like [Your Full Name] or [आपका पूरा नाम]
    const phraseRegex = new RegExp(`\\[[^\\]]*?${escapeRegExp(syn)}[^\\]]*?\\]`, 'gi');
    currentResult.formal_english = currentResult.formal_english.replace(phraseRegex, trimmedVal);
    currentResult.formal_hindi = currentResult.formal_hindi.replace(phraseRegex, trimmedVal);
  });

  // Track resolved state
  if (!currentResult.resolved_placeholders) {
    currentResult.resolved_placeholders = {};
  }
  currentResult.resolved_placeholders[rawClean] = trimmedVal;

  // 2. Re-render both letter DOM bodies
  letterEnglishBody.innerHTML = formatPlaceholders(currentResult.formal_english);
  letterHindiBody.innerHTML = formatPlaceholders(currentResult.formal_hindi);
  attachPlaceholderClickHandlers();

  // 3. Mark the checklist item as resolved
  markChecklistItemResolved(rawClean, trimmedVal, synonyms);

  showToast(`Updated [${rawClean}] in both letters`, 'success');
}

function markChecklistItemResolved(key, val, synonyms = []) {
  if (!missingChecklistContainer) return;

  const allKeys = [key.toLowerCase(), ...synonyms.map(s => s.toLowerCase())];
  const rows = missingChecklistContainer.querySelectorAll('.checklist-row');

  rows.forEach((row) => {
    const rowKey = (row.getAttribute('data-key') || '').replace(/[\[\]]/g, '').trim().toLowerCase();
    const isMatch = allKeys.some(k => k === rowKey || rowKey.includes(k) || k.includes(rowKey));

    if (isMatch) {
      row.classList.add('checklist-row-resolved');
      row.classList.remove('border-white/[0.08]');
      row.classList.add('border-[#22c55e]/40', 'bg-[#091a13]');

      const input = row.querySelector('.checklist-inline-input');
      if (input) {
        input.value = val;
        input.disabled = true;
        input.classList.add('opacity-75');
      }

      const applyBtn = row.querySelector('.btn-inline-apply');
      if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.className = 'btn-inline-apply min-h-[38px] px-3.5 py-1 text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1.5 text-[#22c55e] bg-[#142e20] border border-[#166534] cursor-default';
        applyBtn.innerHTML = `
          <svg class="w-3.5 h-3.5 text-[#22c55e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Resolved</span>
        `;
      }

      const keyLabel = row.querySelector('.checklist-key-label');
      if (keyLabel) {
        keyLabel.classList.add('line-through', 'text-[#9ca3af]');
      }

      const iconContainer = row.querySelector('.checklist-icon-container');
      if (iconContainer) {
        iconContainer.innerHTML = `
          <svg class="w-4 h-4 text-[#22c55e] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
      }
    }
  });

  updateMissingCountBadge();
}

function updateMissingCountBadge() {
  if (!missingChecklistContainer || !missingCountBadge) return;
  const rows = missingChecklistContainer.querySelectorAll('.checklist-row');
  const resolvedRows = missingChecklistContainer.querySelectorAll('.checklist-row.checklist-row-resolved');
  const total = rows.length;
  const resolved = resolvedRows.length;
  const remaining = total - resolved;

  if (total === 0 || remaining <= 0) {
    missingCountBadge.textContent = 'All details completed ✓';
    missingCountBadge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-[#092618] text-[#86efac] border border-[#166534]';
  } else {
    missingCountBadge.textContent = `${remaining} of ${total} remaining`;
    missingCountBadge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-[#1a2336] text-[#f5a623] border border-[#f5a623]/30';
  }
}

// ============================================================================
// Missing Information Checklist Card (Inline Editable Fields)
// ============================================================================
function renderMissingChecklist(missingList) {
  if (!missingChecklistContainer) return;
  missingChecklistContainer.innerHTML = '';

  if (!missingList || missingList.length === 0) {
    missingCountBadge.textContent = 'All details complete';
    missingCountBadge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-[#092618] text-[#86efac] border border-[#166534]';
    missingChecklistContainer.innerHTML = `
      <div class="p-4 rounded-xl bg-[#0d121c] border border-white/[0.08] flex items-center gap-3 text-xs text-[#9ca3af]">
        <svg class="w-4 h-4 text-[#22c55e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>All essential citizen administrative fields have been provided in your description.</span>
      </div>
    `;
    return;
  }

  missingCountBadge.textContent = `${missingList.length} items to complete`;
  missingCountBadge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-[#1a2336] text-[#f5a623] border border-[#f5a623]/30';

  missingList.forEach((rawItem) => {
    const item = rawItem.replace(/[\[\]]/g, '').trim();
    const row = document.createElement('div');
    row.className = 'checklist-row p-4 rounded-xl bg-[#0d121c] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200';
    row.setAttribute('data-key', item);
    row.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-[220px]">
        <div class="checklist-icon-container">
          <svg class="w-4 h-4 text-[#f5a623] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <span class="checklist-key-label text-xs font-bold text-white font-mono">[${item}]</span>
      </div>
      <div class="flex items-center gap-2 flex-1">
        <input 
          type="text" 
          placeholder="Enter ${item}..." 
          data-key="${item}" 
          class="checklist-inline-input civic-input text-xs py-2 px-3 flex-1 font-sans" 
        />
        <button type="button" class="btn-inline-apply btn-primary-amber min-h-[38px] px-3.5 py-1 text-xs font-bold rounded-lg shrink-0">
          Apply
        </button>
      </div>
    `;

    const applyBtn = row.querySelector('.btn-inline-apply');
    const input = row.querySelector('.checklist-inline-input');

    const handleApply = () => {
      const val = input.value.trim();
      if (val) {
        replacePlaceholderInDocument(item, val);
      } else {
        showToast(`Please enter a value for [${item}]`, 'info');
        input.focus();
      }
    };

    applyBtn.addEventListener('click', handleApply);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleApply();
      }
    });

    missingChecklistContainer.appendChild(row);
  });
}

// ============================================================================
// Display Generated Result (Step 3)
// ============================================================================
function displayResult(data) {
  currentResult = { ...data };

  // Set detected language badge
  detectedLanguageBadge.textContent = data.detected_language || 'Hindi / Regional Dialect';

  // Set grievance summary
  grievanceSummaryText.textContent = data.summary || 'Formal Administrative Grievance Application';

  // Render Missing Details Checklist
  renderMissingChecklist(data.missing_info || []);

  // Format and insert letters
  const formattedEnglish = formatPlaceholders(data.formal_english);
  const formattedHindi = formatPlaceholders(data.formal_hindi);

  letterEnglishBody.innerHTML = formattedEnglish;
  letterHindiBody.innerHTML = formattedHindi;

  // Add click listeners to highlighted placeholders
  attachPlaceholderClickHandlers();

  // Navigate to Step 3
  goToStep(3);

  showToast('Official application letters generated successfully!', 'success');
}

// ============================================================================
// Copy Functions
// ============================================================================
async function copyTextToClipboard(text, label = 'Letter') {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`, 'success');
  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast(`Copied ${label} to clipboard!`, 'success');
  }
}

// ============================================================================
// Download Letters as PDF using html2canvas & jsPDF (A4 Formatted)
// Supports English, Hindi, or Both Combined in 1 Multi-Page PDF
// ============================================================================
async function generateLetterCanvas(title, letterText, isHindi = false) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px';
  container.style.minHeight = '1123px';
  container.style.background = '#ffffff';
  container.style.color = '#111827';
  container.style.padding = '56px 64px';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = isHindi ? "'Noto Sans Devanagari', 'Segoe UI', sans-serif" : "'Lora', Georgia, serif";
  container.style.fontSize = '14px';
  container.style.lineHeight = '1.8';

  const dateStr = new Date().toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const categoryName = formTypeSelect ? formTypeSelect.value : 'Administrative Application';

  container.innerHTML = `
    <div style="border-bottom: 2px solid #1e293b; padding-bottom: 14px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #475569; text-transform: uppercase;">
          ${isHindi ? 'कार्यालयीन औपचारिक नागरिक प्रार्थना पत्र' : 'OFFICIAL ADMINISTRATIVE GRIEVANCE PETITION'}
        </div>
        <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px;">
          ${title}
        </div>
      </div>
      <div style="text-align: right; font-size: 11px; color: #64748b;">
        <div>${dateStr}</div>
        <div style="margin-top: 2px; font-weight: 600;">${categoryName}</div>
      </div>
    </div>
    <div style="white-space: pre-wrap; font-size: 13.5px; line-height: 1.85; color: #1e293b;">
      ${escapeHtml(letterText)}
    </div>
    <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8;">
      <div>SahajForm Citizen Draft • Physical Signature & Enclosures Required</div>
      <div>Government Grievance Redressal Protocol</div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    return canvas;
  } finally {
    document.body.removeChild(container);
  }
}

async function downloadEnglishPdf() {
  if (!currentResult) {
    showToast('Please generate official letters first.', 'info');
    return;
  }
  showToast('Generating English PDF...', 'info');
  try {
    const text = letterEnglishBody.innerText || currentResult.formal_english;
    const canvas = await generateLetterCanvas('Official Application Letter', text, false);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297);
    const filename = `SahajForm_English_${Date.now()}.pdf`;
    doc.save(filename);
    showToast(`Downloaded: ${filename}`, 'success');
  } catch (err) {
    console.error('Error generating English PDF:', err);
    showToast('Failed to generate PDF, opening print preview', 'error');
    window.print();
  }
}

async function downloadHindiPdf() {
  if (!currentResult) {
    showToast('Please generate official letters first.', 'info');
    return;
  }
  showToast('Generating Hindi PDF...', 'info');
  try {
    const text = letterHindiBody.innerText || currentResult.formal_hindi;
    const canvas = await generateLetterCanvas('औपचारिक हिंदी आवेदन पत्र', text, true);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297);
    const filename = `SahajForm_Hindi_${Date.now()}.pdf`;
    doc.save(filename);
    showToast(`Downloaded: ${filename}`, 'success');
  } catch (err) {
    console.error('Error generating Hindi PDF:', err);
    showToast('Failed to generate Hindi PDF, opening print preview', 'error');
    window.print();
  }
}

async function downloadBothPdf() {
  if (!currentResult) {
    showToast('Please generate official letters first.', 'info');
    return;
  }
  showToast('Generating combined 2-page PDF (English + Hindi)...', 'info');
  try {
    const textEn = letterEnglishBody.innerText || currentResult.formal_english;
    const textHi = letterHindiBody.innerText || currentResult.formal_hindi;

    const [canvasEn, canvasHi] = await Promise.all([
      generateLetterCanvas('Official Grievance Petition (English)', textEn, false),
      generateLetterCanvas('औपचारिक नागरिक प्रार्थना पत्र (Hindi)', textHi, true),
    ]);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.addImage(canvasEn.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297);
    doc.addPage();
    doc.addImage(canvasHi.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297);
    const filename = `SahajForm_Combined_${Date.now()}.pdf`;
    doc.save(filename);
    showToast(`Downloaded: ${filename}`, 'success');
  } catch (err) {
    console.error('Error generating Combined PDF:', err);
    showToast('Failed to generate combined PDF, opening print preview', 'error');
    window.print();
  }
}

// ============================================================================
// In-place editable mode toggle
// ============================================================================
function toggleEditMode() {
  isEditing = !isEditing;
  const letterBlocks = [letterEnglishBody, letterHindiBody];
  
  letterBlocks.forEach((block) => {
    if (block) {
      block.contentEditable = isEditing ? 'true' : 'false';
      if (isEditing) {
        block.classList.add('ring-2', 'ring-[#f5a623]', 'rounded-lg', 'p-3', 'bg-[#0e1422]');
      } else {
        block.classList.remove('ring-2', 'ring-[#f5a623]', 'rounded-lg', 'p-3', 'bg-[#0e1422]');
      }
    }
  });

  if (isEditing) {
    btnToggleEdit.innerHTML = `
      <svg class="w-4 h-4 text-[#22c55e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>Done Editing</span>
    `;
    btnToggleEdit.classList.add('bg-[#14261d]', 'border-[#166534]');
    showToast('Edit mode active. You can now type directly into both letters.', 'info');
  } else {
    btnToggleEdit.innerHTML = `
      <svg class="w-4 h-4 text-[#9ca3af]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
      </svg>
      <span>Edit Letter</span>
    `;
    btnToggleEdit.classList.remove('bg-[#14261d]', 'border-[#166534]');
    if (currentResult) {
      currentResult.formal_english = letterEnglishBody.innerText;
      currentResult.formal_hindi = letterHindiBody.innerText;
    }
    showToast('Changes saved to letters.', 'success');
  }
}

// ============================================================================
// Toast Notification Helper (Single subtle success-green, calm neutral info)
// ============================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : 'toast-info'}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg class="w-4 h-4 text-[#22c55e] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg class="w-4 h-4 text-[#f87171] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
  } else {
    iconSvg = '<svg class="w-4 h-4 text-[#f5a623] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3500);
}

// ============================================================================
// Main Generate API Call
// ============================================================================
async function handleGenerate() {
  const description = problemInput.value.trim();
  const formType = formTypeSelect ? formTypeSelect.value : 'General Administrative';

  if (!description) {
    showToast('Please type or speak your problem description first.', 'error');
    problemInput.focus();
    return;
  }

  if (description.length < 5) {
    showToast('Please provide a slightly more descriptive explanation.', 'error');
    return;
  }

  btnGenerate.disabled = true;
  startLoadingAnimation();

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formType,
        description,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server returned status ${response.status}`);
    }

    stopLoadingAnimation();
    displayResult(data);
  } catch (err) {
    console.error('Generation error:', err);
    stopLoadingAnimation();
    goToStep(2);
    showToast(err.message || 'Error communicating with translation engine. Please try again.', 'error');
  } finally {
    btnGenerate.disabled = false;
  }
}

// ============================================================================
// Event Listeners Setup
// ============================================================================
function setupEventListeners() {
  // Input tracking
  if (problemInput) {
    problemInput.addEventListener('input', updateCharCount);
    problemInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      problemInput.value = '';
      updateCharCount();
      problemInput.focus();
      showToast('Grievance text cleared', 'info');
    });
  }

  if (btnMic) {
    btnMic.addEventListener('click', toggleRecording);
  }

  // Stepper navigation clicks
  if (stepNav1) stepNav1.addEventListener('click', () => goToStep(1));
  if (stepNav2) stepNav2.addEventListener('click', () => goToStep(2));
  if (stepNav3) {
    stepNav3.addEventListener('click', () => {
      if (currentResult) goToStep(3);
      else showToast('Please generate official letters first.', 'info');
    });
  }

  // Wizard flow step transition buttons
  if (btnGotoStep2) {
    btnGotoStep2.addEventListener('click', () => {
      goToStep(2);
      if (problemInput) problemInput.focus();
    });
  }

  if (btnBackToStep1) {
    btnBackToStep1.addEventListener('click', () => goToStep(1));
  }

  if (btnBackToStep2) {
    btnBackToStep2.addEventListener('click', () => goToStep(2));
  }

  const handleRestart = () => {
    problemInput.value = '';
    updateCharCount();
    currentResult = null;
    goToStep(1);
    showToast('Ready for new grievance application.', 'info');
  };

  if (btnRestart) btnRestart.addEventListener('click', handleRestart);
  if (btnBottomRestart) btnBottomRestart.addEventListener('click', handleRestart);

  // Primary generate button
  if (btnGenerate) {
    btnGenerate.addEventListener('click', handleGenerate);
  }

  // Action buttons on step 3
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      if (!currentResult) return;
      const combined = `--- OFFICIAL APPLICATION (ENGLISH) ---\n\n${letterEnglishBody.innerText}\n\n--- औपचारिक प्रार्थना पत्र (HINDI) ---\n\n${letterHindiBody.innerText}`;
      copyTextToClipboard(combined, 'both official letters');
    });
  }

  if (btnCopyEnglish) {
    btnCopyEnglish.addEventListener('click', () => {
      if (!currentResult) return;
      copyTextToClipboard(letterEnglishBody.innerText, 'English letter');
    });
  }

  if (btnCopyHindi) {
    btnCopyHindi.addEventListener('click', () => {
      if (!currentResult) return;
      copyTextToClipboard(letterHindiBody.innerText, 'Hindi letter');
    });
  }

  // Download Dropdown & Action Buttons
  const downloadMenu = document.getElementById('download-menu');
  const btnDownloadEnglish = document.getElementById('btn-download-english');
  const btnDownloadHindi = document.getElementById('btn-download-hindi');
  const btnDownloadBoth = document.getElementById('btn-download-both');
  const downloadContainer = document.getElementById('download-dropdown-container');

  if (btnDownloadPdf && downloadMenu) {
    btnDownloadPdf.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = downloadMenu.classList.contains('hidden');
      if (isHidden) {
        downloadMenu.classList.remove('hidden');
        btnDownloadPdf.setAttribute('aria-expanded', 'true');
      } else {
        downloadMenu.classList.add('hidden');
        btnDownloadPdf.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (btnDownloadEnglish && downloadMenu) {
    btnDownloadEnglish.addEventListener('click', () => {
      downloadMenu.classList.add('hidden');
      if (btnDownloadPdf) btnDownloadPdf.setAttribute('aria-expanded', 'false');
      downloadEnglishPdf();
    });
  }

  if (btnDownloadHindi && downloadMenu) {
    btnDownloadHindi.addEventListener('click', () => {
      downloadMenu.classList.add('hidden');
      if (btnDownloadPdf) btnDownloadPdf.setAttribute('aria-expanded', 'false');
      downloadHindiPdf();
    });
  }

  if (btnDownloadBoth && downloadMenu) {
    btnDownloadBoth.addEventListener('click', () => {
      downloadMenu.classList.add('hidden');
      if (btnDownloadPdf) btnDownloadPdf.setAttribute('aria-expanded', 'false');
      downloadBothPdf();
    });
  }

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (downloadMenu && !downloadMenu.classList.contains('hidden')) {
      if (!downloadContainer || !downloadContainer.contains(e.target)) {
        downloadMenu.classList.add('hidden');
        if (btnDownloadPdf) btnDownloadPdf.setAttribute('aria-expanded', 'false');
      }
    }
  });

  if (btnPrint) {
    btnPrint.addEventListener('click', () => window.print());
  }

  if (btnToggleEdit) {
    btnToggleEdit.addEventListener('click', toggleEditMode);
  }

  // Modal controls
  if (btnCloseModal && placeholderModal) {
    btnCloseModal.addEventListener('click', () => placeholderModal.classList.add('hidden'));
    placeholderModal.addEventListener('click', (e) => {
      if (e.target === placeholderModal) {
        placeholderModal.classList.add('hidden');
      }
    });
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  setupCategoryTiles();
  renderPresets();
  updateCharCount();
  setupEventListeners();
  initSpeechRecognition();
  goToStep(1);
});
