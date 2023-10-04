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
puppeteer.use(anonymizeUserAgent())


const { initDB } = require('./utils/database');
const { MangaLibrairy } = require('./parser/mangaLibrairy');
const { prompt_creation_librairie } = require('./utils/prompt')
const { isRequestAuthorized } = require('./utils/requestHandling');
	
const config = require('config');

const JAPSCAN_HOME_TAB = config.get('japscan.home');
const PUPPETEER_CONFIG = config.get('browser');

/**
 * retrieve the number of pages that contain the mangas urls
 * and give it to MangaLibrairy()
 * @param  {puppeteer_options} options puppeteer options
 */
async function parseHomePage(options) {
	puppeteer.launch(options).then(async browser => {
    prompt_creation_librairie()
		initDB();

    console.log(`   => Extraction de Japscan...`);

		const page = (await browser.pages())[0];

		page.setRequestInterception(true);
		page.on('request', request => isRequestAuthorized(request));

		await page.goto(JAPSCAN_HOME_TAB.url);

		await page.waitForSelector(JAPSCAN_HOME_TAB.pathToPageNumber);
		const pageElement = await page.$(JAPSCAN_HOME_TAB.pathToPageNumber);
		// const numberOfPages = await page.evaluate( el => el.innerHTML, pageElement);
		const numberOfPages = 5
		page.close()

		const urls = [];
		for (let i = 1; i <= numberOfPages; i++) {
			urls.push(JAPSCAN_HOME_TAB.url + i);
		}

    console.log(`   => Sauvegarde des ${urls.length} pages de la librairie...`);

		// parsing every page
		MangaLibrairy(urls);
	});
}

options = {
	headless: PUPPETEER_CONFIG.isHeadless,
	devtools: PUPPETEER_CONFIG.showDevtools,
  executablePath: PUPPETEER_CONFIG.executablePath
}

parseHomePage(options)
