// eslint-disable-next-line no-constant-condition
if (false) {
	// eslint-disable-next-line no-unused-vars
	const puppeteer = require('puppeteer');
}
const puppeteer = require('puppeteer-extra');
const { Cluster } = require('puppeteer-cluster');

// add stealth plugin
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { addMangas } = require('../database.js');
const { setMaxIdleHTTPParsers } = require('http');
const { isRequestAuthorized } = require('../requestHandling.js');
// const { poolHandler } = require('./poolHandler');
puppeteer.use(StealthPlugin());


const MangaPagermation = {
	url: 'https://www.japscan.ws/mangas/',
	listPathElement: '#main > div > div.d-flex.flex-wrap.m-5 > div.p-2',
};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));


async function MangaPage(urls) {
	// get on every page all the manga url and add it to the db
	// const { window } = new JSDOM();
	// var startTime = window.performance.now();

	// creation of a cluster
	const cluster = await Cluster.launch({
		concurrency: Cluster.CONCURRENCY_PAGE,
		maxConcurrency: 2,
		puppeteer,
		puppeteerOptions: {
			headless: false,
			devtools: true
		},
	});

	await cluster.task(async ({ page, data: url }) => {
		// only accept needed request
		console.log(`page url: ${url}`);

		page.setRequestInterception(true);
		page.on('request', request => isRequestAuthorized(request));

		await page.goto(url);
		// get the list that contained all mangas on the page
		
		await page.waitForSelector(MangaPagermation.listPathElement)
		const mangaHandles = await page.$$(MangaPagermation.listPathElement);

		// for each
		for (const manga of mangaHandles) {
			// get title
			const title = await page.evaluate(
				el => el.querySelector('p > a').innerHTML,
				manga
			);
			// get url
			const url = await page.evaluate(
				el => el.querySelector('p > a').href,
				manga
			);

			// add in db

			mangasParsed.push({
				title: title,
				url: url,
			})
		}
		const number = url.charAt(url.length - 1);

		urlParsed += 1;
		if (urlParsed === urls.length) {
			await addMangas(mangasParsed)
			console.log(
				'pages ' +
					url.charAt(url.length - 3) +
					url.charAt(url.length - 2) +
					number +
					' is parsed'
			);
			// var endTime = window.performance.now();
			// console.log(
			// 	`execution time: ${(endTime - startTime) / 1000} seconds`
			// );
			//addTotalManga(counter);
		}
	});

	var urlParsed = 0;
	var counter = 0;
	var mangasParsed = []
	for (const url of urls) {
		await cluster.queue(url);
	}

	await cluster.idle();
	console.log('next');
	// poolHandler()
	await cluster.close();
}

module.exports.MangaPage = MangaPage;
