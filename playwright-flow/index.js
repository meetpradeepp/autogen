// playwright-flow/index.js

const playwright = require('playwright');
const pa11y = require('pa11y');
const { injectAxe, getViolations } = require('playwright-axe');

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
