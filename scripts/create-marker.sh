#!/bin/bash

ref=$(git rev-parse HEAD | cut -c1-10)
if [[ -z "$VERSION_NUMBER" ]]; then
    message="ref:$ref"
else
    message="v$VERSION_NUMBER $1 ref:$ref"
fi
body=$(echo '{"message":"'$message'", "type":"deploy"}')

if [[ -z "$1" ]]; then
  dataset="__all__"
elif [[ "$1" == "web" ]]; then
  dataset="web"
elif [[ "$1" == "loadgen" ]]; then
  dataset="meminator-loadgen"
else
  dataset="$1-nodejs" 
fi

echo "dataset: $dataset"

curl https://api.honeycomb.io/1/markers/${dataset} -X POST  \
    -H "X-Honeycomb-Team: ${HONEYCOMB_API_KEY}"  \
    -d "$body"
