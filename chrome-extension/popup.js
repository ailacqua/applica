let extractedContent = null;
let extractedUrl = null;
let currentDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());

const SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbz9ldlr4cWbh1gpC3Y4nFP95d_cqSPB1Xg0TmHnqeSUIM21cx-KqoyzDHfiN1xYRQ3L/exec';

function postToSheet(data) {
  fetch('http://localhost:3000/send-to-sheet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(json => console.log('Server response:', json))
  .catch(err => console.error('Error posting to sheet:', err));
}

document.getElementById('getHtmlBtn').addEventListener('click', () => {
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
          document.getElementById('output').textContent = "Failed to extract job details from this page.";
          document.getElementById('sendBtn').disabled = true;
          return;
        }
        extractedContent = results[0].result;
        document.getElementById('output').textContent = extractedContent;
        document.getElementById('sendBtn').disabled = false;
      }
    );
  });
});

document.getElementById('sendBtn').addEventListener('click', () => {
  if (!extractedContent) {
    document.getElementById('output').textContent = "No job content to parse. Please click 'Get Job HTML' first.";
    return;
  }

  chrome.runtime.sendMessage({ action: "processJobPost", content: extractedContent }, (response) => {
    if (response.error) {
      document.getElementById('output').textContent = "Error: " + response.error;
    } else {
      try {
        const json = JSON.parse(response.result);
        json.url = extractedUrl;
        json.date_applied = currentDate;

        document.getElementById('output').textContent = JSON.stringify(json, null, 2);

        postToSheet(json);

      } catch {
        document.getElementById('output').textContent = response.result;
      }
    }
  });
});
