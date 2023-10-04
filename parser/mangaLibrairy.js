// eslint-disable-next-line no-constant-condition
if (false) {
	// eslint-disable-next-line no-unused-vars
	const puppeteer = require('puppeteer');
}
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
const anonymizeUserAgent = require('puppeteer-extra-plugin-anonymize-ua')
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))
puppeteer.use(anonymizeUserAgent())


const { Cluster } = require('puppeteer-cluster');
const { addMangas } = require('../utils/database.js');
const { prompt_parse_librairy, prompt_start_log } = require('../utils/prompt')
const { isRequestAuthorized } = require('../utils/requestHandling.js');


const config = require('config');

const JAPSCAN_HOME_TAB = config.get('japscan.home');
const CLUSTER_CONFIG = config.get('cluster.parser'); 
const PUPPETEER_CONFIG = config.get('browser');



/**
 * insert in database all the mangas with 
 * their titles and urls
 */
async function MangaLibrairy(urls) {
	const cluster = await Cluster.launch({
		concurrency: Cluster.CONCURRENCY_PAGE,
		maxConcurrency: CLUSTER_CONFIG.maxConcurrency,
    retryLimit: CLUSTER_CONFIG.retryLimit,
    timeout: CLUSTER_CONFIG.timeout,
		puppeteer,
		monitor: true,
		puppeteerOptions: {
			headless: PUPPETEER_CONFIG.isHeadless,
      devtools: PUPPETEER_CONFIG.showDevtools,
      executablePath: PUPPETEER_CONFIG.executablePath
		},
	});


	await cluster.task(async ({ page, data: url }) => {
		page.setRequestInterception(true);
		page.on('request', request => isRequestAuthorized(request));

		await page.goto(url);
		
		const mangas = await getMangasOnPage(page);
		mangas.forEach(manga => {
			mangasParsed.push(manga);
		})

	});

  prompt_parse_librairy();
  prompt_start_log();


	var mangasParsed = []
	for (const url of urls) {
		await cluster.queue(url);
	}

	await cluster.idle();
	await cluster.close().then(async () => {
    await addMangas(mangasParsed)
  });
}

/**
 * Get and return an object describing a manga 
 * @param {puppeteer.Page} page puppeteer page 
 * @returns {{title, url}[]} arrays of object as { title, url }[]
 */
async function getMangasOnPage(page) {
	const mangas = []

	await page.waitForSelector(JAPSCAN_HOME_TAB.pathToMangasElements);
	const mangaElements = await page.$$(JAPSCAN_HOME_TAB.pathToMangasElements);

	for (const manga of mangaElements) {
		const title = await page.evaluate(
			element => element.querySelector('p > a').innerHTML,
			manga
		);
		const url = await page.evaluate(
			element => element.querySelector('p > a').href,
			manga
		);

		mangas.push({title: title, url: url});
	}

	return mangas;
}

module.exports.MangaLibrairy = MangaLibrairy;
