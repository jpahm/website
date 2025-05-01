#!/bin/bash

cd "$(dirname "$0")"

echo "// Auto-generated command imports" > index.js

for file in *.js; do
    [[ "$file" == "index.js" ]] && continue
    echo "import \"./$file\";" >> index.js
done

echo "Generated index.js with imports:"
cat index.js