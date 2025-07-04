let extractedContent = null;
let extractedUrl = null;

const dateApplied = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());

const parseBtn = document.getElementById('parseBtn');
const saveBtn = document.getElementById('saveBtn');
const output = document.getElementById('output');

// Disable Save initially
saveBtn.disabled = true;

// Helper to set input values safely
function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
}

// Helper to get input values
function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

// Populate the form inputs with parsed data
function populateForm(data) {
  setInputValue('company', data.company);
  setInputValue('position', data.position);
  setInputValue('location', data.location);
  setInputValue('url', extractedUrl);
  setInputValue('requisition_id', data.requisition_id);
  setInputValue('date_applied', dateApplied);
  setInputValue('date_posted', data.date_posted);
  saveBtn.disabled = false;
}

// When Parse Posting clicked
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

        // Send to backend to parse using Gemini API
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

// When Save clicked, gather form data and send to backend or Google Sheet
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

  // You can choose whether to send to your local backend or directly to Google Sheets
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
