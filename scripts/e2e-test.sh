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

# Check if the application is already running
if ! docker ps | grep -q "meminator-workshop-web"; then
  echo -e "${YELLOW}Application is not running. Starting it now...${NC}"
  ./run
  
  # Wait for services to be ready
  echo -e "${YELLOW}Waiting for services to be ready...${NC}"
  sleep 10
fi

# Make a request to the application
echo -e "${YELLOW}Making a request to the application...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:10114)

if [ "$RESPONSE" != "200" ]; then
  echo -e "${RED}Failed to get a successful response from the web service. Got HTTP $RESPONSE${NC}"
  exit 1
fi

echo -e "${GREEN}Web service is responding correctly.${NC}"

# Make a request to generate a meme
echo -e "${YELLOW}Generating a meme...${NC}"
MEME_RESPONSE=$(curl -s -o /tmp/meme.jpg -w "%{http_code}" -X POST http://localhost:10115/createPicture)

if [ "$MEME_RESPONSE" != "200" ]; then
  echo -e "${RED}Failed to generate a meme. Got HTTP $MEME_RESPONSE${NC}"
  exit 1
fi

echo -e "${GREEN}Successfully generated a meme.${NC}"

# Check if the meme file was created and has content
if [ ! -s /tmp/meme.jpg ]; then
  echo -e "${RED}Meme file is empty or was not created.${NC}"
  exit 1
fi

echo -e "${GREEN}Meme file was created successfully.${NC}"

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
