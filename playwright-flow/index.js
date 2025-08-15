// index.js (or main.js) for Git Flow
const playwright = require('playwright');
const pa11y = require('pa11y');
const axeSource = require('axe-core').source;

module.exports = async function () {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  const url = 'https://google.com'; // Change to your test URL

  await page.goto(url, { waitUntil: 'networkidle' });

  // Run axe-core
  await page.addScriptTag({ content: axeSource });
  const axeResult = await page.evaluate(async () => await window.axe.run());

  // Run pa11y
  const pa11yResult = await pa11y(url);

  await browser.close();

  return { axeResult, pa11yResult };
};
