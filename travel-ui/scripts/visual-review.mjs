// Browser-only visual review via Chrome DevTools Protocol; no package dependency.
// QA fixtures are injected into the isolated browser profile, never app source.
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const reference = process.argv.includes("--reference");
const catalogMode = process.argv.includes("--catalog");
const output = path.resolve(process.env.UI_REVIEW_OUTPUT || "artifacts/tourism-review");
await mkdir(output, { recursive: true });
const port = 9400 + Math.floor(Math.random() * 1000);
const baseURL = process.env.UI_REVIEW_BASE || "http://127.0.0.1:4173";
const profile = path.join(os.tmpdir(), "vtra-review-" + Date.now());
const browser = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=" + port, "--user-data-dir=" + profile, "--remote-allow-origins=*", "about:blank"], { windowsHide: true, stdio: "ignore" });
const keepAlive = setInterval(() => {}, 1000);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let connection;
for (let i = 0; i < 50; i++) { try { connection = await fetch("http://127.0.0.1:" + port + "/json/version").then((r) => r.json()); break; } catch { await wait(200); } }
if (!connection) { browser.kill(); throw new Error("Chrome debugging endpoint did not start"); }

async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { const p = pending.get(message.id); pending.delete(message.id); message.error ? p.reject(new Error(JSON.stringify(message.error))) : p.resolve(message.result); }
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text + ": " + (message.params.exceptionDetails.exception?.description || ""));
  });
  ws.addEventListener("close", () => { for (const p of pending.values()) p.reject(new Error("Browser connection closed")); pending.clear(); });
  function send(method, params = {}) { return new Promise((resolve, reject) => { const current = ++id; const timer = setTimeout(() => { pending.delete(current); reject(new Error("CDP timeout: " + method)); }, 15000); pending.set(current, { resolve: (value) => { clearTimeout(timer); resolve(value); }, reject: (error) => { clearTimeout(timer); reject(error); } }); ws.send(JSON.stringify({ id: current, method, params })); }); }
  async function evaluate(expression) { const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result?.value; }
  return { ws, send, evaluate, errors };
}

const fixture = `(() => {
 const now=Date.now(); const date=new Date().toISOString().slice(0,10);
 const points=[{province:"Hà Nội",lat:21.0278,lon:105.8342},{province:"TP Hồ Chí Minh",lat:10.7769,lon:106.7009},{province:"Quảng Ninh",lat:20.95,lon:107.08},{province:"Quảng Nam",lat:15.57,lon:108.47},{province:"Lâm Đồng",lat:11.94,lon:108.44},{province:"Đà Nẵng",lat:16.05,lon:108.2}];
 const weather={temperature:27,humidity:78,precipitation:4,wind:18,visibility_km:8,uv_index:5,pm25:21,risk_score:4.8,adjusted_risk_score:4.8,adjusted_reason:"Dữ liệu kiểm thử giao diện — có mưa."};
 const trip={from:{lat:21.0278,lon:105.8342},to:{name:"Hạ Long",province_inferred:"Quảng Ninh",lat:20.95,lon:107.08},weather,risk:{data_status:"stale",num_articles:2,latest_article_date:"2026-01-23"},traffic:{distance_km:156,time_normal_human:"2 giờ 30 phút",traffic_available:false,route_available:true},recommendation:"CẨN THẬN"};
 const daily=Array.from({length:7},(_,i)=>({...weather,date:new Date(now+i*86400000).toISOString().slice(0,10),temperature:27+i%3,adjusted_risk_score:3.5+i*.4}));
 const original=window.fetch.bind(window);
 window.fetch=async(input,options)=>{const url=new URL(typeof input==="string"?input:input.url,location.origin); let data;
 if(url.pathname==="/map/points"&&location.search.includes("qa=api-error"))return new Response(JSON.stringify({detail:"QA: dịch vụ điểm đến tạm thời không khả dụng"}),{status:503,headers:{"Content-Type":"application/json"}});
 if(url.pathname==="/map/points")data={points};
 else if(url.pathname==="/map/heat")data={points:[]};
 else if(url.pathname==="/api/auth/login"||url.pathname==="/api/auth/register")data={user:{email:"qa@example.test"},token:"qa-only"};
 else if(url.pathname==="/trip")data=trip;
 else if(url.pathname==="/weather/ai/forecast")data={daily};
 else if(url.pathname==="/api/trip-history")data={results:[]};
 else if(url.pathname==="/api/notifications/vapid-public-key")data={publicKey:""};
 else if(url.pathname==="/api/notifications/subscriptions")data={subscriptions:[]};
 else if(url.pathname==="/risk/events")data={events:[]};
 else if(url.pathname==="/risk/compare")data={results:[]};
 else if(url.pathname==="/risk")data={num_articles:0,is_stale:true,latest_article_date:null,overall_risk_score:0};
 else return original(input,options);
 return new Response(JSON.stringify(data),{status:200,headers:{"Content-Type":"application/json"}});
 };
 if(location.search.includes("qa=private")){
 sessionStorage.setItem("va_logged_in_session","true");localStorage.setItem("va_session",JSON.stringify({user:{email:"qa@example.test",token:"qa-only"},ts:now}));
 localStorage.setItem("vtra_trip_context_v2",JSON.stringify({savedAt:now,tripCheckedAt:now,tripRes:trip,destination:"Hạ Long",departureDate:date,originName:"Hà Nội",userPos:{lat:21.0278,lon:105.8342},forecastData:daily,routeCoords:[[21.0278,105.8342],[20.95,107.08]],selectedDateIndex:0}));
 }else{localStorage.clear();sessionStorage.clear();}
})();`;

async function snapshot(url, name, width, inject = false, reduced = false) {
  const target = await fetch("http://127.0.0.1:" + port + "/json/new?about:blank", { method: "PUT" }).then((r) => r.json());
  const c = await connect(target.webSocketDebuggerUrl);
  await c.send("Page.enable"); await c.send("Runtime.enable");
  await c.send("Emulation.setDeviceMetricsOverride", { width, height: width < 600 ? 844 : 960, deviceScaleFactor: 1, mobile: width < 600 });
  if(reduced)await c.send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  if (inject) await c.send("Page.addScriptToEvaluateOnNewDocument", { source: fixture });
  else if(!reference)await c.send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.clear();sessionStorage.clear();"});
  await c.send("Page.navigate", { url });
  await wait(reference ? 6500 : 3500);
  await c.evaluate("document.fonts.ready.then(()=>true)");
  const height = await c.evaluate("document.documentElement.scrollHeight");
  for (let y = 0; y < Math.min(height, 18000); y += 650) { await c.evaluate("window.scrollTo(0," + y + ")"); await wait(160); }
  await c.evaluate("Promise.all([...document.images].map(img=>{img.loading='eager';return img.complete?Promise.resolve():new Promise(r=>{img.addEventListener('load',r,{once:true});img.addEventListener('error',r,{once:true});setTimeout(r,5000)})}))");
  await c.evaluate("window.scrollTo(0,0)"); await wait(650);
  const info = await c.evaluate(`JSON.stringify({title:document.title,url:location.href,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,fonts:{body:getComputedStyle(document.body).fontFamily,heading:document.querySelector('h1')?getComputedStyle(document.querySelector('h1')).fontFamily:null,loaded:document.fonts.check('16px \"Lexend Deca\"')},headings:[...document.querySelectorAll('h1')].map(x=>x.textContent),brokenImages:[...document.images].filter(x=>x.complete&&!x.naturalWidth).map(x=>x.src),overflow:[...document.querySelectorAll('body *')].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+2||r.left<-2)}).slice(0,10).map(x=>x.tagName+'.'+x.className)})`);
  const screenshot = await c.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: Math.min(height, 20000), scale: 1 } });
  await writeFile(path.join(output, name + ".png"), Buffer.from(screenshot.data, "base64"));
  const viewport=await c.send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(path.join(output,name+"-viewport.png"),Buffer.from(viewport.data,"base64"));
  const result = { name, ...JSON.parse(info), runtimeErrors: c.errors };
  c.ws.close();
  await fetch("http://127.0.0.1:" + port + "/json/close/" + target.id);
  return result;
}

async function interactions() {
 const target=await fetch("http://127.0.0.1:"+port+"/json/new?about:blank",{method:"PUT"}).then(r=>r.json());
 const c=await connect(target.webSocketDebuggerUrl);const checks=[];
 await c.send("Page.enable");await c.send("Runtime.enable");
 await c.send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await c.send("Page.addScriptToEvaluateOnNewDocument",{source:fixture});
 await c.send("Page.navigate",{url:baseURL+"/explore"});await wait(2200);
 async function check(name,expression){const pass=Boolean(await c.evaluate("Boolean("+expression+")"));checks.push({name,pass});if(!pass)throw new Error("Interaction failed: "+name);}
 async function type(selector,text){await c.evaluate("document.querySelector("+JSON.stringify(selector)+").focus()");await c.send("Input.insertText",{text});await wait(250);}
 await type("input[type=search]","Quang Nam");
 await check("Legacy province search without accents","document.querySelectorAll('.guide-province-card').length===1&&document.querySelector('.guide-province-card').textContent.includes('Đà Nẵng')");
 await c.evaluate("document.querySelector('.guide-province-card').click()");await wait(500);
 await check("Province guide opens with places and merger note", "location.pathname==='/explore/da-nang'&&document.querySelectorAll('.guide-place-card').length>=3&&document.body.textContent.includes('Qu\u1ea3ng Nam')");
 await c.evaluate("document.querySelector('.guide-place-card a[href=\"/explore/da-nang/hoi-an\"]').click()");await wait(500);
 await check("Place detail retains current and historical geography", "location.pathname==='/explore/da-nang/hoi-an'&&document.querySelector('.guide-detail-story')&&document.querySelector('.guide-sources a')");
 await c.evaluate("document.querySelector('.guide-detail-actions button').click()");await wait(400);
 await check("Destination action opens login","Boolean(document.querySelector('#login-email'))");
 await type("#login-email","qa@example.test");await type("#login-password","qa-password-only");
 await c.evaluate("document.querySelector('.auth-form').requestSubmit()");await wait(1000);
 await check("Login retains selected destination and opens plan","location.pathname==='/plan'&&[...document.querySelectorAll('input')].some(x=>x.value==='Quảng Nam')");
 await c.evaluate("document.querySelector('.tour-mobile-toggle').click()");await wait(350);
 await check("Mobile menu opens","Boolean(document.querySelector('.tour-mobile-menu'))");
 await c.evaluate("document.querySelector('.tour-mobile-menu a[href=\"/weather\"]').click()");await wait(700);
 await check("Mobile navigation closes drawer and reaches weather","location.pathname==='/weather'&&!document.querySelector('.tour-mobile-menu')&&document.body.textContent.includes('Chưa chọn chuyến đi')");
 await c.evaluate("[...document.querySelectorAll('button')].find(x=>x.textContent==='Đăng xuất').click()");await wait(500);
 await check("Logout restores public home","location.pathname==='/'&&Boolean(document.querySelector('.home-hero'))&&!localStorage.getItem('va_session')");
 await c.evaluate("document.querySelector('.guide-experience-card[href=\"/experiences/am-thuc\"]').click()");await wait(600);
 await check("Food category opens with real editorial entries", "location.pathname==='/experiences/am-thuc'&&document.querySelectorAll('.guide-place-card').length===9");
 await c.evaluate("const el=document.querySelector('select');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,'can-tho');el.dispatchEvent(new Event('change',{bubbles:true}))");await wait(350);
 await check("Food filter uses current province with historical locality", "document.querySelectorAll('.guide-place-card').length===1&&document.querySelector('.guide-place-card').textContent.includes('S\u00f3c Tr\u0103ng')");
 c.ws.close();await fetch("http://127.0.0.1:"+port+"/json/close/"+target.id);
 return checks;
}

const reports = [];
try {
 if(reference){for(const [route,name] of [["","reference-home"],["dia-diem/","reference-explore"],["ban-do/","reference-map"]]){reports.push(await snapshot("https://discoverhcmc.com/"+route,name+"-1440",1440));}reports.push(await snapshot("https://discoverhcmc.com/","reference-home-390",390));}
 else if(catalogMode&&process.argv.includes("--interactions-only")){
  const checks=await interactions();await writeFile(path.join(output,"catalog-interactions.json"),JSON.stringify(checks,null,2)+"\n");console.log(JSON.stringify(checks,null,2));
 }
 else if(catalogMode&&process.argv.includes("--authenticated-only")){
  for(const [route,name,width] of [["explore?qa=private","catalog-auth-explore-1440",1440],["explore?qa=private","catalog-auth-explore-390",390],["explore/da-nang?qa=private","catalog-auth-province-390",390],["explore/da-nang/hoi-an?qa=private","catalog-auth-place-390",390],["experiences/am-thuc?qa=private","catalog-auth-food-390",390]])reports.push(await snapshot(baseURL+"/"+route,name,width,true));
 }
 else if(catalogMode){
  for(const width of [1440,768,390,375])reports.push(await snapshot(baseURL+"/explore","catalog-explore-"+width,width,true));
  for(const [route,name] of [["explore/da-nang","province-da-nang"],["explore/ho-chi-minh","province-hcm"],["explore/lao-cai","province-lao-cai"],["explore/lai-chau","province-lai-chau"],["explore/da-nang/hoi-an","place-hoi-an"],["experiences/am-thuc","food"],["experiences/van-hoa","culture"],["experiences/thien-nhien?province=tuyen-quang","nature-filtered"],["explore/can-tho/banh-pia","food-detail"],["explore?q=khongcodiadiemnay","catalog-empty"],["explore/unknown","catalog-not-found"],["map?qa=private","catalog-map"],["plan?qa=private","catalog-plan"]])reports.push(await snapshot(baseURL+"/"+route,name+"-390",390,true));
  for(const route of ["explore/da-nang","explore/da-nang/hoi-an","experiences/am-thuc"])reports.push(await snapshot(baseURL+"/"+route,"catalog-"+route.replaceAll("/","-")+"-1440",1440,true));
  reports.push(await snapshot(baseURL+"/","catalog-home-1440",1440,true));
  reports.push(await snapshot(baseURL+"/","catalog-home-390",390,true));
  const checks=await interactions();await writeFile(path.join(output,"catalog-interactions.json"),JSON.stringify(checks,null,2)+"\n");console.log(JSON.stringify(checks,null,2));
 }
 else{
  for(const width of [1440,768,390,375])reports.push(await snapshot(baseURL+"/","home-"+width,width,true));
  for(const [route,name] of [["explore","explore"],["plan?qa=private","plan"],["result?qa=private","risk"],["weather?qa=private","weather"],["map?qa=private","map"],["news?qa=private","news"],["compare?qa=private","compare"],["alerts?qa=private","alerts"],["history?qa=private","history"],["traffic?qa=private","traffic"]])reports.push(await snapshot(baseURL+"/"+route,name+"-390",390,true));
  for(const [route,name] of [["explore","explore"],["result?qa=private","risk"],["weather?qa=private","weather"],["map?qa=private","map"]])reports.push(await snapshot(baseURL+"/"+route,name+"-1440",1440,true));
  reports.push(await snapshot(baseURL+"/plan","login-390",390,true));
  reports.push(await snapshot(baseURL+"/explore?q=khongcodiadiemnay","explore-empty-390",390,true));
  reports.push(await snapshot(baseURL+"/explore/unknown","explore-not-found-390",390,true));
  reports.push(await snapshot(baseURL+"/","home-reduced-390",390,true,true));
  reports.push(await snapshot(baseURL+"/explore","explore-live-1440",1440,false));
  const checks=await interactions();await writeFile(path.join(output,"interaction-report.json"),JSON.stringify(checks,null,2)+"\n");console.log(JSON.stringify(checks,null,2));
 }
 await writeFile(path.join(output,reference?"reference-report.json":catalogMode?(process.argv.includes("--authenticated-only")?"catalog-authenticated-report.json":"catalog-report.json"):"review-report.json"),JSON.stringify(reports,null,2)+"\n");console.log(JSON.stringify(reports,null,2));
 if(!reference&&reports.some(r=>r.scrollWidth>r.width+1||r.runtimeErrors.length||r.brokenImages.length))process.exitCode=1;
}finally{try{const c=await connect(connection.webSocketDebuggerUrl);await c.send("Browser.close");c.ws.close();}catch{}clearInterval(keepAlive);browser.kill();}
