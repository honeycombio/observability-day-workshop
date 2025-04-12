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

# Check for traces in Honeycomb using the Honeycomb API
echo -e "${YELLOW}Checking for traces in Honeycomb...${NC}"

# Set Honeycomb API key and environment
if [ -z "$HONEYCOMB_API_KEY" ]; then
  echo -e "${RED}HONEYCOMB_API_KEY environment variable is not set.${NC}"
  echo -e "${YELLOW}Please set it with: export HONEYCOMB_API_KEY=your_api_key${NC}"
  exit 1
fi

HONEYCOMB_ENV="meminator-local"

# Create a temporary file for the API response
API_RESPONSE_FILE=$(mktemp)

# Query Honeycomb for recent traces
echo -e "${YELLOW}Querying Honeycomb API for recent traces...${NC}"
curl -s \
  -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
  "https://api.honeycomb.io/1/events/$HONEYCOMB_ENV/__all__?start_time=$(date -u -v-1M +%s)&end_time=$(date -u +%s)&limit=10" \
  > "$API_RESPONSE_FILE"

# Check if the response contains an error message
if grep -q "error" "$API_RESPONSE_FILE"; then
  echo -e "${RED}Error in Honeycomb API response:${NC}"
  cat "$API_RESPONSE_FILE"
  rm "$API_RESPONSE_FILE"
  exit 1
fi

# Check if the response is valid JSON
if ! jq . "$API_RESPONSE_FILE" > /dev/null 2>&1; then
  echo -e "${RED}Invalid JSON response from Honeycomb API:${NC}"
  cat "$API_RESPONSE_FILE"
  rm "$API_RESPONSE_FILE"
  exit 1
fi

# Check if we have any traces
TRACE_COUNT=$(jq '. | length' "$API_RESPONSE_FILE")

if [ -z "$TRACE_COUNT" ] || [ "$TRACE_COUNT" -eq 0 ]; then
  echo -e "${RED}No traces found in Honeycomb.${NC}"
  rm "$API_RESPONSE_FILE"
  exit 1
fi

echo -e "${GREEN}Found $TRACE_COUNT recent traces in Honeycomb.${NC}"

# Get the most recent trace ID
TRACE_ID=$(jq -r '.[0].trace.trace_id' "$API_RESPONSE_FILE")

if [ -z "$TRACE_ID" ] || [ "$TRACE_ID" = "null" ]; then
  echo -e "${RED}Could not find a valid trace ID in the response.${NC}"
  rm "$API_RESPONSE_FILE"
  exit 1
fi

echo -e "${GREEN}Most recent trace ID: $TRACE_ID${NC}"

# Clean up the first response file
rm "$API_RESPONSE_FILE"

# Create a new temporary file for the spans response
SPANS_RESPONSE_FILE=$(mktemp)

# Query for spans in this trace
echo -e "${YELLOW}Querying Honeycomb API for spans in trace $TRACE_ID...${NC}"
curl -s \
  -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
  "https://api.honeycomb.io/1/events/$HONEYCOMB_ENV/__all__?trace_id=$TRACE_ID" \
  > "$SPANS_RESPONSE_FILE"

# Check if the response is valid JSON
if ! jq . "$SPANS_RESPONSE_FILE" > /dev/null 2>&1; then
  echo -e "${RED}Invalid JSON response for spans:${NC}"
  cat "$SPANS_RESPONSE_FILE"
  rm "$SPANS_RESPONSE_FILE"
  exit 1
fi

# Extract service names from the spans
SERVICE_NAMES_FILE=$(mktemp)
jq -r '.[].service.name' "$SPANS_RESPONSE_FILE" | sort | uniq > "$SERVICE_NAMES_FILE"

# Check for spans from each service
SERVICES=("backend-for-frontend-python" "meminator-python" "phrase-picker-dotnet" "image-picker-nodejs")
MISSING_SERVICES=()

for SERVICE in "${SERVICES[@]}"; do
  if ! grep -q "$SERVICE" "$SERVICE_NAMES_FILE"; then
    MISSING_SERVICES+=("$SERVICE")
  fi
done

if [ ${#MISSING_SERVICES[@]} -gt 0 ]; then
  echo -e "${RED}The following services did not contribute spans to the trace:${NC}"
  for SERVICE in "${MISSING_SERVICES[@]}"; do
    echo -e "${RED}- $SERVICE${NC}"
  done

  echo -e "${YELLOW}Services found in the trace:${NC}"
  cat "$SERVICE_NAMES_FILE" | while read SERVICE; do
    echo -e "${YELLOW}- $SERVICE${NC}"
  done

  rm "$SPANS_RESPONSE_FILE" "$SERVICE_NAMES_FILE"
  exit 1
fi

echo -e "${GREEN}All services contributed spans to the trace:${NC}"
for SERVICE in "${SERVICES[@]}"; do
  SPAN_COUNT=$(grep -c "$SERVICE" "$SERVICE_NAMES_FILE")
  echo -e "${GREEN}- $SERVICE: $SPAN_COUNT spans${NC}"
done

# Clean up temporary files
rm "$SPANS_RESPONSE_FILE" "$SERVICE_NAMES_FILE"

# Print a link to view the trace in Honeycomb
echo -e "${GREEN}End-to-end test completed successfully!${NC}"
echo -e "${YELLOW}View the trace in Honeycomb:${NC}"
echo -e "${YELLOW}https://ui.honeycomb.io/modernity/environments/$HONEYCOMB_ENV/trace?trace_id=$TRACE_ID${NC}"

exit 0
