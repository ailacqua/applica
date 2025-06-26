(() => {
  const url = window.location.href;

  const selectorMap = {
    "workday": ['[data-automation-id="job-posting-details"]'],
    "jobs.apple.com": ['#root'],
    "linkedin.com": ['.job-details-jobs-unified-top-card__container--two-pane'],
    "indeed.com": ['.jobsearch-InfoHeaderContainer'],
    "greenhouse.io": ['.job__header', '.body'],
    "amazon.jobs": ['#job-detail'],
    "jobs.careers.microsoft.com": ['.SearchJobDetailsCard']
  };

  let matchedSelectors = null;
  for (const domain in selectorMap) {
    if (url.includes(domain)) {
      matchedSelectors = selectorMap[domain];
      break;
    }
  }

  if (!matchedSelectors) {
    return null;  // no match found
  }

  let combinedHTML = '';

  matchedSelectors.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) {
      combinedHTML += el.innerHTML.trim() + '\n';
    }
  });

  return combinedHTML.trim() || null;
})();