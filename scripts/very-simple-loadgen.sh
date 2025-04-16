#!/bin/bash

# Set your endpoint URL
URL="http://localhost:10114/backend/createPicture"

while true; do
    # Call the endpoint and print the HTTP status code
    curl -o /dev/null -X POST -w "%{http_code}\n" $URL

    # Sleep for a random time between 1 and 2 seconds
    sleep $(awk -v min=1 -v max=2 'BEGIN{srand(); print min+rand()*(max-min)}')
done
