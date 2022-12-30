rm -Rf dist/
mkdir -p dist dist/js/3rdparty/ dist/css/
cp src/index.html dist/index.html
cp src/index.html dist/index.dev.html && sed -i 's/index.min.js/index.dev.js/g' dist/index.dev.html
cp node_modules/admin-lte/dist/js/adminlte.* dist/js/3rdparty/
cp node_modules/admin-lte/plugins/bootstrap/js/bootstrap.bundle.* dist/js/3rdparty/
cp node_modules/admin-lte/dist/css/adminlte.* dist/css/