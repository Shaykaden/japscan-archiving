const Database = require('better-sqlite3');
const db = new Database('librairy.db', {});

/* DB Structure
table :
	- Manga : title, url
	- Chapter : mangaTitle, numero, pagesUrl, pagesCount
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

// manga attributes: title, url
async function addMangas(mangas) {
	const db = new Database('librairy.db', {});
	const insert = db.prepare('INSERT INTO manga(title, url) VALUES(@title, @url)')

	const addedSuccessfuly = 0;

	const insertAll = db.transaction((mangas) => {
		for (const manga of mangas) {
			try {
				insert.run(manga);
				addedSuccessfuly+=1;
			} catch (error) {
				console.warn(`error on : ${manga.title}`);	
			}
		}
	});

	insertAll(mangas)

	console.log(`db : +${addedSuccessfuly} manga, failed: ${mangas.length - addedSuccessfuly}`);
	db.close()
}

// chapter attributes: mangaTitle, numero, pagesUrl
function addChapters(chapters) {
	const db = new Database('librairy.db', {});
	const insertStmt = db.prepare('INSERT INTO chapter(mangaTitle, numero, pagesUrl, pagesCount) VALUES(@mangaTitle, @numero, @pagesUrl, @pagesCount)')


	chapters.forEach(chapter => {
		chapter['pagesCount'] = chapter.pagesUrl.lenght;
		chapter['pagesUrl'] = JSON.stringify(chapter.pagesUrl);
		try {
			insertStmt.run(chapter)
		} catch (error) {
			console.warn(`error on : ${chapter.mangaTitle} ch.${chapter.numero}`);	
		}
	})
}

function getMangaToParse() {
	const db = new Database('librairy.db', { readonly: true });
	const stmt = db.prepare('select * from manga');

	return stmt.all();
}

function getChapterToParse() {
	const db = new Database('librairy.db', { readonly: true });
	const stmt = db.prepare('select * from chapter');

	return stmt.all();
}


const mangas = [
	{
		title: "pokemon",
		url: 'url:test'
	},
	{
		title: "beyblades",
		url: 'url:oui'
	},
]

//	- Chapter : mangaTitle, numero, pagesUrl, pagesCount
const chapters = [
	{
		mangaTitle: "pokemon",
		numero: 3,
		pagesUrl: ['url:1', 'url:2']
	},
	{
		mangaTitle: "pokemon",
		numero: 4,
		pagesUrl: ['url:1', 'url:2', 'url:3']
	}
]


// sql
module.exports = { initDB, addMangas, addChapters };