let extractedContent = null;

document.getElementById('getHtmlBtn').addEventListener('click', () => {
  // Inject content script into the current active tab and get the HTML snippet
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        function: () => {
          const jobDetailsElement = document.querySelector('[data-automation-id="job-posting-details"]');
          return jobDetailsElement ? jobDetailsElement.innerHTML : null;
        }
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
        document.getElementById('output').textContent = JSON.stringify(json, null, 2);
      } catch {
        document.getElementById('output').textContent = response.result;
      }
    }
  });
});
