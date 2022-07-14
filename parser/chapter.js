// intellisense doesn't seem to work with extra
// this random thing work
if (false) {
	const puppeteer = require('puppeteer');
}
const puppeteer = require('puppeteer-extra');
const { JSDOM } = require('jsdom');

const { Cluster } = require('puppeteer-cluster');

// add stealth plugin
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const {
	updateAddChapterImagesUrl,
	getChapterToParse,
} = require('../utils/db-utils');
const config = require('config');
puppeteer.use(StealthPlugin());

const authorizedRessources = ['image', 'script', 'document'];
const authorizedUrl = ['//www.japscan', 'c.japscan', 'cloudflare'];
const prohibibedScript = ['axkt-htpgrw.yh.js'];

async function parsingChapter() {
	// const { window } = new JSDOM();
	// console.log('Running script...');
	// var startTime = window.performance.now();
	console.log('parsing chapter...');

	// creation of a cluster
	const cluster = await Cluster.launch({
		concurrency: Cluster.CONCURRENCY_PAGE,
		maxConcurrency: 10,
		puppeteer,
		timeout: 86400000, // 10 days, because 10 days
		puppeteerOptions: {
			headless: true,
		},
	});

	await cluster.task(async ({ page, data: chapter }) => {
		let index = 1;
		let pagesNumber = null;
		let pages = {};

		let state = 0

		const { window } = new JSDOM();
		var startTime = window.performance.now();

		// console.log('loop');

		// console.log(chapter.url);
		// only accept needed request and go to next page if it's the chapter's image
		page.setRequestInterception(true);
		page.on('request', async req => {
			if (
				authorizedRessources.includes(req.resourceType()) &&
				authorizedUrl.some(url => req.url().includes(url))
			) {
				if (['image'].includes(req.resourceType())) {
					pages[`${index}`] = req.url();
					index += 1;
					// console.log('pages: ' + index);

					// if not the first page check if it's the last page
					if (pagesNumber != null) {
						if (index <= pagesNumber) {
							await page
								.goto(chapter.url + index + '.html', {
									timeout: config.timeout,
								})
								.catch(err => {
									var endTime = window.performance.now();
									console.log(
										`execution time: ${
											(endTime - startTime) / 1000
										} seconds`
									);
									console.log(
										`url that crash ${
											chapter.url + index + '.html'
										}, err ${err}`
									);
								});
						} else {
							// console.log(
							// 	`index ${index}, pagesNumber ${pagesNumber}`
							// );

							// console.log('update in db');
							updateAddChapterImagesUrl(
								chapter.mangaId,
								chapter.numero,
								pages
							);
							counter += 1
							console.log('parsed ' + counter);
						}
					}
					req.abort();
				} else {
					if (
						prohibibedScript.some(script =>
							req.url().includes(script)
						)
					) {
						req.abort();
					} else {
						req.continue();
					}
				}
			} else {
				req.abort();
			}
		});

		await page
			.goto(chapter.url + index + '.html', {
				waitUntil: 'domcontentloaded',
				timeout: config.timeout,
			})
			.then(async () => {
				pageSelector = await page.$(
					'body > div.container.mt-4 > div:nth-child(1) > div.rounded-0.card-body > div'
				);
				const mangaType = await page.$(
					'body > div.container.mt-4 > div:nth-child(1) > div.rounded-0.card-body > div > p:nth-child(1) > span'
				);
				await page
					.evaluate(el => el.lastChild.textContent, mangaType)
					.then(async type => {
						if (type === 'Manga') {
							const element = (
								await page.$x(
									'//span[text()="Nombre De Pages"]'
								)
							)[0];
							await page
								.evaluate(
									el =>
										el.parentElement.textContent.split(' '),
									element
								)
								.then(async number => {
									pagesNumber = number[number.length - 1];
									if (pagesNumber > 1) {
										await page.goto(
											chapter.url + index + '.html',
											{ timeout: config.timeout }
										);
									}
								})
								.catch(err =>
									console.log(
										`error: failed to find number of pages on chapter ${chapter.url} ${err}`
									)
								);
						} else {

							counter += 1
							console.log('skip not manga');
						}
					});
			})
			.catch(err => console.log(err));
	});


	var counter = 0
		getChapterToParse()
			.then(async chapters => {
				console.log('length ' + chapters.length);
				if (chapters.length != 0) {
					state = 1;
					for (const chapter of chapters) {
						await cluster
							.queue(chapter)
							.catch(err => console.log(err));
					}
			}})
			.catch(err => {
				console.log(err);
			});


	await cluster.idle().then((state = 0));
	// await cluster.close();

}

module.exports.parsingChapter = parsingChapter;
