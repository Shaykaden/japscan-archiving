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

// add stealth plugin
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const authorizedRessources = ['image', 'script', 'document'];
const authorizedUrl = ['//www.japscan', 'c.japscan', 'cloudflare'];
const prohibibedScript = ['axkt-htpgrw.yh.js'];

const mangaInformation = {
	url: 'https://www.japscan.ws/lecture-en-ligne/komi-san-wa-komyushou-desu/1/',
	page: 13,
};

async function parsingChapter(urls) {
	// const { window } = new JSDOM();
	// console.log('Running script...');
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
		let index = 1;
		let pagesNumber = null;

		console.log(url);
		// only accept needed request and go to next page if it's the chapter's image
		page.setRequestInterception(true);
		page.on('request', async req => {
			if (
				authorizedRessources.includes(req.resourceType()) &&
				authorizedUrl.some(url => req.url().includes(url))
			) {
				if (['image'].includes(req.resourceType())) {
					console.log('page ' + index + ': ' + req.url());
					index += 1;

					// if not the first page check if it's the last page
					if (pagesNumber != null) {
						if (index <= pagesNumber) {
							await page.goto(url + index + '.html').catch(err => console.log('============================================ err' + err));
						} else {
							console.log(`index ${index}, pagesNumber ${pagesNumber}`);
							console.log('finished');
							// var endTime = window.performance.now();
							// console.log(
							// 	`execution time: ${
							// 		(endTime - startTime) / 1000
							// 	} seconds`
							// );
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


		await page.goto(url + index + '.html', {waitUntil: 'domcontentloaded'}).then(async () => {
			pageSelector = await page.$(
				'body > div.container.mt-4 > div:nth-child(1) > div.rounded-0.card-body > div > p:nth-child(6)'
			);
			await page
				.evaluate(el => el.textContent.split(' '), pageSelector)
				.then(async (textContent) => {
					pagesNumber = textContent[textContent.length - 1];
					if (pagesNumber > 1) {
						await page.goto(url + index + '.html')
					}
				})
				.catch(() =>
					resolve(
						`error: failed to find number of pages on chapter ${url}`
					)
				);

		}).catch(err => console.log(err));
		// new Promise(async (resolve) => {
		// 	await page.goto(url + index + '.html');
		// 	pageSelector = await page.$(
		// 		'body > div.container.mt-4 > div:nth-child(1) > div.rounded-0.card-body > div > p:nth-child(6)'
		// 	);
		// 	pagesNumber = await page
		// 		.evaluate(el => el.textContent.split(' '), pageSelector)
		// 		.then(textContent => {
		// 			return textContent[textContent.length - 1];
		// 		})
		// 		.catch(() =>
		// 			resolve(
		// 				`error: failed to find number of pages on chapter ${mangaInformation.url}`
		// 			)
		// 		);
		// 	resolve();
		// })
		// 	.then(async () => {
		// 		await page.goto(mangaInformation.url + index + '.html');
		// 	})
		// 	.catch(err => {
		// 		console.log(err);
		// 	});
	});

	var urlParsed = 0;
	var counter = 0;
	turls = ['https://www.japscan.me/lecture-en-ligne/komi-san-wa-komyushou-desu/1/','https://www.japscan.me/lecture-en-ligne/komi-san-wa-komyushou-desu/2/']
	for (const url of turls) {
		await cluster.queue(url);
	}

	await cluster.idle();
	await cluster.close();
}

parsingChapter()
