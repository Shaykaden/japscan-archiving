const puppeteer = require("puppeteer-extra");

// add stealth plugin
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

puppeteer.launch({ headless: false }).then(async (browser) => {
    console.log("Running script...");
    const page = await browser.newPage();

    page.setRequestInterception(true);
    page.on("request", (req) => {
        if (["image", "script", "document"].includes(req.resourceType())) {
            if ( ["image"].includes(req.resourceType()) && !req.url().includes("japscan")) {
                req.abort();
            } else {
                req.continue();
            }
        } else {
            req.abort();
        }
    });

    page.on("response", async (response) => {
        var header = response.headers();
        if (/^image\/(png|jpeg)$/.test(header["content-type"])) {
            console.log(await response.url());
        }
    });

    await page.goto(
        "https://www.japscan.ws/lecture-en-ligne/komi-san-wa-komyushou-desu/1/"
    );
});
