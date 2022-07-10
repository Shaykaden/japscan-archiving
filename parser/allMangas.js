// intellisense doesn't seem to work with extra
// this random thing work
const { log } = require('console')
const { JSDOM } = require('jsdom')

if (false) {
	const puppeteer = require('puppeteer')
}
const puppeteer = require('puppeteer-extra')

// add stealth plugin
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const authorizedRessources = ['script', 'document']
const authorizedUrl = ['//www.japscan', 'c.japscan', 'cloudflare']
const authorizedScript = ['axkt-htpgrw.yh.js', 'psktgixhxcv.yh.js']

const mangaInformation = {
	url: 'https://www.japscan.ws/mangas/',
	listPathElement: '#main > div > div.d-flex.flex-wrap.m-5 > div.p-2'
}


puppeteer .launch({
		headless: false,
		userDataDir: '../tmp',
	})
	.then(async browser => {
		const { window } = new JSDOM()
		console.log('Running script...')
		var startTime = window.performance.now()
		let data = []

		const page = await browser.newPage()
		// let index = 1

		page.setRequestInterception(true)
		page.on('request', req => {
			if (
				authorizedRessources.includes(req.resourceType()) &&
				authorizedUrl.some(url => req.url().includes(url))
			) {
				if (
					authorizedScript.some(script => req.url().includes(script))
				) {
					req.abort()
				} else {
					req.continue()
				}
			} else {
				req.abort()
			}
		})

		// await page.goto(mangaInformation.url + index + '.html')
		await page.goto(mangaInformation.url)
		const pagesElement = await page.$("#main > div > ul > li:nth-child(9) > a")
		const numberOfPages = await page.evaluate(el => el.innerHTML, pagesElement)
		// const numberOfPages = 2
		console.log(numberOfPages);


		for (let pageNumber = 1; pageNumber <= numberOfPages; pageNumber++) {
			
			await page.goto(mangaInformation.url + pageNumber)
			const mangaHandles = await page.$$(mangaInformation.listPathElement)

			for (const manga of mangaHandles) {
				const title = await page.evaluate(el => el.querySelector('p > a').innerHTML, manga)
				const link = await page.evaluate(el => el.querySelector('p > a').href, manga)

				const item = {
					title: title,
					link: link
				}
				data.push(item)
			}
			console.log("pages " + pageNumber + " is complete");

		}
		var endTime = window.performance.now()
		console.log(
			`execution time: ${
				(endTime - startTime) / 1000
			} seconds`
		)
		
		console.log(data.length);


	})
