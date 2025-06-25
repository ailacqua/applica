chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "processJobPost") {
    const prompt = `Extract the following job info from the HTML snippet below: Job Title, Company Name, Location in City State format, Requisition ID, Date Posted; Return ONLY a JSON object with these fields. HTML snippet:\n\n${message.content}`;

    fetch("http://localhost:3000/groq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        const data = await res.json();
        sendResponse({ result: data.result });
      })
      .catch(err => {
        console.error("Groq fetch failed:", err);
        sendResponse({ error: err.message });
      });

    return true; // keep response channel open for async
  }

  // Forward extracted content to popup when received from content script
  if (message.action === "extractedContent") {
    chrome.runtime.sendMessage({
      action: "extractedContent",
      content: message.content
    });
  }
});
