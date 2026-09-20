const fs=require('node:fs');const {PNG}=require('pngjs');
const original=PNG.sync.read(fs.readFileSync('public/assets/images/favicon.png'));
for(const size of [72,96,128,144,152,192,384,512]){
 const icon=new PNG({width:size,height:size});
 // Reuse the template favicon with transparent padding; no replacement artwork.
 const scale=(size*.72)/Math.max(original.width,original.height), width=Math.round(original.width*scale),height=Math.round(original.height*scale);
 const left=Math.floor((size-width)/2),top=Math.floor((size-height)/2);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const sx=Math.min(original.width-1,Math.floor(x/scale)),sy=Math.min(original.height-1,Math.floor(y/scale));
  original.data.copy(icon.data,((y+top)*size+x+left)*4,(sy*original.width+sx)*4,(sy*original.width+sx)*4+4);
 }
 fs.writeFileSync(`public/icons/icon-${size}x${size}.png`,PNG.sync.write(icon));
}
fs.writeFileSync('public/manifest.webmanifest',JSON.stringify({id:'/',name:'InkersCore Storefront',short_name:'InkersCore',description:'InkersCore ecommerce storefront',lang:'en',start_url:'/',scope:'/',display:'standalone',theme_color:'#2155e8',background_color:'#ffffff',icons:[72,96,128,144,152,192,384,512].map(size=>({src:`icons/icon-${size}x${size}.png`,sizes:`${size}x${size}`,type:'image/png',purpose:'any'}))},null,2));
console.log('PWA icons use the original',original.width+'x'+original.height,'template favicon.');
