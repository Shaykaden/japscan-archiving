const Database = require('better-sqlite3');

/* DB Structure
table :
	- Manga : title, url
	- Chapter : mangaTitle, numero, pagesUrl, pagesCount
*/


/**
 * init the database by creating the table
 * 'manga' and 'chapter'
 */
function initDB() {
	const db = new Database('librairy.db', {});

	tables = [
		`CREATE TABLE IF NOT EXISTS manga(
			title VARCHAR(255) PRIMARY KEY,
			url VARCHAR(255))`,
		`CREATE TABLE IF NOT EXISTS chapter(
			mangaTitle TEXT,
			numero INTEGER,
			url TEXT,
			pagesUrl TEXT,
			pagesCount INTEGER,
			PRIMARY KEY (mangaTitle, numero)
			FOREIGN KEY (mangaTitle) REFERENCES manga(title));`,
	];
	
	tables.forEach(table => {
		const prepare = db.prepare(table);
		prepare.run();
	});

	db.close()
}

/**
 * add serveral mangas to the database 
 * @param {{title: String, url: String}[]} mangas arrays of object as {title, url}
 */
async function addMangas(mangas) {
	const db = new Database('librairy.db', {});
	const insert = db.prepare('INSERT INTO manga(title, url) VALUES(@title, @url)');

	let addedSuccessfuly = 0;

	const insertAll = db.transaction((mangas) => {
		for (const manga of mangas) {
			try {
				insert.run(manga);
        addedSuccessfuly += 1;
			} catch (error) {
				console.warn(`error on : ${manga.title}, error ${error}`);	
			}
		}
	});

	insertAll(mangas)

	console.log(`db : +${addedSuccessfuly} manga, failed: ${mangas.length - addedSuccessfuly}`);
	db.close();
}

/**
 * 
 * @param {{mangaTitle: String, numero: int, pagesUrl: String[]}[]} chapters arrays of object of {mangaTitle, numero, pagesUrl} 
 */
function addChapters(chapters) {
	const db = new Database('librairy.db', {});
	const insertStmt = db.prepare('INSERT INTO chapter(mangaTitle, numero, url) VALUES(@mangaTitle, @numero, @url)')

	chapters.forEach(chapter => {
		try {
			insertStmt.run(chapter)
		} catch (error) {
			console.warn(`error on : ${chapter.mangaTitle} ch.${chapter.numero}, error: ${error}`);	
		}
	})

	db.close();
}


/**
 * return all the mangas that need to be parsed
 * @return {{title: String, url: String}[]} mangas arrays of object as {title, url}
 */
function getMangaToParse() {
	const db = new Database('librairy.db', { readonly: true });
	const stmt = db.prepare('select * from manga');

	mangas = stmt.all();
	db.close();
	return mangas;
}

/**
 * return all the mangas that need to be parsed
 * @return {{mangaTitle: String, numero: int, pagesUrl: String[]}[]} chapters arrays of object of {mangaTitle, numero, pagesUrl} 
 */
function getChapterToParse() {
	const db = new Database('librairy.db', { readonly: true });
	const stmt = db.prepare('select * from chapter');
	chapters = stmt.all()
	db.close();

	return chapters;
}

module.exports = { initDB, addMangas, addChapters, getMangaToParse, getChapterToParse };
