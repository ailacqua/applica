let extractedContent = null;
let extractedUrl = null;

const parseBtn = document.getElementById('parseBtn');
const saveBtn = document.getElementById('saveBtn');
const output = document.getElementById('output');
const statusSelect = document.getElementById('status');
const dateAppliedInput = document.getElementById('date_applied');

saveBtn.disabled = true;

function showBanner(message, type) {
  const iconSvg = type === 'success' 
    ? `<svg class="alert-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
    : `<svg class="alert-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;

  output.innerHTML = `
    <div class="alert-body">
      ${iconSvg}
      <span class="alert-message">${message}</span>
    </div>
    <button class="alert-close" id="closeAlertBtn" aria-label="Close">&times;</button>
  `;
  output.className = type;
  
  document.getElementById('closeAlertBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    hideBanner();
  });
}

function hideBanner() {
  output.className = '';
  output.innerHTML = '';
}

function formatTodayDate() {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
}

function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function updateDateAppliedField() {
  if (statusSelect.value === 'APPLIED') {
    dateAppliedInput.value = formatTodayDate();
    dateAppliedInput.readOnly = true;
  } else if (statusSelect.value === 'TO APPLY') {
    dateAppliedInput.value = '';
    dateAppliedInput.readOnly = false;
  }
}

function populateForm(data) {
  setInputValue('company', data.company);
  setInputValue('position', data.position);
  setInputValue('location', data.location);
  setInputValue('url', extractedUrl);
  setInputValue('requisition_id', data.requisition_id);
  setInputValue('date_posted', data.date_posted);

  // Handle date_applied depending on status
  if (statusSelect.value === 'APPLIED') {
    dateAppliedInput.value = formatTodayDate();
    dateAppliedInput.readOnly = true;
  } else {
    dateAppliedInput.value = '';
    dateAppliedInput.readOnly = false;
  }

  saveBtn.disabled = false;
}

parseBtn.addEventListener('click', () => {
  hideBanner();
  saveBtn.disabled = true;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    extractedUrl = tabs[0]?.url || '';

    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        files: ['extraction.js']
      },
      (results) => {
        if (chrome.runtime.lastError || !results || !results[0].result) {
          extractedContent = null;
          showBanner("Failed to extract job details from this page.", "error");
          return;
        }
        extractedContent = results[0].result;

        chrome.runtime.sendMessage({ action: "processJobPost", content: extractedContent }, (response) => {
          if (response.error) {
            showBanner("Error: " + response.error, "error");
            return;
          }
          try {
            const json = JSON.parse(response.result);
            populateForm(json);
          } catch {
            showBanner("Failed to parse response from server.", "error");
          }
        });
      }
    );
  });
});

saveBtn.addEventListener('click', () => {
  hideBanner();

  const dataToSave = {
    company: getInputValue('company'),
    position: getInputValue('position'),
    location: getInputValue('location'),
    url: getInputValue('url'),
    requisition_id: getInputValue('requisition_id'),
    date_applied: getInputValue('date_applied'),
    date_posted: getInputValue('date_posted'),
    status: getInputValue('status')
  };

  fetch('http://localhost:3000/send-to-sheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataToSave)
  })
    .then(res => res.json())
    .then(json => {
      showBanner("Saved successfully!", "success");
    })
    .catch(err => {
      showBanner("Error saving data: " + err.message, "error");
    });
});

// Hook up Status dropdown behavior
statusSelect.addEventListener('change', updateDateAppliedField);

// Initialize on page load
updateDateAppliedField();