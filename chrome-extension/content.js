// Extract job posting details HTML snippet and send it to background
const jobDetailsElement = document.querySelector('[data-automation-id="job-posting-details"]');
const extractedContent = jobDetailsElement ? jobDetailsElement.innerHTML : null;

if (extractedContent) {
  chrome.runtime.sendMessage({
    action: "extractedContent",
    content: extractedContent
  });
} else {
  console.warn("Job posting details element not found");
}
