// playwright-flow/index.js

// index.js (or main.js)
// Requires: playwright, @axe-core/playwright, pa11ty

const { chromium } = require('playwright');
const pa11y = require('pa11y');
const { injectAxe, getAxeResults } = require('@axe-core/playwright');

const axe = require('@axe-core/playwright');
console.log('Axe-core keys:', Object.keys(axe));

(async () => {
  const url = 'https://www.google.com'; // Change to the URL you want to test
  const steps = [];
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // Run axe
  await injectAxe(page);
  const axeResult = await getAxeResults(page);
  
  // Run pa11y
  const pa11yResult = await pa11y(url);

  // Housekeeping close browser
  await browser.close();

  // Return results in the expected format
  steps.push({
    step: 'landing_page',
    axeResult: axeResult,
    pa11yResult: pa11yResult,
  });
  
  // Print results as JSON to stdout
  console.log(JSON.stringify(steps));
})();

/*
const playwright = require('playwright');

const { injectAxe, getViolations } = require('@axe-core/playwright');

module.exports = async function () {
  const url = 'https://www.google.com'; // Change to the URL you want to test
  const steps = [];
  
  // Launch browser
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  // Inject axe-core using playwright-axe & run it
  await injectAxe(page);
  const axeResult = await page.evaluate(async () => await window.axe.run());

  // Run pa11y
  const pa11yResult = await pa11y(url);

  await browser.close();

  // Return results in the expected format
  steps.push({
    step: 'landing_page',
    axeResult: axeResult,
    pa11yResult: pa11yResult,
  });
  
  // Return results for each step
  return steps;
};
*/
