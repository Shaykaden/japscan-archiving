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
puppeteer.use(StealthPlugin());

const mangaInformation = {
	url: 'https://www.japscan.ws/mangas/',
	listPathElement: '#main > div > div.d-flex.flex-wrap.m-5 > div.p-2'
}

let data = []

async function mangaInfoCluster(urls) {

	const { window } = new JSDOM()
	var startTime = window.performance.now()

	const cluster = await Cluster.launch({
		concurrency: Cluster.CONCURRENCY_PAGE,
		maxConcurrency: 8,
		puppeteer,
		puppeteerOptions: {
			headless: true,
		},
	});
		// await page.goto('google.com');

	await cluster.task(async ({ page, data: url }) => {
		await page.goto(url);
			const mangaHandles = await page.$$(mangaInformation.listPathElement)

			for (const manga of mangaHandles) {
				const title = await page.evaluate(el => el.querySelector('p > a').innerHTML, manga)
				const link = await page.evaluate(el => el.querySelector('p > a').href, manga)

				const item = {
					title: title,
					link: link
				}
				data.push(item)
			}
			const number = url.charAt(url.length - 1)

			console.log("pages " + (url.charAt(url.length - 3)) + (url.charAt(url.length - 2)) + number + " is complete");
			urlParsed.pop()
			if (urlParsed.length === 0) {
				console.log(data);
				var endTime = window.performance.now()
				console.log(
					`execution time: ${
						(endTime - startTime) / 1000
					} seconds`
				)
			}
		// Store screenshot, do something else
	});

	const urlParsed = urls
	for (const url of urls) {
		await cluster.queue(url);
	}

	console.log('data');

	await cluster.idle();
	await cluster.close();
};

module.exports.mangaInfoCluster = mangaInfoCluster;