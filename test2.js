const workerpool = require('workerpool');
const { getMangaToParse } = require('./utils/db-utils');

// create a worker pool using an external worker script
const pool = workerpool.pool(__dirname + '/test.js');

// urls = ['https://www.japscan.me/mangas/2', 'https://www.japscan.me/mangas/4']
// run registered functions on the worker via exec

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

// or run registered functions on the worker via a proxy:
// pool.proxy()
//     .then(function (worker) {
//       return worker.(10);
//     })
//     .then(function (result) {
//       console.log('Result: ' + result); // outputs 55
//     })
//     .catch(function (err) {
//       console.error(err);
//     })
//     .then(function () {
//       pool.terminate(); // terminate all workers when done
//     });

