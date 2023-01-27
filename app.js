// intellisense doesn't seem to work with extra
// this random thing work
if (false) {
	const puppeteer = require('puppeteer');
}
const puppeteer = require('puppeteer-extra');

const { MangaPage } = require('./parser/MangaPage');
// add stealth plugin
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { initDB } = require('./database.js');
const { kMaxLength } = require('buffer');
const { isRequestAuthorized } = require('./requestHandling');
puppeteer.use(StealthPlugin());

	

const JAPSCAN_MANGA_TAB = {
	url: 'https://www.japscan.ws/mangas/',
	listPathElement: '#main > div > div.d-flex.flex-wrap.m-5 > div.p-2',
};



// app.js start when the application start
puppeteer.launch({ headless: false, devtools: true }).then(async browser => {
	console.log('Running script...');

	// init db
	initDB();
	const page = await browser.newPage();

	// only accept needed request
	page.setRequestInterception(true);
	page.on('request', request => isRequestAuthorized(request));

	await page.goto(JAPSCAN_MANGA_TAB.url);
	// get the number of pages
	await page.waitForSelector('#main > div > ul > li:nth-child(9) > a')
	const pagesElement = await page.$('#main > div > ul > li:nth-child(9) > a');
	const numberOfPages = await page.evaluate( el => el.innerHTML, pagesElement);
	// const numberOfPages = 5;

	let urls = [];
	for (let i = 1; i <= numberOfPages; i++) {
		urls.push(JAPSCAN_MANGA_TAB.url + i);
	}

	console.log(`parsing ${urls.length} pages...`);
	// parsing every page
	MangaPage(urls);
	// page.close();
});
