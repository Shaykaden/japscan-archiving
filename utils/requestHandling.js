
const AUTHORIZED_TYPES = [
	'script',
	'document',
	'xhr',
	'image',
];
const AUTHORIZED_URLS = ['//www.japscan', 'c.japscan', 'japscan','cloudflare'];
const AUTHORIZED_SCRIPT = [
	//'axkt-htpgrw.yh.js',
	//'psktgixhxcv.yh.js',
	//'ymdw.yuz.ve.js',
];

function isIniatitorTypeParser(request) {
	return request.initiator().type == 'parser'
}

function isAuthorizedType(request) {
	return AUTHORIZED_TYPES.includes(request.resourceType()) 
}

function isAuthorizedUrl(request) {
	return AUTHORIZED_URLS.some(url => request.url().includes(url)) 
}

function isAuthorizedScript(request) {
	return !AUTHORIZED_SCRIPT.some(script => request.url().includes(script))
} 

function isRequestAuthorized(request) {
	if (
		isAuthorizedType(request) &&
		isAuthorizedUrl(request) &&
		isAuthorizedScript(request) &&
		!isIniatitorTypeParser(request)
	) {
		request.continue();
	} else {
		request.abort();
	}
}

function getImages(request) {

		let pages = {};
	index = 0;
		if (['image'].includes(request.resourceType())) {
			pages[`${index}`] = request.url();
			// index += 1;

			// if not the first page check if it's the last page
			// if (pagesNumber != null) {
			// 	if (index <= pagesNumber) {
			// 		await page
			// 			.goto(chapter.url + index + '.html', {
			// 				timeout: config.timeout,
			// 			})
			// 			.catch(err => {
			// 				console.log(err);
			// 			});
			// 	} else {
			// 		// console.log('update in db');
			// 		updateAddChapterImagesUrl(
			// 			chapter.mangaId,
			// 			chapter.numero,
			// 			pages
			// 		);
			// 		counter += 1;
			// 		console.log('parsed ' + counter);
			// 	}
			// }
			console.log(`url ${request.url()}`);
			// req.abort();
		}
}

module.exports = {isRequestAuthorized, getImages}
