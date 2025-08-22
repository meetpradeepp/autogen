// playwright-flow/multistep.js

const playwright = require('playwright');
const pa11y = require('pa11y');
const axeSource = require('axe-core').source;

async function evaluateAccessibility(page, url) {
  // Run axe-core
  await page.addScriptTag({ content: axeSource });
  const axeResult = await page.evaluate(async () => await window.axe.run());

  // Run pa11y
  const pa11yResult = await pa11y(url);

  return { axeResult, pa11yResult };
}

module.exports = async function () {
  const url = 'https://practicetestautomation.com/'; // Change to the URL you want to test
  const steps = [];

  // Launch browser
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Step 1: Evaluate accessibility on the landing page
  const landingResults = await evaluateAccessibility(page, url);
  steps.push({
    step: 'home_page',
    axeResult: landingResults.axeResult,
    pa11yResult: landingResults.pa11yResult,
  });

  // Step 2: Perform a click on "Practice"
  await page.getByRole('link', { name: 'Practice', exact: true }).click();

  // Get the current URL after click
  const searchUrl = page.url();

  // Step 3: Evaluate accessibility on the Business page
  const searchResults = await evaluateAccessibility(page, searchUrl);
  steps.push({
    step: 'practice_page',
    axeResult: searchResults.axeResult,
    pa11yResult: searchResults.pa11yResult,
  });

  await browser.close();

  // Return results for each step
  return steps;
};
