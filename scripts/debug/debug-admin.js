import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    console.log("Navigating to http://localhost:3012/admin-login");
    await page.goto('http://localhost:3012/admin-login', { waitUntil: 'networkidle2' });

    await new Promise(r => setTimeout(r, 1000));

    console.log("Filling out Admin credentials...");
    await page.type('input[type="text"]', 'Admin');
    await page.type('input[type="password"]', 'Admin');

    console.log("Clicking Authenticate...");
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 3000));

    await browser.close();
})();
