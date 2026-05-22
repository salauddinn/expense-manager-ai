import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('docs/screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BASE_URL = 'http://localhost:8080';

// Page definitions
const publicPages = [
  { name: 'landing', url: '/' },
  { name: 'login', url: '/login' },
  { name: 'signup', url: '/signup' },
  { name: 'privacy', url: '/privacy' },
  { name: 'terms', url: '/terms' },
  { name: 'install', url: '/install' }
];

const authPages = [
  { name: 'dashboard', url: '/dashboard', waitTime: 4000 },
  { name: 'chat', url: '/chat', waitTime: 3000 },
  { name: 'transactions', url: '/transactions', waitTime: 3000 },
  { name: 'accounts', url: '/accounts', waitTime: 3000 },
  { name: 'account_detail', url: '/accounts/b1b2c3d4-0001-0000-0000-000000000001', waitTime: 3000 },
  { name: 'card_detail', url: '/accounts/c1b2c3d4-0001-0000-0000-000000000001', waitTime: 3000 },
  { name: 'budget', url: '/budget', waitTime: 3000 },
  { name: 'goals', url: '/goals', waitTime: 3000 },
  { name: 'goal_detail', url: '/goals/d1b2c3d4-0001-0000-0000-000000000001', waitTime: 3000 },
  { name: 'loan_calculator', url: '/loan-calculator', waitTime: 3000 },
  { name: 'insights', url: '/insights', waitTime: 4000 },
  { name: 'recurring', url: '/recurring', waitTime: 3000 },
  { name: 'not_found', url: '/non-existent-page-route', waitTime: 2000 }
];

async function captureAll() {
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
    // 1. Capture Unauthenticated Pages
    console.log('📸 Starting public pages capture...');
    for (const p of publicPages) {
      const fullUrl = `${BASE_URL}${p.url}`;
      console.log(`🌐 Navigating to public page: ${p.name} (${fullUrl})...`);
      await page.goto(fullUrl, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 1500)); // Allow transitions/renders
      
      const screenshotPath = path.join(SCREENSHOT_DIR, `${p.name}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`✅ Captured: ${screenshotPath}`);
    }

    // 2. Perform Login
    const loginUrl = `${BASE_URL}/login`;
    console.log(`🔑 Logging in at ${loginUrl}...`);
    await page.goto(loginUrl, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'demo@fintrack.app');
    await page.type('input[type="password"]', 'Demo@1234');
    
    const submitBtn = await page.waitForSelector('button[type="submit"]');
    await Promise.all([
      submitBtn.click(),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
    console.log('✅ Logged in successfully. Current URL:', page.url());

    // 3. Capture Authenticated Pages
    console.log('📸 Starting authenticated pages capture...');
    for (const p of authPages) {
      const fullUrl = `${BASE_URL}${p.url}`;
      console.log(`🌐 Navigating to: ${p.name} (${fullUrl})...`);
      
      // Go to page
      await page.goto(fullUrl, { waitUntil: 'networkidle2' });
      
      // Additional wait for data loading / animations / charts
      await new Promise(resolve => setTimeout(resolve, p.waitTime || 3000));
      
      const screenshotPath = path.join(SCREENSHOT_DIR, `${p.name}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`✅ Captured: ${screenshotPath}`);
    }

    console.log('🎉 All screenshots successfully generated!');
  } catch (error) {
    console.error('❌ Error during capture process:', error);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed.');
  }
}

captureAll();
