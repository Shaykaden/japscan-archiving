if (false) {
	const puppeteer = require('puppeteer');
}
const puppeteer = require('puppeteer-extra');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const { Cluster } = require('puppeteer-cluster');

// add stealth plugin
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { log } = require('console');
const { promises } = require('stream');
const { addManga, addTotalManga } = require('../utils/db-utils');
puppeteer.use(StealthPlugin());

const authorizedRessources = ['script', 'document'];
const authorizedUrl = ['//www.japscan', 'c.japscan', 'cloudflare'];
const authorizedScript = ['axkt-htpgrw.yh.js', 'psktgixhxcv.yh.js', 'ymdw.yuz.ve.js'];

const mangaInformation = {
	url: 'https://www.japscan.ws/mangas/',
	listPathElement: '#main > div > div.d-flex.flex-wrap.m-5 > div.p-2',
};

async function mangaInfoCluster(urls) {
	const { window } = new JSDOM();
	var startTime = window.performance.now();

	const cluster = await Cluster.launch({
		concurrency: Cluster.CONCURRENCY_PAGE,
		maxConcurrency: 30,
		puppeteer,
		puppeteerOptions: {
			headless: true,
		},
	});


	await cluster.task(async ({ page, data: url }) => {

		page.setRequestInterception(true);
		page.on('request', req => {
			if ( authorizedRessources.includes(req.resourceType()) && authorizedUrl.some(url => req.url().includes(url))) {
				if (authorizedScript.some(script => req.url().includes(script))) {
					req.abort();
				} else {
					req.continue();
				}
			} else {
				req.abort();
			}
		});
		await page.goto(url);
		const mangaHandles = await page.$$(mangaInformation.listPathElement);

		for (const manga of mangaHandles) {
			const title = await page.evaluate(
				el => el.querySelector('p > a').innerHTML,
				manga
			);
			const link = await page.evaluate(
				el => el.querySelector('p > a').href,
				manga
			);

			addManga(title, link)
			total += 1;
		}
		const number = url.charAt(url.length - 1);

		console.log(
			'pages ' +
				url.charAt(url.length - 3) +
				url.charAt(url.length - 2) +
				number +
				' is complete'
		);
		urlParsed += 1;
		if (urlParsed === urls.length) {
			var endTime = window.performance.now();
			console.log(
				`execution time: ${(endTime - startTime) / 1000} seconds`
			);
			addTotalManga(total)
		}
	});

	var urlParsed = 0;
	var total = 0;
	for (const url of urls) {
		await cluster.queue(url);
	}

	await cluster.idle();
	await cluster.close();
}

module.exports.mangaInfoCluster = mangaInfoCluster;
