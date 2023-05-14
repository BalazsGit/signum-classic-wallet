rm -Rf dist/
mkdir -p dist dist/js/3rdparty/ dist/css/
cp -r src/css src/fonts src/html src/img dist/
cp -r src/js/3rdparty dist/js
cp src/index.html dist/index.html
cp node_modules/admin-lte/dist/js/adminlte.* dist/js/3rdparty/
cp node_modules/admin-lte/plugins/bootstrap/js/bootstrap.bundle.* dist/js/3rdparty/
cp node_modules/admin-lte/dist/css/adminlte.* dist/css/