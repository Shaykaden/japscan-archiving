// intellisense doesn't seem to work with extra
// this random thing work
if (false) {
	const puppeteer = require('puppeteer');
}
const puppeteer = require('puppeteer-extra');

const { mangaInfoCluster } = require('./mangaInfoCluster');
// add stealth plugin
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());


const authorizedRessources = ['script', 'document'];
const authorizedUrl = ['//www.japscan', 'c.japscan', 'cloudflare'];
const authorizedScript = ['axkt-htpgrw.yh.js', 'psktgixhxcv.yh.js'];

const mangaInformation = {
	url: 'https://www.japscan.ws/mangas/',
	listPathElement: '#main > div > div.d-flex.flex-wrap.m-5 > div.p-2',
};

puppeteer
	.launch({
		headless: true,
		userDataDir: '../tmp',
	})
	.then(async browser => {
		console.log('Running script...');

		const page = await browser.newPage();

		page.setRequestInterception(true);
		page.on('request', req => {
			if (authorizedRessources.includes(req.resourceType()) && authorizedUrl.some(url => req.url().includes(url))) {
				if (authorizedScript.some(script => req.url().includes(script))) {
					req.abort();
				} else {
					req.continue();
				}
			} else {
				req.abort();
			}
		});

		await page.goto(mangaInformation.url);
		const pagesElement = await page.$( '#main > div > ul > li:nth-child(9) > a');
		const numberOfPages = await page.evaluate( el => el.innerHTML, pagesElement);
		let urls = [];
		for (let i = 1; i <= numberOfPages; i++) {
			urls.push(mangaInformation.url + i);
		}
		mangaInfoCluster(urls);
		page.close();
	});
