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
	var running = false;
	setInterval(() => {
		// test if all mangas are already parsed
		if (!running) {
			running = true
			pool.exec('parsingChapter', [])
				.then(res => {
					console.log('parsingChapter finished');
				})
				.catch(function (err) {
					console.error(err);
				})
				.then(function () {
					pool.terminate(); // terminate all workers when done
					running = false
				});
		}
	}, 60000);

	// downloading chapter
}

module.exports.poolHandler = poolHandler;
