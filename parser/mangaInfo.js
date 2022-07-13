// eslint-disable-next-line no-constant-condition
if (false) {
	// eslint-disable-next-line no-unused-vars
	const puppeteer = require('puppeteer');
}
const puppeteer = require('puppeteer-extra');
const { Cluster } = require('puppeteer-cluster');

// add stealth plugin
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { addManga, addTotalManga } = require('../utils/db-utils');
puppeteer.use(StealthPlugin());

const authorizedRessources = ['script', 'document'];
const authorizedUrl = ['//www.japscan', 'c.japscan', 'cloudflare'];
const authorizedScript = [
	'axkt-htpgrw.yh.js',
	'psktgixhxcv.yh.js',
	'ymdw.yuz.ve.js',
];

const mangaInformation = {
	url: 'https://www.japscan.ws/mangas/',
	listPathElement: '#main > div > div.d-flex.flex-wrap.m-5 > div.p-2',
};

async function mangaInfo (urls) {
	// get on every page all the manga url and add it to the db
	// const { window } = new JSDOM();
	// var startTime = window.performance.now();

	// creation of a cluster
	const cluster = await Cluster.launch({
		concurrency: Cluster.CONCURRENCY_PAGE,
		maxConcurrency: 30,
		puppeteer,
		puppeteerOptions: {
			headless: true,
		},
	});

	await cluster.task(async ({ page, data: url }) => {
		// only accept needed request
		page.setRequestInterception(true);
		page.on('request', req => {
			if (
				authorizedRessources.includes(req.resourceType()) &&
				authorizedUrl.some(url => req.url().includes(url))
			) {
				if (
					authorizedScript.some(script => req.url().includes(script))
				) {
					req.abort();
				} else {
					req.continue();
				}
			} else {
				req.abort();
			}
		});

		await page.goto(url);
		// get the list that contained all mangas on the page
		const mangaHandles = await page.$$(mangaInformation.listPathElement);

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
			addManga(title, url, counter);
			counter += 1;
		}
		const number = url.charAt(url.length - 1);

		console.log(
			'pages ' +
				url.charAt(url.length - 3) +
				url.charAt(url.length - 2) +
				number +
				' is parsed'
		);
		urlParsed += 1;
		if (urlParsed === urls.length) {
			// var endTime = window.performance.now();
			// console.log(
			// 	`execution time: ${(endTime - startTime) / 1000} seconds`
			// );
			addTotalManga(counter);
		}
	});

	var urlParsed = 0;
	var counter = 0;
	for (const url of urls) {
		await cluster.queue(url);
	}

	await cluster.idle();
	await cluster.close();
}

module.exports.mangaInfo = mangaInfo;
