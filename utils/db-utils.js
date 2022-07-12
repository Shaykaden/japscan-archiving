const config = require('config');
const { log } = require('console');
const sqlite3 = require('sqlite3')

function initDB() {
	let db = new sqlite3.Database(config.dbName, err => {
		if (err) {
			throw err
		}

		console.log('Database started on mangas.db');
	})	

	db.run('CREATE TABLE IF NOT EXISTS info(mangaCount INTEGER, volumeCount INTEGER, chapterCount INTEGER)')
	db.run('CREATE TABLE IF NOT EXISTS manga(title VARCHAR(255), url VARCHAR(255), mangaId INTEGER, isParsed BOOLEAN)')
	db.run('CREATE TABLE IF NOT EXISTS chapter(numero TEXT, mangaId INTEGER, url VARCHAR(255), pagesUrl TEXT, pagesParsed BOOLEAN)')
	
	db.close()
}

function addManga(title, url, mangaId) {
	let db = new sqlite3.Database(config.dbName, err => {
		if (err) {
			throw err
		}
	})	
	data = {}
	
	console.log(url);
	db.run('INSERT INTO manga(title, url, mangaId, isParsed) VALUES(?, ?, ?, ?)', [title, url, mangaId, false])
	
	db.close()
}

function addChapter(mangaId, url) {
	let db = new sqlite3.Database(config.dbName, err => {
		if (err) {
			throw err
		}
	})	

	const splittedUrl = url.split('/')
	const numero = splittedUrl[splittedUrl.length - 2];

	db.run('INSERT INTO chapter(numero, url, mangaId, pagesUrl, pagesParsed) VALUES(?, ?, ?, ?, ?)', [numero, url,mangaId, [], null])
	
	db.close()
}

function addTotalManga(total) {
	let db = new sqlite3.Database(config.dbName, err => {
		if (err) {
			throw err
		}
	})	

	db.run('INSERT INTO info(mangaCount, volumeCount, chapterCount) VALUES(?, ?, ?)', [total, 0, 0])
	
	db.close()
}

module.exports = {initDB, addManga, addChapter, addTotalManga}
// addManga('test', 'url');