cp src/index.html src/index.dev.html && sed -i 's/index.min.js/index.dev.js/g' src/index.dev.html
cp node_modules/admin-lte/dist/js/adminlte.min.js* src/js/3rdparty/
cp node_modules/admin-lte/plugins/bootstrap/js/bootstrap.bundle.* src/js/3rdparty/
cp node_modules/admin-lte/dist/css/adminlte.css* src/css/