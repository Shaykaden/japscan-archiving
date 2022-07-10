// intellisense doesn't seem to work with extra
// this random thing work
const { JSDOM } = require('jsdom')

if (false) {
	const puppeteer = require('puppeteer')
}
const puppeteer = require('puppeteer-extra')

// add stealth plugin
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const authorizedRessources = ['image', 'script', 'document'];
const authorizedUrl = ['//www.japscan', 'c.japscan', 'cloudflare']
const authorizedScript = ['axkt-htpgrw.yh.js']

const mangaInformation = {
	url: 'https://www.japscan.ws/lecture-en-ligne/komi-san-wa-komyushou-desu/1/',
	page: 13,
}


puppeteer.launch({ headless: false, devtools: true }).then(async browser => {
	const { window } = new JSDOM()
	console.log('Running script...')
	var startTime = window.performance.now()

	const page = await browser.newPage()
	let index = 1

	page.setRequestInterception(true)
	page.on('request', req => {

		if (authorizedRessources.includes(req.resourceType()) && authorizedUrl.some(url => req.url().includes(url))) {
			if (['image'].includes(req.resourceType())) {
				console.log('page ' + index + ': ' + req.url())
				index += 1
				if (index <= mangaInformation.page) {
					page.goto(mangaInformation.url + index + '.html')
				} else {
					var endTime = window.performance.now()
					console.log(
						`execution time: ${
							(endTime - startTime) / 1000
						} seconds`
					)
				}
				req.abort()
			} else {
                if(authorizedScript.some(script => req.url().includes(script))) {
                    req.abort()
                }
                else {
                    req.continue()
                }
			}
		} else {

			req.abort()
		}
	})

	await page.goto(mangaInformation.url + index + '.html')
})