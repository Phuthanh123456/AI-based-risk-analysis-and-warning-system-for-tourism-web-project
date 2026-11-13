import test from "node:test";
import assert from "node:assert/strict";
import { createLocationSearchClient } from "../src/components/locationSearchClient.js";

const result = { status: "ok", items: [{ id: "lake", label: "Hồ Hoàn Kiếm, Hà Nội", lat: 21.028, lon: 105.852 }] };
const response = () => ({ ok: true, json: async () => result });

test("cache normalizes accents and avoids a repeated fetch", async () => {
  let calls = 0;
  const client = createLocationSearchClient({ fetcher: async () => { calls++; return response(); } });
  await client.search("Hồ Hoàn Kiếm",22.66,106.25);
  const second = await client.search("ho  hoan kiem",22.66,106.25);
  assert.equal(calls,1);
  assert.deepEqual(second,result);
});
test("simultaneous identical searches share a request and tolerate one cancelled consumer", async () => {
  let release, calls=0;
  const client=createLocationSearchClient({fetcher:()=>{calls++;return new Promise(resolve=>release=()=>resolve(response()));}});
  const stop=new AbortController();
  const one=client.search("Hồ Hoàn Kiếm",undefined,undefined,stop.signal);
  const two=client.search("ho hoan kiem");
  const cancelled=assert.rejects(one,{name:"AbortError"});
  stop.abort();
  release();
  await cancelled;
  assert.deepEqual(await two,result);
  assert.equal(calls,1);
});
test("cancelling the last consumer aborts the actual request", async () => {
  let providerAborted=false;
  const client=createLocationSearchClient({fetcher:(_url,{signal})=>new Promise((_resolve,reject)=>{
    signal.addEventListener("abort",()=>{providerAborted=true;reject(new DOMException("aborted","AbortError"));});
  })});
  const controller=new AbortController();
  const pending=client.search("cancel old query",undefined,undefined,controller.signal);
  const rejected=assert.rejects(pending,{name:"AbortError"});
  controller.abort();
  await rejected;
  assert.equal(providerAborted,true);
});
test("a stalled request ends at its deadline and is not cached as empty success", async () => {
  let calls=0;
  const client=createLocationSearchClient({budgetMs:35,fetcher:(_url,{signal})=>{
    calls++;
    return new Promise((_resolve,reject)=>signal.addEventListener("abort",()=>reject(new DOMException("timeout","AbortError"))));
  }});
  const started=Date.now();
  await assert.rejects(client.search("stalled query"),{name:"AbortError"});
  assert.ok(Date.now()-started<300);
  assert.equal(client.peek("stalled query"),null);
  assert.equal(calls,1);
});
