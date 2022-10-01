// intellisense doesn't seem to work with extra
// this random thing work
// eslint-disable-next-line no-constant-condition
if (false) {
	// eslint-disable-next-line no-unused-vars
	const puppeteer = require('puppeteer');
}
const puppeteer = require('puppeteer-extra');
const { JSDOM } = require('jsdom');

const { Cluster } = require('puppeteer-cluster');

const sqlite3 = require('sqlite3');
const config = require('config');


// add stealth plugin
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { addChapters, addManga } = require('../utils/db-utils');
puppeteer.use(StealthPlugin());

const authorizedRessources = ['document'];

const MangaPagermation = {
	url: 'https://www.japscan.ws/manga/komi-san-wa-komyushou-desu/',
	listPathElement: '#chapters_list > div > div > a',
};

async function parsingManga(mangas) {

	console.log('parsing manga...');
	// console.log(mangas);
	const { window } = new JSDOM();
	var startTime = window.performance.now();

	// creation of a cluster
	const cluster = await Cluster.launch({
		concurrency: Cluster.CONCURRENCY_PAGE,
		maxConcurrency: 10,
		puppeteer,
		puppeteerOptions: {
			headless: true,
		},
	});

	await cluster.task(async ({ page, data: manga }) => {
		// only accept needed request
		page.setRequestInterception(true);
		page.on('request', req => {
			if (authorizedRessources.includes(req.resourceType())) {
				req.continue();
			} else {
				req.abort();
			}
		});

		await page.goto(manga.url);
		// get the list that contained all mangas on the page
		const chapterHandles = await page.$$(MangaPagermation.listPathElement);
		// console.log(volumeHandles.length);
		let chapterList = []
		
		for (const chapter of chapterHandles) {
			const url = await chapter.evaluate(item => item.href, chapter);
			chapCounter += 1
			console.log(chapCounter + ' ' + url);

			const splittedUrl = url.split('/');
			const numero = splittedUrl[splittedUrl.length - 2];
			chapterList.push([numero, url, manga.mangaId, null, null]);
		}
		
		addChapters(chapterList)
		counter += 1;

		// console.log('counter :' +counter);
		if (counter === manga.length) {
			var endTime = window.performance.now();
			console.log(
				`execution time: ${(endTime - startTime) / 1000} seconds`
			);
		}
	});

	var counter = 0;
	var chapCounter = 0;
	// console.log(mangas.length);
	for (const manga of mangas) {
		await cluster.queue(manga);
	}

	await cluster.idle();
	await cluster.close();
}

module.exports.parsingManga = parsingManga;
