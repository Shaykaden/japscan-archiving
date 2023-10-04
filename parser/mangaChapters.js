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

const { Cluster } = require('puppeteer-cluster');
const { prompt_parse_manga, prompt_start_log, prompt_end_log } = require('../utils/prompt')
const { getMangaToParse, addChapters, getChapterToParse } = require('../utils/database');
const { isRequestAuthorized } = require('../utils/requestHandling');
const authorizedRessources = ['document'];

const config = require('config');

const CLUSTER_CONFIG = config.get('cluster.parser'); 
const PUPPETEER_CONFIG = config.get('browser');
const JAPSCAN_MANGA_TAB = config.get('japscan.manga')

/**
 * insert in database all the chapters with 
 * their mangaTitles, numeros and urls
 */
async function parsingManga() {
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

	await cluster.task(async ({ page, data: manga }) => {
		// only accept needed request
		page.setRequestInterception(true);
		page.on('request', request => isRequestAuthorized(request));

		await page.goto(manga.url);

		const chapterList = await getChaptersOnPage(page, manga)
		
		addChapters(chapterList)
		
	});

  prompt_parse_manga();
  prompt_start_log();

	const mangas = getMangaToParse()
	for (const manga of mangas) {
		await cluster.queue(manga);
	}

	await cluster.idle();
	await cluster.close().then(() => {
    prompt_end_log();
    const chapterCount = getChapterToParse().length;
    console.log(`   => identification de ${chapterCount} chapitres sur Japscan...`)
    console.log(`   => ajout de ${chapterCount} chapitres avec succes...`)
  });
}


/**
 * Get and return an object describing a chapter without the chapters pageUrls
 * @param {puppeteer.Page} page puppeteer page 
 * @returns {{mangaTitle, numero, url}[]} arrays of object as { mangaTitle, numero, url }[]
 */
async function getChaptersOnPage(page, currentManga) {
	const mangaTitle = currentManga.title

	await page.waitForSelector(JAPSCAN_MANGA_TAB.pathToChapterList);
	const chapterElements = await page.$$(JAPSCAN_MANGA_TAB.pathToChapterList);

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
