let extractedContent = null;
let extractedUrl = null;

const parseBtn = document.getElementById('parseBtn');
const saveBtn = document.getElementById('saveBtn');
const output = document.getElementById('output');
const statusSelect = document.getElementById('status');
const dateAppliedInput = document.getElementById('date_applied');

saveBtn.disabled = true;

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
  } else if (statusSelect.value === 'TODO') {
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
  output.textContent = '';
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
          output.textContent = "Failed to extract job details from this page.";
          return;
        }
        extractedContent = results[0].result;

        chrome.runtime.sendMessage({ action: "processJobPost", content: extractedContent }, (response) => {
          if (response.error) {
            output.textContent = "Error: " + response.error;
            return;
          }
          try {
            const json = JSON.parse(response.result);
            populateForm(json);
          } catch {
            output.textContent = "Failed to parse response from server.";
          }
        });
      }
    );
  });
});

saveBtn.addEventListener('click', () => {
  output.textContent = '';

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
      output.style.color = 'green';
      output.textContent = 'Saved successfully!';
    })
    .catch(err => {
      output.style.color = 'red';
      output.textContent = 'Error saving data: ' + err.message;
    });
});

// Hook up Status dropdown behavior
statusSelect.addEventListener('change', updateDateAppliedField);

// Initialize on page load
updateDateAppliedField();