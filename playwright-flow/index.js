// playwright-flow/index.js
// Requires: playwright, @axe-core/playwright, pa11ty

const { chromium } = require('playwright');
const pa11y = require('pa11y');
const { AxeBuilder } = require('@axe-core/playwright');


(async () => {
  const url = 'https://google.com'; // Change to the URL you want to test
  const steps = [];
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

   // Run axe-core accessibility checks using AxeBuilder
  const axeResult = await new AxeBuilder({ page }).analyze();
  
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

