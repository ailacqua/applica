chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "processJobPost") {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateString = formatter.format(new Date());

    const prompt = `Extract the following job info from the HTML snippet below: "position", "company", "location" in city, state abbreviation format, 
    "requisition_id", and "date_posted" in DD/MM/YYYY format. If needed, for reference, the current date is ${dateString}. Give response as a JSON.

    If the data is not available, have an empty string for that field. Ensure that all proper nouns are correctly capitalized. 
    
    HTML snippet:
    ${message.content}`;

    fetch("http://localhost:3000/extract", {
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
        console.error("LLM fetch failed:", err);
        sendResponse({ error: err.message });
      });

    return true; // keep response channel open for async
  }
});
