const { chromium } = require('playwright');
const fs = require('fs');

// Configuration
const config = {
  baseUrl: 'http://localhost:10114',
  iterations: 10,  // Number of times to click GO and rate
  minDelay: 2000,  // Minimum delay between actions in ms
  maxDelay: 5000,  // Maximum delay between actions in ms
  headless: true,  // Set to false to see the browser
  logFile: './loadgen.log'
};

// Helper function to sleep for a random amount of time
function sleep(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Helper function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}`;
  console.log(logMessage);
  fs.appendFileSync(config.logFile, logMessage + '\n');
}

// Main function
async function runLoadTest() {
  log(`Starting load test with ${config.iterations} iterations`);
  
  // Initialize log file
  if (fs.existsSync(config.logFile)) {
    fs.unlinkSync(config.logFile);
  }
  
  const browser = await chromium.launch({ headless: config.headless });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the page
    log(`Navigating to ${config.baseUrl}`);
    await page.goto(config.baseUrl);
    
    // Wait for the page to load and user-info to be populated
    await page.waitForSelector('.user-info', { state: 'attached' });
    log('Page loaded successfully');
    
    // Get the initial user info
    const userName = await page.textContent('.user-name') || 'Unknown';
    log(`User loaded: ${userName}`);
    
    // Perform multiple iterations of clicking GO and rating
    for (let i = 0; i < config.iterations; i++) {
      log(`Starting iteration ${i + 1}/${config.iterations}`);
      
      // Click the GO button
      log('Clicking GO button');
      await page.click('#go');
      
      // Wait for the image to load
      await page.waitForSelector('#picture', { state: 'visible' });
      log('Image loaded successfully');
      
      // Wait a bit to simulate viewing the image
      await sleep(config.minDelay, config.maxDelay);
      
      // Give a random rating (thumbs up or down)
      const ratingSelector = Math.random() > 0.5 ? '#thumbs-up' : '#thumbs-down';
      const ratingText = ratingSelector === '#thumbs-up' ? 'thumbs up' : 'thumbs down';
      log(`Giving rating: ${ratingText}`);
      await page.click(ratingSelector);
      
      // Wait for the thank you message
      await page.waitForFunction(() => {
        const feedback = document.getElementById('feedback');
        return feedback && feedback.innerText.includes('Thanks for your feedback');
      });
      log('Rating submitted successfully');
      
      // Wait before the next iteration
      if (i < config.iterations - 1) {
        const waitTime = Math.floor(Math.random() * (config.maxDelay - config.minDelay + 1)) + config.minDelay;
        log(`Waiting ${waitTime}ms before next iteration`);
        await sleep(config.minDelay, config.maxDelay);
      }
    }
    
    log('Load test completed successfully');
  } catch (error) {
    log(`Error during load test: ${error.message}`);
    console.error(error);
  } finally {
    await browser.close();
    log('Browser closed');
  }
}

// Run the load test
runLoadTest().catch(console.error);
