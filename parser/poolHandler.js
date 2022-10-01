const { builtinModules } = require('module');
const workerpool = require('workerpool');
const { getMangaToParse, getChapterToParse } = require('../utils/db-utils');

// create a worker pool using an external worker script
const pool = workerpool.pool('./worker.js');

async function poolHandler() {
	var argv = process.argv[2];
	// parsing manga
	if (argv == 'mangas') {
		getMangaToParse().then(mangas => {
			pool.exec('parsingManga', [mangas])
				.then(function (result) {
					console.log('parsingManga finished'); // outputs 55
				})
				.catch(function (err) {
					console.error(err);
				})
				.then(function () {
					pool.terminate(); // terminate all workers when done
				});
		});
	} else if (argv == 'chapters') {

		getChapterToParse().then(chapters => {
			pool.exec('parsingChapter', [chapters])
				.then(res => {
					console.log('parsingChapter finished');
				})
				.catch(function (err) {
					console.error(err);
				})
				.then(function () {
					pool.terminate(); // terminate all workers when done
					runningChapter = false;
				});
		})
		// 	if (!runningChapter) {
		// 		runningChapter = true;
		// 	}
		// }, 6000);
	}

	// downloading chapter
	// var runningDownload = false;
	// setInterval(() => {
	// 	if (!runningDownload) {
	// 		runningDownload = true;
	// 		pool.exec('download', [])
	// 			.then(res => {
	// 				console.log('download chapter finished');
	// 			})
	// 			.catch(function (err) {
	// 				console.error(err);
	// 			})
	// 			.then(function () {
	// 				pool.terminate(); // terminate all workers when done
	// 				runningDownload = false;
	// 			});
	// 	}
	// }, 6000);
}
poolHandler();

module.exports.poolHandler = poolHandler;
