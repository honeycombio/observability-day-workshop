# Meminator, AWS SDK Edition

This version of the Meminator services uses the AWS SDK for Node.js to interact with S3,
instead of downloading the file from the internet.

You could use this to download images from a private bucket, instead of a public URL.

To run this, use `docker compost -f docker-compose-awssdk.yaml up --build` (in the root of the repository).

This one expects to receive `imageKey` as a parameter, instead of `imageUrl`. This coordinates with image-picker-awssdk-nodejs.

The bucket is specified in BUCKET_NAME environment variable.
