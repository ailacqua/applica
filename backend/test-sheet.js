import fetch from 'node-fetch';

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

const testPayload = {
  company: "Antigravity Test Org",
  position: "Systems QA Engineer (Test)",
  location: "Remote, US",
  url: "https://example.com/test-job-post",
  requisition_id: "TEST-999",
  date_applied: new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date()),
  date_posted: "07/02/2026",
  status: "TO APPLY"
};

async function runSheetTest() {
  console.log(`Sending test payload to ${BASE_URL}/send-to-sheet...`);
  console.log("Payload:", JSON.stringify(testPayload, null, 2));

  try {
    const res = await fetch(`${BASE_URL}/send-to-sheet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    if (!res.ok) {
      console.error(`❌ HTTP Error: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error(text);
      process.exit(1);
    }

    const result = await res.json();
    console.log(`\n========================================`);
    console.log(`✅ Success! Response from server:`, JSON.stringify(result, null, 2));
    console.log(`Please check your Google Sheet to verify that the row for "Antigravity Test Org" has been added successfully.`);
    console.log(`========================================`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Error during sheet post test:`, err);
    process.exit(1);
  }
}

runSheetTest();
