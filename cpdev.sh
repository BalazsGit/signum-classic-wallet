cp -r src/css src/fonts src/html src/img dist/
cp -r src/js/3rdparty dist/js
cp src/index.html dist/index.html
cp src/index.html dist/index.dev.html && sed -i 's/index.min.js/index.dev.js/g' dist/index.dev.html
