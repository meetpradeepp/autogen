// playwright-flow/index.js

const playwright = require('playwright');
const pa11y = require('pa11y');
const axeSource = require('axe-core').source;

module.exports = async function () {
  const url = 'https://www.google.com'; // Change to the URL you want to test

  // Launch browser
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  // Run axe-core
  await page.addScriptTag({ content: axeSource });
  const axeResult = await page.evaluate(async () => await window.axe.run());

  // Run pa11y
  const pa11yResult = await pa11y(url);

  await browser.close();

  // Return results in the expected format
  return { axeResult, pa11yResult };
};
