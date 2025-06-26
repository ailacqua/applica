(() => {
  const url = window.location.href;

  const selectorMap = {
    "workday": '[data-automation-id="job-posting-details"]',
    "jobs.apple.com": '#root',
  };

  let matchedSelector = null;
  for (const domain in selectorMap) {
    if (url.includes(domain)) {
      matchedSelector = selectorMap[domain];
      break;
    }
  }

  const element = matchedSelector ? document.querySelector(matchedSelector) : document.body;

  return element ? element.innerHTML : null;
})();