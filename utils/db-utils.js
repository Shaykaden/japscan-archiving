const config = require('config');
const sqlite3 = require('sqlite3');

function initDB() {
	let db = new sqlite3.Database(config.dbName, err => {
		if (err) {
			throw err;
		}

		console.log('Database started on mangas.db');
	});

	db.run(
		'CREATE TABLE IF NOT EXISTS info(mangaCount INTEGER, volumeCount INTEGER, chapterCount INTEGER)'
	);
	db.run(
		'CREATE TABLE IF NOT EXISTS manga(title VARCHAR(255), url VARCHAR(255), mangaId INTEGER, isParsed BOOLEAN)'
	);
	db.run(
		'CREATE TABLE IF NOT EXISTS chapter(numero TEXT, mangaId INTEGER, url VARCHAR(255), pagesUrl TEXT, pagesDownloaded BOOLEAN)'
	);

	db.close();
}

function addManga(title, url, mangaId) {
	let db = new sqlite3.Database(config.dbName, err => {
		if (err) {
			throw err;
		}
	});
	data = {};

	// console.log(url);
	db.run(
		'INSERT INTO manga(title, url, mangaId, isParsed) VALUES(?, ?, ?, ?)',
		[title, url, mangaId, false]
	);

	db.close();
}

function addChapters(chapterList) {
	//[[mangaId, url], [...]]
	let db = new sqlite3.Database(config.dbName, err => {
		if (err) {
			throw err;
		}
	});
	const length = chapterList.length;
	db.run(
		`INSERT INTO chapter(numero, url, mangaId, pagesUrl, pagesDownloaded) VALUES${
			length > 1
				? '(?, ?, ?, ?, ?),'.repeat(length - 1) + '(?, ?, ?, ?, ?)'
				: '(?, ?, ?, ?, ?)'
		}`,
		chapterList.flat()
	);
	db.close();
}

function getMangaToParse() {
	return new Promise((resolve, reject) => {
		let db = new sqlite3.Database(config.dbName, err => {
			if (err) {
				throw err;
			}
		});

		db.all(
			`select * from manga
			where isParsed = ?`,
			0,
			(err, rows) => {
				if (err) {
					console.log(`error selecting manga not parsed ${err}`);
					reject(err);
				}
				const rowData = [];
				rows.forEach(row => {
					rowData.push({ mangaId: row.mangaId, url: row.url });
				});

				resolve(rowData);
			}
		);

		db.close();
	});
}

function updateAddChapterImagesUrl(mangaId, numero, urls) {
	let db = new sqlite3.Database(config.dbName, err => {
		if (err) {
			throw err;
		}
	});
	const query = `UPDATE chapter
					set pagesUrl=?
					where mangaId=? AND numero=?`;

	db.run(query, [JSON.stringify(urls), mangaId, numero]);

	db.close();
}

function updatePagesDownloaded(mangaId, numero, pages) {
	let db = new sqlite3.Database(config.dbName, err => {
		if (err) {
			throw err;
		}
	});
	const query = `UPDATE chapter
					set pagesUrl=?
					where mangaId=? AND numero=?`;

	db.run(query, [JSON.stringify(urls), mangaId, numero]);

	db.close();
}

function getChapterToParse() {
	return new Promise((resolve, reject) => {
		let db = new sqlite3.Database(config.dbName, err => {
			if (err) {
				throw err;
			}
		});

		db.all(
			`SELECT * FROM chapter WHERE pagesUrl IS NULL`,
			[],
			(err, rows) => {
				if (err) {
					console.log(`error selecting manga not parsed ${err}`);
					reject(err);
				}
				const rowData = [];
				rows.forEach(row => {
					rowData.push({
						mangaId: row.mangaId,
						numero: row.numero,
						url: row.url,
					});
				});

				resolve(rowData);
			}
		);

		db.close();
	});
}

function getChapterToDownload() {
	return new Promise((resolve, reject) => {
		let db = new sqlite3.Database(config.dbName, err => {
			if (err) {
				throw err;
			}
		});

		db.all(
			`SELECT * 
			FROM chapter INNER JOIN manga ON chapter.mangaId = manga.mangaId
			WHERE pagesUrl IS NOT NULL`,
			[],
			(err, rows) => {
				if (err) {
					console.log(`error selecting manga not parsed ${err}`);
					reject(err);
				}
				const rowData = [];
				rows.forEach(row => {
					rowData.push({
						title: row.title,
						numero: row.numero,
						pagesUrl: row.pagesUrl,
					});
				});

				resolve(rowData);
			}
		);

		db.close();
	});
}

function addTotalManga(total) {
	let db = new sqlite3.Database(config.dbName, err => {
		if (err) {
			throw err;
		}
	});

	db.run(
		'INSERT INTO info(mangaCount, volumeCount, chapterCount) VALUES(?, ?, ?)',
		[total, 0, 0]
	);

	db.close();
}

function test(chapterList) {
	let db = new sqlite3.Database(config.dbName, err => {
		if (err) {
			throw err;
		}
	});

	const length = chapterList.length;
	// console.log(length);
	// console.log(`INSERT INTO chapter(numero, url, mangaId, pagesUrl, pagesParsed) VALUES${length > 1 ?  '(?, ?, ?, ?, ?),'.repeat(length-1) + '(?, ?, ?, ?, ?)' : '(i, ?, ?, ?, ?)'}`)
	db.run(
		`INSERT INTO chapter(numero, url, mangaId, pagesUrl, pagesParsed) VALUES${
			length > 1
				? '(?, ?, ?, ?, ?),'.repeat(length - 1) + '(?, ?, ?, ?, ?)'
				: '(i, ?, ?, ?, ?)'
		}`,
		chapterList.flat()
	);

	db.close();
}

// test([[1, 'url', 1, null, null], [2, 'url2', 1, null, null]])
// addChapters([[1, 'url', 1, null, null], [2, 'url2', 1, null, null]])
// updateAddChapterImagesUrl()

module.exports = {
	initDB,
	addManga,
	addChapters,
	addTotalManga,
	updateAddChapterImagesUrl,
	getMangaToParse,
	getChapterToDownload,
	getChapterToParse,
};
// addManga('test', 'url');
