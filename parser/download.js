const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getChapterToDownload } = require('../utils/db-utils');

async function downloadFiles() {
	// const { window } = new JSDOM();
	// console.log('Running script...');
	// var startTime = window.performance.now();
	console.log('downloading...');

	getChapterToDownload().then(async chapters => {
		for (const chapter of chapters) {
			createRepertories(chapter);
			await downloadChapter(chapter)
		}
	});
}

downloadFiles();

function createRepertories(chapter) {
	chapterTitle = formatTitle(chapter.title)
	chapterNumero = chapter.numero
	
	const directoryPath = path.resolve(
		__dirname,
		'..',
		'archive',
		`${chapterTitle}`,
		`ch. ${chapterNumero}`
	);

	fs.mkdirSync(directoryPath, { recursive: true });
}



async function downloadChapter(chapter) {
	const downloadPromises = [];

	const chapterPages = JSON.parse(chapter.pagesUrl);
	const pages = Object.entries(chapterPages);

	const title = formatTitle(chapter.title);
	const chapterNumero = chapter.numero;

	for (let i = 0; i < pages.length; i++) {
		const page = pages[i];
		downloadPromises.push(new Promise ((resolve, reject) => {
			downloadImage(title, chapterNumero, page, resolve, reject)
		}))
	}

	await Promise.all(downloadPromises).catch(err => {
			console.log(`error on : ${chapter.title} ch. ${chapter.numero}`);
		})
}

async function downloadImage(title, chapterNumero, page, resolve, reject) {
	const [pageNumero, pageUrl] = page;
	const filePath = path.resolve(
		__dirname,
		'..',
		'archive',
		`${title}`,
		`ch. ${chapterNumero}`,
		`${pageNumero}.jpg`
	);

	if (fs.existsSync(filePath)) {
		resolve();
		return true
	}


	try {
		const response = await axios({
			method: 'GET',
			url: pageUrl,
			responseType: 'stream',
		});

		const write = response.data.pipe(fs.createWriteStream(filePath));
		write.on('finish', () => {
			resolve('Successfully downloaded file!')
		});
	} catch (err) {
		reject(err)
	}
}; 

function formatTitle(title) {
	const formatRules = [
		[/"/g, '-'], 
		[/<|>|:|\\|\/|\||\?/g, '_'],
		[/\./g, '[.]']
	]

	formatRules.forEach(formatItem => {
		title = title.replace(formatItem[0], formatItem[1]);
	})// Expected output: "The quick brown fox jumps over the lazy ferret. If the dog reacted, was it really lazy?"

	return title
}

module.exports.download = downloadFiles;
