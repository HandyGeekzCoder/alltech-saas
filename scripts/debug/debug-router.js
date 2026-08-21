import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto('http://localhost:3012/login', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/Users/joshuasantos/Desktop/alltech/login-test.png' });
    console.log("Screenshot saved: login-test.png");

    await page.goto('http://localhost:3012/admin-login', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/Users/joshuasantos/Desktop/alltech/admin-test.png' });
    console.log("Screenshot saved: admin-test.png");

    await browser.close();
})();
