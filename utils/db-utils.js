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
	db.run('CREATE TABLE IF NOT EXISTS manga(title VARCHAR(255), url VARCHAR(255), isParsed BOOLEAN, information TEXT )')
	
	db.close()

}

function addManga(title, link) {
	let db = new sqlite3.Database(config.dbName, err => {
		if (err) {
			throw err
		}
	})	
	data = {}
	
	console.log(link);
	db.run('INSERT INTO manga(title, url, information, isParsed) VALUES(?, ?, ?, ?)', [title, link, false, JSON.stringify(data)])
	
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

module.exports = {initDB, addManga, addTotalManga}
// addManga('test', 'url');