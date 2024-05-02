#!/bin/bash

## I can't get this to work, I get Access Denied
## I uploaded them with the console.

# Check if at least two arguments are provided
if [ "$#" -lt 1 ]; then
    echo "Usage: ./upload.sh <file...>"
    exit 1
fi

# Extract the bucket name from the first argument
BUCKET=random-pictures

# Loop through the remaining arguments (filenames)
for FILE in "$@"; do
    if [ -f "$FILE" ]; then
        echo "Uploading $FILE to $BUCKET..."
        aws s3 cp "$FILE" "s3://$BUCKET/"
    else
        echo "$FILE does not exist or is not a file."
    fi
done

echo "Upload completed."
