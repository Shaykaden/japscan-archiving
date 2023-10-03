// intellisense doesn't seem to work with puppeteer-extra
// but this random shit work
if (false) {
	const puppeteer = require('puppeteer');
}
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
const anonymizeUserAgent = require('puppeteer-extra-plugin-anonymize-ua')
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))
puppeteer.use(anonymizeUserAgent({}))

const { initDB } = require('./utils/database');
const { MangaPage } = require('./parser/mangaPage');
const { isRequestAuthorized } = require('./utils/requestHandling');
	

const JAPSCAN_HOME_TAB = {
	url: 'https://www.japscan.ws/mangas/',
	pathToElements: '#main > div > ul > li:nth-child(9) > a',
};

async function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}



/**
 * retrieve the number of pages that contain all mangas urls
 * and give it to MangaPage()
 * @param  {puppeteer_options} options puppeteer options
 */
async function parseHomePage(options) {
	puppeteer.launch(options).then(async browser => {
		console.log('Running script...');
		initDB();

		const page = (await browser.pages())[0];

		page.setRequestInterception(true);
		page.on('request', request => isRequestAuthorized(request));

		await sleep(1000);
		await page.goto(JAPSCAN_HOME_TAB.url);

		await page.waitForSelector(JAPSCAN_HOME_TAB.pathToElements);
		const pageElements = await page.$(JAPSCAN_HOME_TAB.pathToElements);
		const numberOfPages = await page.evaluate( el => el.innerHTML, pageElements);
		// const numberOfPages = 1
		page.close()

		const urls = [];
		for (let i = 1; i <= numberOfPages; i++) {
			urls.push(JAPSCAN_HOME_TAB.url + i);
		}

		console.log(`parsing ${urls.length} pages...`);

		// parsing every page
		MangaPage(urls);
	});
}

options = {
	headless: "new",
	devtools: false,
  executablePath: "/run/current-system/sw/bin/google-chrome-stable"
}

parseHomePage(options)
