chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "processJobPost") {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateString = formatter.format(new Date());

    const prompt = `Extract the following job info from the HTML snippet below: Job Title, Company Name, Location in City State format, Requisition ID, Date Posted; Return ONLY a JSON object with these fields:
    {
    company: name of the company (string)
    position: name of the position being applied to (string)
    location: location or locations of job in form City, State (string)
    date_posted: date the position was posted in YYYY-MM-DD format. For reference, the current date is ${dateString}.
    requisition_id: requisition id or id associated with the job posting (string)
    }

    If the data is not available, have an empty string for that field. Do not include any explanation or markdown. Just return the JSON object.
    
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
        console.error("Groq fetch failed:", err);
        sendResponse({ error: err.message });
      });

    return true; // keep response channel open for async
  }
});
