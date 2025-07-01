chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "processJobPost") {

    const pageContents = `${message.content}`;

    fetch("http://localhost:3000/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageContents })
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
