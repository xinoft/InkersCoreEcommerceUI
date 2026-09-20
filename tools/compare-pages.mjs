import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'node:fs';
fs.mkdirSync('artifacts', {recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--disable-gpu']});
const definitions=[['home-fashion','home'],['shop','products'],['product-single-default','product-details'],['cart','cart'],['checkout-delivery-step-one','checkout']];
const selected=process.env.VISUAL_ROUTE;
const reports=selected&&fs.existsSync('artifacts/visual-comparison.json')?JSON.parse(fs.readFileSync('artifacts/visual-comparison.json','utf8')).filter(r=>r.route!==selected):[];
for(const width of [1440,768,390])for(const [file,route] of definitions.filter(([file,route])=>!selected||selected===route)){
 const pages=[];
 for(const source of ['original','angular']){
  const page=await browser.newPage({viewport:{width,height:1000},serviceWorkers:'block'});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'&&!message.text().includes('Failed to load resource'))errors.push(message.text());});
  await page.route(/https:\/\/(www\.youtube\.com|www\.google\.com)\//,route=>route.fulfill({body:'',contentType:'text/html'}));
  await page.goto(source==='original'?`http://127.0.0.1:4301/${file}.html`:`http://127.0.0.1:4300/${route}`,{waitUntil:'load'});
  if(source==='angular')await page.waitForSelector('[data-storefront-ready]',{state:'attached',timeout:20000});
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1000);
  const height=await page.evaluate(()=>document.body.scrollHeight);
  for(let y=0;y<height;y+=750){await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(80);}
  await page.waitForTimeout(1000);
  await page.evaluate(()=>{document.querySelectorAll('.swiper-initialized').forEach(el=>{el.swiper?.autoplay?.stop();el.swiper?.slideToLoop(0,0);});window.scrollTo(0,0);});
  await page.waitForTimeout(2500);
  const buffer=await page.screenshot({path:`artifacts/${route}-${width}-${source}.png`,fullPage:true,animations:'disabled',timeout:60000});
  await page.screenshot({path:`artifacts/${route}-${width}-${source}-viewport.png`,animations:'disabled'});
  const metrics=await page.evaluate(()=>({images:document.images.length,sliders:document.querySelectorAll('.swiper-initialized').length,width:document.documentElement.scrollWidth,brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.getAttribute('src'))}));
  await page.close();pages.push({source,errors,metrics,buffer});
 }
 const a=PNG.sync.read(pages[0].buffer),b=PNG.sync.read(pages[1].buffer);let mismatchPercent=null;
 if(a.width===b.width&&a.height===b.height){const diff=new PNG({width:a.width,height:a.height});mismatchPercent=pixelmatch(a.data,b.data,diff.data,a.width,a.height,{threshold:.15})/(a.width*a.height)*100;fs.writeFileSync(`artifacts/${route}-${width}-diff.png`,PNG.sync.write(diff));}
 const report={route,width,mismatchPercent,dimensions:[[a.width,a.height],[b.width,b.height]],pages:pages.map(({buffer,...info})=>info)};
 reports.push(report);console.log(JSON.stringify(report));fs.writeFileSync('artifacts/visual-comparison.json',JSON.stringify(reports,null,2));
}
await browser.close();
if(reports.some(r=>r.mismatchPercent===null||r.mismatchPercent>0.5||r.pages.some(p=>p.errors.length)))process.exitCode=1;


