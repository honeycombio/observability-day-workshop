const esbuild = require('esbuild');
const { copy } = require('esbuild-plugin-copy');
const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Copy the HTML file and modify it to point to the bundled JS
const htmlContent = fs.readFileSync('static/index.html', 'utf8');
const modifiedHtml = htmlContent.replace(
  '<script type="text/javascript" src="../src/index.js">',
  '<script type="text/javascript" src="./index.js">'
);
fs.writeFileSync('dist/index.html', modifiedHtml);

// Build with esbuild
esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: ['es2020'],
  outfile: 'dist/index.js',
  define: {
    'process.env.HONEYCOMB_API_KEY': JSON.stringify(process.env.HONEYCOMB_API_KEY || '')
  },
  plugins: [
    copy({
      assets: [
        { from: ['static/favicon.ico'], to: ['favicon.ico'] },
        { from: ['static/loading-meme.gif'], to: ['loading-meme.gif'] },
        { from: ['static/o11day-logo.png'], to: ['o11day-logo.png'] }
      ]
    })
  ]
}).then(() => {
  console.log('Build completed successfully!');
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
