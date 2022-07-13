const workerpool = require('workerpool');
const { getMangaToParse } = require('../utils/db-utils');

// create a worker pool using an external worker script
const pool = workerpool.pool('./worker.js');

// parsing manga
getMangaToParse().then(mangas => {
	pool.exec('parsingManga', [mangas])
		.then(function (result) {
			console.log('Result: ' + result); // outputs 55
		})
		.catch(function (err) {
			console.error(err);
		})
		.then(function () {
			pool.terminate(); // terminate all workers when done
		});
});

// parsing chapter

// downloading chapter
