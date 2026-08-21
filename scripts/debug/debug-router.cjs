const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    console.log("Navigating to http://localhost:3012/");
    await page.goto('http://localhost:3012/', { waitUntil: 'networkidle2' });

    console.log("Clicking Client Portal link...");
    await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const portalLink = links.find(l => l.textContent.includes('Client Portal'));
        if (portalLink) portalLink.click();
    });

    await new Promise(r => setTimeout(r, 2000))(2000);

    console.log("Clicking Admin Login link...");
    await page.goto('http://localhost:3012/admin-login', { waitUntil: 'networkidle2' });

    await browser.close();
})();
