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
const { addMangas } = require('../database.js');
const { isRequestAuthorized } = require('../requestHandling.js');


const JAPSCAN_MANGAS_TAB = {
	url: 'https://www.japscan.ws/mangas/',
	pathToElements: '#main > div > div.d-flex.flex-wrap.m-5 > div.p-2',
};


/**
 * insert in database all the mangas with 
 * their titles and urls
 * @param {String[]} urls array of urls
 */
async function MangaPage(urls) {
	const cluster = await Cluster.launch({
		concurrency: Cluster.CONCURRENCY_PAGE,
		maxConcurrency: 5,
		puppeteer,
		puppeteerOptions: {
			headless: false,
		},
	});

	await cluster.task(async ({ page, data: url }) => {
		console.log(`page url: ${url}`);

		page.setRequestInterception(true);
		page.on('request', request => isRequestAuthorized(request));

		await page.goto(url);
		
		const mangas = await getMangasOnPage(page);
		mangas.forEach(manga => {
			mangasParsed.push(manga);
		})

		page.close();
	});

	var mangasParsed = []
	for (const url of urls) {
		await cluster.queue(url);
	}

	await cluster.idle();
	await cluster.close().then(async () => {
		await addMangas(mangasParsed)
		console.log( ` => ${urls.length} have been parsed`);}
	);
}

/**
 * Get and return an object describing a manga 
 * @param {puppeteer.Page} page puppeteer page 
 * @returns {{title, url}[]} arrays of object as { title, url }[]
 */
async function getMangasOnPage(page) {
	const mangas = []

	await page.waitForSelector(JAPSCAN_MANGAS_TAB.pathToElements);
	const mangaElements = await page.$$(JAPSCAN_MANGAS_TAB.pathToElements);

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

module.exports.MangaPage = MangaPage;
