import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('docs/screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  console.log('🚀 Starting Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set viewport to mobile-first dimension (iPhone 13 Pro-like)
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2
  });

  try {
    console.log('🌐 Navigating to login page...');
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle2' });

    console.log('🔑 Entering demo seed credentials...');
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'demo@fintrack.app');
    await page.type('input[type="password"]', 'Demo@1234');

    console.log('🖱️ Clicking sign-in button...');
    const submitBtn = await page.waitForSelector('button[type="submit"]');
    await Promise.all([
      submitBtn.click(),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    console.log('✅ Logged in successfully. Redirected to:', page.url());
    
    // Wait for the dashboard and charts to finish rendering
    console.log('📊 Waiting for dashboard data to load...');
    await new Promise(resolve => setTimeout(resolve, 4000)); // Wait for animations to complete

    const dashboardPath = path.join(SCREENSHOT_DIR, 'dashboard.png');
    console.log(`📸 Saving dashboard screenshot to: ${dashboardPath}`);
    await page.screenshot({ path: dashboardPath });

    // Navigate to Chat page
    console.log('💬 Navigating to Chat page...');
    await page.goto('http://localhost:8080/chat', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.border-border');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Allow messages to animate in

    const chatPath = path.join(SCREENSHOT_DIR, 'chat.png');
    console.log(`📸 Saving chat screenshot to: ${chatPath}`);
    await page.screenshot({ path: chatPath });

    console.log('🎉 Screenshots successfully generated!');
  } catch (error) {
    console.error('❌ Error during capture process:', error);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed.');
  }
}

capture();
