import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    console.log("Navigating to http://localhost:3012/login");
    await page.goto('http://localhost:3012/login', { waitUntil: 'networkidle2' });

    await new Promise(r => setTimeout(r, 1000));

    console.log("Filling out client credentials...");
    await page.type('input[type="email"]', 'client@company.com');
    // From earlier, client password was set to Admin123! or something? Wait, what's a valid client login?
    // Let's create one first using Admin, or check if we can bypass.
    // Actually, wait, let's just log the HTML of the Sidebar and see if it contains My Sites.

    await browser.close();
})();
