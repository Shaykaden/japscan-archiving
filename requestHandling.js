
const AUTHORIZED_TYPES = [
	'script',
	'document',
	'xhr',
	'image',
];
const AUTHORIZED_URLS = ['//www.japscan', 'c.japscan', 'japscan','cloudflare'];
const AUTHORIZED_SCRIPT = [
	'axkt-htpgrw.yh.js',
	'psktgixhxcv.yh.js',
	'ymdw.yuz.ve.js',
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

module.exports = {isRequestAuthorized}