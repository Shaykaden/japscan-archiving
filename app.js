// intellisense doesn't seem to work with extra
// this random thing work
if (false) {
	const puppeteer = require('puppeteer');
}
const puppeteer = require('puppeteer-extra');

const { MangaPage } = require('./parser/MangaPage');
// add stealth plugin
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { initDB } = require('./utils/db-utils');
puppeteer.use(StealthPlugin());

const authorizedRessources = ['script', 'document'];
const authorizedUrl = ['//www.japscan', 'c.japscan', 'cloudflare'];
const authorizedScript = ['axkt-htpgrw.yh.js', 'psktgixhxcv.yh.js'];

const MangaPagermation = {
	url: 'https://www.japscan.ws/mangas/',
	listPathElement: '#main > div > div.d-flex.flex-wrap.m-5 > div.p-2',
};

// app.js start when the application start
puppeteer
	.launch({
		headless: true,
	})
	.then(async browser => {
		console.log('Running script...');

		// init db
		initDB()
		const page = await browser.newPage();

		// only accept needed request
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

		await page.goto(MangaPagermation.url);
		// get the number of pages
		const pagesElement = await page.$( '#main > div > ul > li:nth-child(9) > a');
		// const numberOfPages = await page.evaluate( el => el.innerHTML, pagesElement);
		const numberOfPages = 1 

		let urls = [];
		for (let i = 1; i <= numberOfPages; i++) {
			urls.push(MangaPagermation.url + i);
		}

		console.log(`parsing ${urls.length} pages...`);
		// parsing every page
		MangaPage(urls);
		page.close();
	});
