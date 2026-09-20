const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..'), source=path.resolve(root,'../Template');
fs.cpSync(path.join(source,'dest/assets'),path.join(root,'public/assets'),{recursive:true});
const parts=['vendor/jquery-appear.js','vendor/animation.js','vendor/text-type.js','vendor/backtotop.js','vendor/countdown.js','plugins/color-swatches.js','main.js'];
const behavior=parts.map(file=>{
 let code=fs.readFileSync(path.join(source,'src/assets/js',file),'utf8');
 if(file==='vendor/backtotop.js')code="if (document.querySelector('.rbt-progress-parent path')) {\n"+code+'\n}';
 return '\n/* Original template: '+file+' */\n'+code.replace(/window\.setTimeout/g,'setTimeout').replace(/window\.setInterval/g,'setInterval').replace(/window\.requestAnimationFrame/g,'requestAnimationFrame').replace(/window\.addEventListener\(/g,'scope.windowListener(').replace(/document\.addEventListener\(/g,'scope.documentListener(');
}).join('\n');
fs.mkdirSync(path.join(root,'public/assets/js/angular'),{recursive:true});
fs.writeFileSync(path.join(root,'public/assets/js/angular/template-behaviors.js'),`window.InkersTemplateMount = function(scope) {
const $=scope.$, jQuery=$, setTimeout=scope.setTimeout, setInterval=scope.setInterval, clearTimeout=scope.clearTimeout, clearInterval=scope.clearInterval, requestAnimationFrame=scope.requestAnimationFrame, IntersectionObserver=scope.IntersectionObserver;
${behavior}
};`);
const migrated=new Set(['index.html','home-fashion.html','shop.html','product-single-default.html','cart.html','checkout-delivery-step-one.html']);
for(const file of fs.readdirSync(path.join(source,'dest')).filter(file=>file.endsWith('.html')&&!migrated.has(file)))fs.copyFileSync(path.join(source,'dest',file),path.join(root,'public',file));
const doc=fs.readFileSync(path.join(source,'dest/home-fashion.html'),'utf8');
const head=doc.slice(doc.indexOf('<head>')+6,doc.indexOf('</head>')).replace(/<title>.*?<\/title>/,'<title>InkersCore Storefront</title>');
fs.writeFileSync(path.join(root,'src/index.html'),'<!doctype html>\n<html lang="en"><head><base href="/">\n'+head+'\n<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#2155e8"></head>\n<body class="rbt-header-sticky"><app-root></app-root><noscript>Please enable JavaScript to use this storefront.</noscript></body></html>');
console.log('Copied original assets and static compatibility links; prepared lifecycle adapter.');
