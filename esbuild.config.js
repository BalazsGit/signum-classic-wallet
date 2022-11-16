const esbuild = require('esbuild')

const configDev = {
    entryPoints: ['src/js/brs/index.js'],
    outfile: 'src/js/index.dev.js',
    bundle: true,
    minify: false,
    platform: 'browser',
    sourcemap: 'inline',
    target: 'es2020'
}
const configMin = {
    entryPoints: ['src/js/brs/index.js'],
    outfile: 'src/js/index.min.js',
    bundle: true,
    minify: true,
    platform: 'browser',
    sourcemap: false,
    target: 'es2020'
}

esbuild.build(configDev).catch(() => process.exit(1))
esbuild.build(configMin).catch(() => process.exit(1))
