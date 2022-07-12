
// intellisense doesn't seem to work with extra
// this random thing work
if (false) {
	const puppeteer = require('puppeteer');
}
const puppeteer = require('puppeteer-extra');
const { JSDOM } = require('jsdom');

const fs = require('fs');

// add stealth plugin
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const internal = require('stream');
const { addChapter } = require('../utils/db-utils');
puppeteer.use(StealthPlugin());

const authorizedRessources = ['document'];

const mangaInformation = {
	url: 'https://www.japscan.ws/manga/komi-san-wa-komyushou-desu/',
	listPathElement: '#chapters_list > div > div > a'
};

puppeteer.launch({ headless: false, devtools: true }).then(async browser => {
	const { window } = new JSDOM();
	console.log('Running script...');
	var startTime = window.performance.now();

	const page = await browser.newPage();
	let index = 1;

	page.setRequestInterception(true);
	page.on('request', req => {
		if ( authorizedRessources.includes(req.resourceType())) {
			req.continue()
		} else {
			req.abort();
		}
	});

	await page.goto(mangaInformation.url);

	const chapterHandles = await page.$$(mangaInformation.listPathElement);
	// console.log(volumeHandles.length);

	for (const chapter of chapterHandles) {
		const url = await chapter.evaluate(item => item.href, chapter);
		addChapter(1, url)
	}
});
