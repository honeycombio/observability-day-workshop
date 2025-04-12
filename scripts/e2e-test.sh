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
  // Launch the browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the application
    await page.goto('http://localhost:10114');

    // Wait for the page to load
    await page.waitForSelector('#go');

    // Take a screenshot before clicking GO
    await page.screenshot({ path: 'before-click.png' });

    // Click the GO button
    await page.click('#go');

    // Wait for the image to load (the picture element becomes visible)
    await page.waitForSelector('#picture[style*="display:block"]', { timeout: 30000 });

    // Take a screenshot after the image is loaded
    await page.screenshot({ path: 'after-click.png' });

    // Check if the image is displayed
    const isImageDisplayed = await page.evaluate(() => {
      const img = document.querySelector('#picture');
      return img && window.getComputedStyle(img).display !== 'none';
    });

    if (!isImageDisplayed) {
      console.error('Image is not displayed');
      process.exit(1);
    }

    console.log('Test completed successfully!');
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
echo -e "${GREEN}Screenshots saved in ${TMP_DIR}/before-click.png and ${TMP_DIR}/after-click.png${NC}"

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

# Query Honeycomb for recent traces
RECENT_TRACES=$(curl -s \
  -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
  "https://api.honeycomb.io/1/events/$HONEYCOMB_ENV/__all__?start_time=$(date -u -v-1M +%s)&end_time=$(date -u +%s)&limit=10")

if echo "$RECENT_TRACES" | grep -q "error"; then
  echo -e "${RED}Error querying Honeycomb API: $(echo "$RECENT_TRACES" | jq -r '.error')${NC}"
  exit 1
fi

# Check if we have any traces
TRACE_COUNT=$(echo "$RECENT_TRACES" | jq -r '. | length')

if [ "$TRACE_COUNT" -eq 0 ]; then
  echo -e "${RED}No traces found in Honeycomb.${NC}"
  exit 1
fi

echo -e "${GREEN}Found $TRACE_COUNT recent traces in Honeycomb.${NC}"

# Get the most recent trace ID
TRACE_ID=$(echo "$RECENT_TRACES" | jq -r '.[0].trace.trace_id')

echo -e "${GREEN}Most recent trace ID: $TRACE_ID${NC}"

# Query for spans in this trace
TRACE_SPANS=$(curl -s \
  -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
  "https://api.honeycomb.io/1/events/$HONEYCOMB_ENV/__all__?trace_id=$TRACE_ID")

# Check for spans from each service
SERVICES=("backend-for-frontend-python" "meminator-python" "phrase-picker-dotnet" "image-picker-nodejs")
MISSING_SERVICES=()

for SERVICE in "${SERVICES[@]}"; do
  if ! echo "$TRACE_SPANS" | jq -r '.[].service.name' | grep -q "$SERVICE"; then
    MISSING_SERVICES+=("$SERVICE")
  fi
done

if [ ${#MISSING_SERVICES[@]} -gt 0 ]; then
  echo -e "${RED}The following services did not contribute spans to the trace:${NC}"
  for SERVICE in "${MISSING_SERVICES[@]}"; do
    echo -e "${RED}- $SERVICE${NC}"
  done
  exit 1
fi

echo -e "${GREEN}All services contributed spans to the trace:${NC}"
for SERVICE in "${SERVICES[@]}"; do
  SPAN_COUNT=$(echo "$TRACE_SPANS" | jq -r ".[].service.name | select(. == \"$SERVICE\") | ." | wc -l | tr -d ' ')
  echo -e "${GREEN}- $SERVICE: $SPAN_COUNT spans${NC}"
done

# Print a link to view the trace in Honeycomb
echo -e "${GREEN}End-to-end test completed successfully!${NC}"
echo -e "${YELLOW}View the trace in Honeycomb:${NC}"
echo -e "${YELLOW}https://ui.honeycomb.io/modernity/environments/$HONEYCOMB_ENV/trace?trace_id=$TRACE_ID${NC}"

exit 0
