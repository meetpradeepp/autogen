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
  const url = 'https://www.google.com'; // Change to the URL you want to test

  // Launch browser
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  // Evaluate accessibility on the landing page
  const landingResults = await evaluateAccessibility(page, url);

  // Perform a search for "T-Mobile"
  await page.fill('input[name="q"]', 'T-Mobile');
  await Promise.all([
    page.keyboard.press('Enter'),
    page.waitForNavigation({ waitUntil: 'networkidle' }),
  ]);

  // Get the current URL after search
  const searchUrl = page.url();

  // Evaluate accessibility on the search results page
  const searchResults = await evaluateAccessibility(page, searchUrl);

  await browser.close();

  // Return results for both steps
  return { landingResults, searchResults };
};
