// intellisense doesn't seem to work with extra
// this random thing work
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
puppeteer.use(anonymizeUserAgent({}))

const { JSDOM } = require('jsdom');
const { Cluster } = require('puppeteer-cluster');
const { getMangaToParse, addChapters } = require('../utils/database');
const { isRequestAuthorized } = require('../utils/requestHandling');
const { setMaxIdleHTTPParsers } = require('http');

const authorizedRessources = ['document'];

const JAPSCAN_MANGA_TAB = {
	url: 'https://www.japscan.ws/manga/komi-san-wa-komyushou-desu/',
	pathToElements: '#chapters_list > div > div > a',
};


/**
 * insert in database all the chapters with 
 * their mangaTitles, numeros and urls
 */
async function parsingManga() {
	console.log('parsing manga...');

	const cluster = await Cluster.launch({
		concurrency: Cluster.CONCURRENCY_PAGE,
		maxConcurrency: 8,
		puppeteer,
		monitor: true,
		puppeteerOptions: {
			headless: false,
			devtools: false,
		},
	});

	await cluster.task(async ({ page, data: manga }) => {
		// only accept needed request
		page.setRequestInterception(true);
		page.on('request', request => isRequestAuthorized(request));

		await page.goto(manga.url);

		const chapterList = await getChaptersOnPage(page, manga)
		
		addChapters(chapterList)
		
	});

	const mangas = getMangaToParse()
	for (const manga of mangas) {
		await cluster.queue(manga);
	}

	await cluster.idle();
	await cluster.close().then(console.log('finish'));
}


/**
 * Get and return an object describing a chapter without the chapters pageUrls
 * @param {puppeteer.Page} page puppeteer page 
 * @returns {{mangaTitle, numero, url}[]} arrays of object as { mangaTitle, numero, url }[]
 */
async function getChaptersOnPage(page, currentManga) {
	const mangaTitle = currentManga.title

	await page.waitForSelector(JAPSCAN_MANGA_TAB.pathToElements);
	const chapterElements = await page.$$(JAPSCAN_MANGA_TAB.pathToElements);

	const chapters = []
	for (const chapter of chapterElements) {
		const url = await chapter.evaluate(element => element.href, chapter);

		const splittedUrl = url.split('/');
		const numero = splittedUrl[splittedUrl.length - 2];
	
		chapters.push({ mangaTitle: mangaTitle, numero: numero, url: url });
	}

	return chapters;
}

parsingManga();

module.exports.parsingManga = parsingManga;
