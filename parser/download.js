const Fs = require('fs');
const Path = require('path');
const Axios = require('axios');
const { getChapterToDownload } = require('../utils/db-utils');

async function download() {
	// const { window } = new JSDOM();
	// console.log('Running script...');
	// var startTime = window.performance.now();
	console.log('downloading...');


		getChapterToDownload().then(async chapters => {
			for (const chapter of chapters) {
				const pages = JSON.parse(chapter.pagesUrl);

				const directoryPath = Path.resolve(
					__dirname,
					'..',
					'archive',
					`${chapter.title}`,
					`ch. ${chapter.numero}`
				);
				Fs.mkdirSync(directoryPath, { recursive: true });

				// const fetchPage = async () => {
				const entries = Object.entries(pages);
				for (let i = 0; i < entries.length; i++) {
					await new Promise(async resolve => {
						const [key, url] = entries[i];

						const path = Path.resolve(
							__dirname,
							'..',
							'archive',
							`${chapter.title}`,
							`ch. ${chapter.numero}`,
							`${key}.jpg`
						);

						const response = await Axios({
							method: 'GET',
							url: url,
							responseType: 'stream',
						});

						response.data.pipe(Fs.createWriteStream(path));

						await new Promise((resolve, reject) => {
							response.data.on('end', () => {
								console.log(`downloaded ${path}`);
								resolve();
							});

							response.data.on('error', err => {
								reject(err);
							});
						})
							.then(resolve())
							.catch(err => console.log(err));
					})
				}

			}
		});
}
download()

module.exports.download = download;
