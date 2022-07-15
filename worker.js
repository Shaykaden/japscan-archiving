// This example worker runs asynchronous tasks. In practice, this could be
// interacting with a database or a web service. The asynchronous function
// returns a promise which resolves with the task's result.

const workerpool = require('workerpool');
const { parsingChapter } = require('./parser/chapter');
const { download } = require('./parser/download');
const { parsingManga } = require('./parser/manga');
const { mangaInfo } = require('./parser/mangaInfo');


// create a worker and register public functions
workerpool.worker({
  mangaInfo: mangaInfo,
  parsingManga: parsingManga,
  parsingChapter: parsingChapter,
  download: download
});
