const { builtinModules } = require('module');
const workerpool = require('workerpool');
const { getMangaToParse } = require('../utils/db-utils');

// create a worker pool using an external worker script
const pool = workerpool.pool('./worker.js');

async function poolHandler() {
	console.log('here');
	// parsing manga
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

	// parsing chapter
	var runningChapter = false;
	setInterval(() => {
		// test if all mangas are already parsed
		if (!runningChapter) {
			runningChapter = true;
			pool.exec('parsingChapter', [])
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
		}
	}, 6000);

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

module.exports.poolHandler = poolHandler;
