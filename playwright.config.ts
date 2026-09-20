import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests',timeout:60_000,workers:1,
 reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:4302',viewport:{width:1440,height:1000},serviceWorkers:'block',trace:'retain-on-failure',
 launchOptions:{executablePath:process.env['CHROME_PATH']||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--disable-gpu']}},
 webServer:{command:'npm run preview',url:'http://127.0.0.1:4302',reuseExistingServer:true},
});
