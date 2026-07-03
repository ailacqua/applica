import fetch from 'node-fetch';

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

const testCases = [
  {
    name: "Standard Job Posting",
    html: `
      <div class="job-header">
        <h1>Senior Software Engineer</h1>
        <h2>Google</h2>
        <span class="location">Mountain View, CA</span>
        <span class="req-id">Req ID: G-98765</span>
        <span class="date">Posted on 06/15/2026</span>
      </div>
    `,
    validate: (data) => {
      return (
        data.company === "Google" &&
        data.position === "Senior Software Engineer" &&
        data.location === "Mountain View, CA" &&
        data.requisition_id === "G-98765" &&
        data.date_posted === "06/15/2026"
      );
    }
  },
  {
    name: "Relative Date & Remote Job Posting",
    html: `
      <div class="job-details">
        <h1 class="title">Staff Systems Architect</h1>
        <div class="company-name">Apple Inc.</div>
        <div class="job-meta">
          <span class="loc">Remote, US</span>
          <span class="id">Job ID: JR-102030</span>
          <span class="posted-date">Posted 2 days ago</span>
        </div>
      </div>
    `,
    validate: (data) => {
      // Since it's relative, check that date_posted is format MM/DD/YYYY and location is Remote or Remote, US
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      return (
        data.company === "Apple Inc." &&
        data.position === "Staff Systems Architect" &&
        (data.location === "Remote" || data.location === "Remote, US") &&
        data.requisition_id === "JR-102030" &&
        dateRegex.test(data.date_posted)
      );
    }
  },
  {
    name: "Missing Information Job Posting",
    html: `
      <main>
        <h1>Frontend Developer</h1>
        <h3>Netflix</h3>
        <p>Location: Los Gatos, California</p>
        <p>Apply now to join our team!</p>
      </main>
    `,
    validate: (data) => {
      return (
        data.company === "Netflix" &&
        data.position === "Frontend Developer" &&
        (data.location === "Los Gatos, CA" || data.location === "Los Gatos, California") &&
        data.requisition_id === "" &&
        data.date_posted === ""
      );
    }
  }
];

async function runTests() {
  console.log(`Starting parser tests against ${BASE_URL}...`);
  let passedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`\n----------------------------------------`);
    console.log(`Running Test ${i + 1}: ${tc.name}`);
    
    try {
      const res = await fetch(`${BASE_URL}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageContents: tc.html })
      });

      if (!res.ok) {
        console.error(`❌ HTTP Error: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.error(text);
        continue;
      }

      const body = await res.json();
      const extracted = JSON.parse(body.result);
      console.log("Extracted Data:", JSON.stringify(extracted, null, 2));

      if (tc.validate(extracted)) {
        console.log(`✅ Test ${i + 1} Passed!`);
        passedCount++;
      } else {
        console.error(`❌ Test ${i + 1} Failed validation requirements.`);
      }
    } catch (err) {
      console.error(`❌ Test ${i + 1} Error:`, err);
    }
  }

  console.log(`\n========================================`);
  console.log(`Tests Completed: ${passedCount}/${testCases.length} Passed`);
  process.exit(passedCount === testCases.length ? 0 : 1);
}

runTests();
