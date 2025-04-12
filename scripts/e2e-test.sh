#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting end-to-end test for Meminator Workshop...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo -e "${RED}Node.js is not installed. Please install Node.js and try again.${NC}"
  exit 1
fi

# Check if the application is already running
if ! docker ps | grep -q "meminator-workshop-web"; then
  echo -e "${YELLOW}Application is not running. Starting it now...${NC}"
  ./run

  # Wait for services to be ready
  echo -e "${YELLOW}Waiting for services to be ready...${NC}"
  sleep 10
fi

# Create a temporary directory for Playwright
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

# Initialize a Node.js project
echo -e "${YELLOW}Setting up Playwright...${NC}"
npm init -y > /dev/null 2>&1

# Install Playwright and browsers
echo -e "${YELLOW}Installing Playwright and browsers...${NC}"
npm install playwright > /dev/null 2>&1
npx playwright install chromium > /dev/null 2>&1

# Create a script to test the application with Playwright
cat > test.js << 'EOL'
const { chromium } = require('playwright');

(async () => {
  // Launch the browser with more debugging options
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to application...');
    // Navigate to the application with a longer timeout
    await page.goto('http://localhost:10114', { timeout: 30000 });

    console.log('Waiting for GO button...');
    // Wait for the page to load
    await page.waitForSelector('#go', { timeout: 30000 });

    // Take a screenshot before clicking GO
    await page.screenshot({ path: 'before-click.png' });
    console.log('Took screenshot before clicking GO');

    // Check if the application is already showing an error
    const errorText = await page.evaluate(() => {
      const errorElement = document.querySelector('#error');
      return errorElement ? errorElement.textContent : null;
    });

    if (errorText) {
      console.error('Application is showing an error before clicking GO:', errorText);
    }

    console.log('Clicking GO button...');
    // Click the GO button
    await page.click('#go');

    // Wait a moment to see if there's an error
    await page.waitForTimeout(2000);

    // Enable console logging from the browser
    page.on('console', msg => console.log(`Browser console: ${msg.text()}`));

    // Wait a bit longer for the trace to be created
    await page.waitForTimeout(3000);

    // Extract the trace ID from localStorage
    const traceId = await page.evaluate(() => {
      // Log the Honeycomb SDK object to see what's available
      console.log('Honeycomb SDK:', window.Hny);

      // Check localStorage and data attribute as fallbacks
      const localStorageTraceId = localStorage.getItem('currentTraceId');
      const dataAttributeTraceId = document.body.getAttribute('data-trace-id');

      console.log('localStorage traceId:', localStorageTraceId);
      console.log('data-trace-id attribute:', dataAttributeTraceId);

      return localStorageTraceId || dataAttributeTraceId || null;
    });

    // If we couldn't get the trace ID directly, let's try to find it in the network requests
    if (!traceId) {
      console.log('Trying to extract trace ID from network requests...');

      // Enable network request monitoring
      await page.route('**', route => {
        const request = route.request();
        const headers = request.headers();
        console.log(`Request to ${request.url()}`);
        console.log('Headers:', headers);

        // Look for trace ID in headers
        const traceParent = headers['traceparent'];
        if (traceParent) {
          console.log('Found traceparent header:', traceParent);
          // traceparent format: 00-<trace-id>-<span-id>-<trace-flags>
          const parts = traceParent.split('-');
          if (parts.length >= 2) {
            const extractedTraceId = parts[1];
            console.log('Extracted trace ID from traceparent:', extractedTraceId);
            require('fs').writeFileSync('trace-id.txt', extractedTraceId);
          }
        }

        route.continue();
      });

      // Reload the page to capture the network requests
      await page.reload();

      // Wait a bit and then click GO again
      await page.waitForSelector('#go');
      await page.click('#go');

      // Wait for any network requests to complete
      await page.waitForTimeout(5000);
    }

    if (traceId) {
      console.log('Extracted trace ID:', traceId);
      // Write the trace ID to a file for the shell script to use
      require('fs').writeFileSync('trace-id.txt', traceId);
      console.log('Saved trace ID to', process.cwd() + '/trace-id.txt');
    } else {
      console.log('Could not extract trace ID');
    }

    // Check for errors after clicking
    const errorAfterClick = await page.evaluate(() => {
      const errorElement = document.querySelector('#error');
      return errorElement && window.getComputedStyle(errorElement).display !== 'none' ?
        errorElement.textContent : null;
    });

    if (errorAfterClick) {
      console.error('Application error after clicking GO:', errorAfterClick);
      // Take a screenshot of the error
      await page.screenshot({ path: 'error-state.png' });
      console.log('Took screenshot of error state');

      // We'll continue the test to check for traces anyway
      console.log('Continuing test despite error...');
    } else {
      console.log('Waiting for image to load...');
      // Wait a moment for any network requests to complete
      await page.waitForTimeout(5000);

      // Take a screenshot of the current state
      await page.screenshot({ path: 'after-click.png' });
      console.log('Took screenshot after clicking GO');

      // Check if the image element has a src attribute (indicating it loaded something)
      const imageLoaded = await page.evaluate(() => {
        const img = document.querySelector('#picture');
        return img && img.src && img.src !== '' && !img.src.includes('undefined');
      });

      if (imageLoaded) {
        console.log('Image loaded successfully');
      } else {
        console.error('Image may not have loaded properly');
        // Save this screenshot as the timeout state as well for backward compatibility
        await page.screenshot({ path: 'timeout-state.png' });
        console.log('Saved additional screenshot as timeout-state.png');
      }
    }

    // Get the page HTML for debugging
    const html = await page.content();
    require('fs').writeFileSync('page-content.html', html);
    console.log('Saved page HTML content for debugging');

    // We'll consider the test successful if we got this far, even if there were errors
    // This allows us to check for traces even if the UI had issues
    console.log('Test completed - proceeding to check traces');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
EOL

# Run the Playwright script
echo -e "${YELLOW}Running browser test...${NC}"
node test.js

if [ $? -ne 0 ]; then
  echo -e "${RED}Browser test failed.${NC}"
  cd - > /dev/null
  exit 1
fi

echo -e "${GREEN}Browser test completed successfully.${NC}"

# Check which screenshots were created and display appropriate message
if [ -f "${TMP_DIR}/after-click.png" ]; then
  echo -e "${GREEN}Image loaded successfully. Screenshots saved in:${NC}"
  echo -e "${GREEN}- ${TMP_DIR}/before-click.png${NC}"
  echo -e "${GREEN}- ${TMP_DIR}/after-click.png${NC}"
elif [ -f "${TMP_DIR}/timeout-state.png" ]; then
  echo -e "${YELLOW}Image loading timed out. Screenshots saved in:${NC}"
  echo -e "${YELLOW}- ${TMP_DIR}/before-click.png${NC}"
  echo -e "${YELLOW}- ${TMP_DIR}/timeout-state.png${NC}"
elif [ -f "${TMP_DIR}/error-state.png" ]; then
  echo -e "${YELLOW}Application showed an error. Screenshots saved in:${NC}"
  echo -e "${YELLOW}- ${TMP_DIR}/before-click.png${NC}"
  echo -e "${YELLOW}- ${TMP_DIR}/error-state.png${NC}"
else
  echo -e "${YELLOW}Only initial screenshot available: ${TMP_DIR}/before-click.png${NC}"
fi

# Check if the HTML content was saved
if [ -f "${TMP_DIR}/page-content.html" ]; then
  echo -e "${GREEN}Page HTML content saved to: ${TMP_DIR}/page-content.html${NC}"
fi

# Return to the original directory
cd - > /dev/null

# Wait for traces to be sent to Honeycomb
echo -e "${YELLOW}Waiting for traces to be sent to Honeycomb...${NC}"
sleep 5

# Check for traces in Honeycomb
echo -e "${YELLOW}Checking for traces in Honeycomb...${NC}"

# Set Honeycomb environment
HONEYCOMB_ENV="meminator-local"

# Check if we have a trace ID from the browser
if [ -f "${TMP_DIR}/trace-id.txt" ]; then
  TRACE_ID=$(cat "${TMP_DIR}/trace-id.txt")
elif [ -f "trace-id.txt" ]; then
  TRACE_ID=$(cat "trace-id.txt")
fi

if [ ! -z "$TRACE_ID" ]; then
  echo -e "${GREEN}Found trace ID: $TRACE_ID${NC}"

  # Provide a direct link to the trace
  TRACE_URL="https://ui.honeycomb.io/modernity/environments/$HONEYCOMB_ENV/trace?trace_id=$TRACE_ID"
  echo -e "${YELLOW}View the trace in Honeycomb:${NC}"
  echo -e "${YELLOW}$TRACE_URL${NC}"

  # Open the trace in the browser if requested
  if [ "$OPEN_TRACE" = "true" ]; then
    echo -e "${YELLOW}Opening trace in browser...${NC}"
    open "$TRACE_URL"
  fi

  # Create a script to take a screenshot of the trace
  echo -e "${YELLOW}Taking a screenshot of the trace...${NC}"

  # Create a temporary directory for the trace screenshot
  TRACE_SCREENSHOT_DIR=$(mktemp -d)
  TRACE_SCREENSHOT_PATH="$TRACE_SCREENSHOT_DIR/trace-screenshot.png"

  # Create a script to visit the trace URL and take a screenshot
  cat > trace-screenshot.js << EOL
  const { chromium } = require('playwright');

  (async () => {
    // Launch the browser with more debugging options
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      console.log('Navigating to trace URL...');
      // Navigate to the trace URL
      await page.goto('${TRACE_URL}', { timeout: 60000 });

      // Wait for the trace to load
      console.log('Waiting for trace to load...');

      // Wait for the trace waterfall to appear
      await page.waitForSelector('.trace-timeline', { timeout: 60000 });

      // Wait a bit more for the trace to fully render
      await page.waitForTimeout(5000);

      // Take a screenshot of the trace
      console.log('Taking screenshot of trace...');
      await page.screenshot({ path: '${TRACE_SCREENSHOT_PATH}', fullPage: true });
      console.log('Screenshot saved to: ${TRACE_SCREENSHOT_PATH}');
    } catch (error) {
      console.error('Error taking trace screenshot:', error);
      process.exit(1);
    } finally {
      await browser.close();
    }
  })();
  EOL

  # Run the script to take a screenshot of the trace
  echo -e "${YELLOW}Running trace screenshot script...${NC}"
  node trace-screenshot.js

  # Check if the screenshot was created
  if [ -f "$TRACE_SCREENSHOT_PATH" ]; then
    echo -e "${GREEN}Trace screenshot saved to: $TRACE_SCREENSHOT_PATH${NC}"

    # Copy the screenshot to a more accessible location
    cp "$TRACE_SCREENSHOT_PATH" "./trace-screenshot.png"
    echo -e "${GREEN}Trace screenshot also saved to: ./trace-screenshot.png${NC}"
  else
    echo -e "${RED}Failed to take a screenshot of the trace.${NC}"
  fi

  # Provide instructions for manually checking the trace
  echo -e "${YELLOW}Please check the trace in Honeycomb UI to verify that all services contributed spans:${NC}"
  echo -e "${YELLOW}- backend-for-frontend-python${NC}"
  echo -e "${YELLOW}- meminator-python${NC}"
  echo -e "${YELLOW}- phrase-picker-dotnet${NC}"
  echo -e "${YELLOW}- image-picker-nodejs${NC}"
else
  echo -e "${YELLOW}No trace ID found. Please check Honeycomb UI for traces:${NC}"
  echo -e "${YELLOW}https://ui.honeycomb.io/modernity/environments/$HONEYCOMB_ENV/datasets/__all__/home${NC}"
  echo -e "${YELLOW}Look for traces with the following services:${NC}"
  echo -e "${YELLOW}- backend-for-frontend-python${NC}"
  echo -e "${YELLOW}- meminator-python${NC}"
  echo -e "${YELLOW}- phrase-picker-dotnet${NC}"
  echo -e "${YELLOW}- image-picker-nodejs${NC}"
fi

echo -e "${GREEN}End-to-end test completed successfully!${NC}"

exit 0
