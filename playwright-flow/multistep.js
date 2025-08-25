// playwright-flow/multistep.js

const playwright = require('playwright');
const pa11y = require('pa11y');
const { AxeBuilder } = require('@axe-core/playwright');

/**
*
*/
async function evaluateAccessibility(page, url) {
  // Run axe-core
  const scanResult = await new AxeBuilder({ page }).analyze();
  const axeResult  = scanResult;
  // Run pa11y
  const pa11yResult = await pa11y(url);

  return { axeResult, pa11yResult };
}

module.exports = async function () {
  const url = 'https://www.t-mobile.com/'; // Change to the URL you want to test
  const steps = [];

  // Launch browser
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });


  // Step 1: Evaluate accessibility on the landing page
  const landingResults = await evaluateAccessibility(page, url);
  steps.push({
    step: 'landing_page',
    axeResult: landingResults.axeResult,
    pa11yResult: landingResults.pa11yResult,
  });

  // Step 2: Perform a click on "Business"
  await page.getByRole('link', { name: 'Business', exact: true }).click();
  await Promise.all([
    page.keyboard.press('Enter'),
    page.waitForNavigation({ waitUntil: 'networkidle' }),
  ]);

  // Get the current URL after "Business" click
  const searchUrl = page.url();

  // Step 3: Evaluate accessibility on the Business page
  const searchResults = await evaluateAccessibility(page, searchUrl);
  steps.push({
    step: 'search_results_page',
    axeResult: searchResults.axeResult,
    pa11yResult: searchResults.pa11yResult,
  });

  await browser.close();

  // Return results for each step
  return steps;
};
