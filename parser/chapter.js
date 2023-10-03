// intellisense doesn't seem to work with extra
// this random thing work
if (false) {
	const puppeteer = require('puppeteer');
}
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const anonymizeUserAgent = require('puppeteer-extra-plugin-anonymize-ua');
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
puppeteer.use(anonymizeUserAgent({}))

const { isRequestAuthorized } = require('../utils/requestHandling');
const { getChapterToParse } = require('../utils/database');
const { Cluster } = require('puppeteer-cluster');
const config = require('config');
const fs = require('fs');
const { request } = require('https');
const path = require('path');

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const clusterOptions = {
		concurrency: Cluster.CONCURRENCY_PAGE,
		maxConcurrency: 9,
		puppeteer,
		retryLimit: 1,
		timeout: 120000, // TODO: 2min, set in config file
		monitor: true,
		puppeteerOptions: {
			headless: 'new',
      executablePath: "/run/current-system/sw/bin/google-chrome-stable"
		},
	}

async function parsingChapter() {
	const chapters = getChapterToParse();
	console.log('parsing chapter...');

	// creation of a cluster
	const cluster = await Cluster.launch(clusterOptions);
	// const cluster2 = await Cluster.launch(clusterOptions);
	// const cluster3 = await Cluster.launch(clusterOptions);
	// const cluster4 = await Cluster.launch(clusterOptions);

	await cluster.task(clusterTask);
	// await cluster2.task(clusterTask)
	// await cluster3.task(clusterTask)
	// await cluster4.task(clusterTask)


	var counter = 1;
	// console.log(chapters);
	for (const chapter of chapters) {
		// if (counter == 1) {
			await cluster.queue(chapter).catch(err => console.log(err));
		// }
		// else if (counter == 2){
		// 	await cluster3.queue(chapter).catch(err => console.log(err));
		// }
		// else if (counter == 3){
		// 	await cluster2.queue(chapter).catch(err => console.log(err));
		// 	counter = 0
		// }
		// counter++
	}

	cluster.on('taskerror', (err, data, willRetry) => {
		if (willRetry) {
			console.warn(`Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`);
		} else {
			console.error(`Failed to crawl ${data}: ${err.message}`);
		}
	});
	// cluster2.on('taskerror', (err, data, willRetry) => {
	// 	if (willRetry) {
	// 		console.warn(`Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`);
	// 	} else {
	// 		console.error(`Failed to crawl ${data}: ${err.message}`);
	// 	}
	// });

	// cluster3.on('taskerror', (err, data, willRetry) => {
	// 	if (willRetry) {
	// 		console.warn(`Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`);
	// 	} else {
	// 		console.error(`Failed to crawl ${data}: ${err.message}`);
	// 	}
	// });
	await cluster.idle().then((state = 0));
	await cluster.close().then(() => {
		console.log('finish');
	});
	// await cluster2.idle().then((state = 0));
	// await cluster2.close().then(() => {
	// 	console.log('finish');
	// });
	// await cluster3.idle().then((state = 0));
	// await cluster3.close().then(() => {
	// 	console.log('finish');
	// });


}

	async function filterImages(request) {
		let pages = {};
		index = 0;
		if (['image'].includes(request.resourceType())) {
			url = request.url();
			keyword = 'japscan';
			pages[`${index}`] = request.url();
			if (
				url.includes(keyword) &&
				!url.includes('favicon') &&
				!url.includes('cdn-cgi') &&
				!url.includes('imgs')
			) {

				const response = await request.response();
				// console.log(response);
			}
		}
	}

	async function downloadImage(response, chapter) {}
function createRepertories(chapter) {
	chapterTitle = formatTitle(chapter.mangaTitle);
	chapterNumero = chapter.numero;

	const directoryPath = path.resolve(
		__dirname,
		'..',
		'archive',
		`${chapterTitle}`,
		`ch.${chapterNumero}`
	);

	fs.mkdirSync(directoryPath, { recursive: true });
}

function formatTitle(title) {
	const formatRules = [
		[/"/g, '-'],
		[/<|>|:|\\|\/|\||\?/g, '_'],
		[/\./g, '[.]'],
	];

	formatRules.forEach(formatItem => {
		title = title.replace(formatItem[0], formatItem[1]);
	}); // Expected output: "The quick brown fox jumps over the lazy ferret. If the dog reacted, was it really lazy?"

	return title;
}

function isImage(url) {
	isAnImage = !url.includes('imgs') && (url.endsWith('.png') || url.endsWith('.jpg'));
	isRequestByJapscan = url.includes('japscan') ;
	IsRandomThing= url.includes('favicon') || url.includes('cdn-cgi');

	return isAnImage && isRequestByJapscan && !IsRandomThing;
}


async function clusterTask({ page, data: chapter }) {
	let pagesNumber = 0;
	let imageIndex = 0;
	let imageDownloaded = 0;

	createRepertories(chapter);

	page.setRequestInterception(true);

	// TODO: checkk https://www.japscan.me/lecture-en-ligne/10-years-in-friend-zone/1/1.html
	// one page but manhwa ?

	page.on('request', request => filterImages(request, imageIndex));
	page.on('response', async response => {
		const url = response.url();
		if (isImage(url)) {
			imageIndex += 1;

			const filePath = path.resolve(
				__dirname,
				'..',
				'archive',
				`${formatTitle(chapter.mangaTitle)}`,
				`ch.${chapter.numero}`,
				`${imageIndex}.jpg`
			);
			const buffer = await response.buffer();
			fs.writeFileSync(filePath, buffer);
			imageDownloaded += 1;
		}
	});

	// page.on('request', request => isRequestAuthorized(request))
	// const testurl = 'https://www.japscan.me/lecture-en-ligne/090-eko-to-issho/11/'
	await page.goto(chapter.url);
	// TODO: check nbpages puis si tout télécharger go next
	
	await page.waitForSelector('#pages');
	const informationDiv = await page.$('#pages');
	// try {
	information = await page.evaluate(el => el.lastChild.innerHTML.split(' '), informationDiv);
	pagesNumber = parseInt(information[information.length - 1]);


	while (pagesNumber != imageDownloaded) {
		await sleep(100);
	}
};


parsingChapter();

module.exports.parsingChapter = parsingChapter;
