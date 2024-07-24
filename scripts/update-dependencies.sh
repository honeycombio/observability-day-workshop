# Run this from project root

cd services

for d in *-nodejs/ ; do
    cd $d
    echo "Updating dependencies for $d"
    cat package.json | jq '.dependencies | keys[]' -r | grep opentelemetry | sed 's/$/@latest/' |  xargs npm install
    cd ..
done