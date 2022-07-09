const puppeteer = require("puppeteer-extra");

// add stealth plugin
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

puppeteer.launch({ headless: false }).then(async (browser) => {
    console.log("Running script...");
    const page = await browser.newPage();

    await page.goto(
        "https://www.japscan.ws/lecture-en-ligne/komi-san-wa-komyushou-desu/1/"
    );
});
