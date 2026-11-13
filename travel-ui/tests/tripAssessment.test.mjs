import test from "node:test";
import assert from "node:assert/strict";
import { assessTraffic, assessNews, assessWeather, buildTripAssessment, weatherTripVerdict } from "../src/portal/tripAssessment.js";
import { getVerdict } from "../src/portal/format.js";
import { planningDays } from "../src/portal/planningDates.js";
import { needsTripRecovery, claimRecoveryAttempt } from "../src/portal/tripRecovery.js";
import { missingTripFields } from "../src/portal/tripFormValidation.js";
import { weatherPurposeAdvice } from "../src/portal/weatherPurposeAdvice.js";

test("weather advice covers every purpose and follows the displayed day's conditions", () => {
  const purposes = ["dating", "family", "adventure", "solo"];
  const pleasant = purposes.map(purpose => weatherPurposeAdvice({risk_score:1},purpose));
  assert.equal(new Set(pleasant.map(item => item.text)).size,4);
  assert.deepEqual(pleasant.map(item => item.label),["Hẹn hò","Gia đình","Phiêu lưu","Một mình"]);
  for(const purpose of purposes) {
    assert.notEqual(weatherPurposeAdvice({risk_score:8},purpose).text,weatherPurposeAdvice({risk_score:1},purpose).text);
    assert.match(weatherPurposeAdvice(null,purpose).text,/kiểm tra lại dự báo/);
  }
  assert.match(weatherPurposeAdvice({risk_score:1,wind:30},"adventure").text,/kiểm tra điều kiện/);
  assert.match(weatherPurposeAdvice({risk_score:1,uv_index:8},"family").text,/chống nắng/);
  assert.equal(weatherPurposeAdvice({risk_score:1},"standard"),null);
});

test("trip evaluation requires selected locations, a supported date and an explicit purpose", () => {
  const form = { origin: {lat:10.8,lon:106.7}, destination:"Hà Nội", selectedDestination:{label:"Hà Nội",lat:21,lon:105.8},date:"2026-11-13",purpose:null };
  const missing = value => missingTripFields(value,"2026-11-13");
  assert.deepEqual(missing(form),["mục đích chuyến đi"]);
  for(const purpose of ["dating","family","adventure","solo"]) assert.deepEqual(missing({...form,purpose}),[]);
  assert.ok(missing({...form,purpose:"standard"}).includes("mục đích chuyến đi"));
  assert.ok(missing({...form,purpose:"family",selectedDestination:null}).includes("điểm đến trong danh sách gợi ý"));
  assert.ok(missing({...form,purpose:"family",origin:{lat:NaN,lon:106}}).includes("điểm xuất phát"));
  assert.equal(missing({...form,purpose:"family",date:"2026-11-12"}).length,1);
  assert.equal(missing({...form,purpose:"family",date:""}).length,1);
});

test("an estimated route has useful facts and advice but no invented traffic score", () => {
  const factor = assessTraffic({route_available:true,traffic_available:false,distance_km:725.8,time_normal_min:650});
  assert.equal(factor.routeAvailable,true);
  assert.equal(factor.live,false);
  assert.equal(factor.score,null);
  assert.match(factor.advice,/chia chặng/);
});
test("old news cannot become a current risk score and a successful empty search is not proof of safety", () => {
  const factor=assessNews({data_status:"stale",risk_score:9,recent_news:{status:"available",count:0,events:[]}});
  assert.equal(factor.score,null);
  assert.match(factor.advice,/không chứng minh/);
});
test("severe forecast overrides pleasant current weather for a future trip", () => {
  const trip={weather:{risk_score:.5,risk_level:0},traffic:{route_available:true,distance_km:10},risk:{}};
  const assessment=buildTripAssessment(trip,[{date:"2026-11-12",risk_score:9,risk_level:5}],"2026-11-12",false,"2026-11-11");
  assert.equal(assessment.tone,"error");
  assert.match(assessment.advice,/hoãn/);
});
test("missing future forecast explicitly switches the assessment to today", () => {
  const result=buildTripAssessment({weather:{risk_score:.5,risk_level:0}},[],"2026-12-20",false,"2026-11-11");
  assert.equal(result.weather.score,.5);
  assert.equal(result.assessmentDate,"2026-11-11");
  assert.equal(result.fallback,true);
  assert.equal(result.tone,"warning");
  assert.match(result.dateNotice,/không phải dự đoán cho ngày đó/);
});
test("a dangerous forecast on an unrelated day does not affect the selected day", () => {
  const result=buildTripAssessment({weather:{risk_score:8,risk_level:4},traffic:{route_available:true,distance_km:20}},[
    {date:"2026-11-12",risk_score:2,risk_level:1}, {date:"2026-11-13",risk_score:10,risk_level:5},
  ],"2026-11-12",false,"2026-11-11");
  assert.equal(result.weatherScore,2);
  assert.equal(result.assessmentDate,"2026-11-12");
  assert.equal(result.decision,"CAUTION");
});
test("today uses its current assessment without taking the maximum of all forecast days", () => {
  const result=buildTripAssessment({weather:{risk_score:2,risk_level:1}},[
    {date:"2026-11-12",risk_score:9,risk_level:5}, {date:"2026-11-13",risk_score:10,risk_level:5},
  ],"2026-11-11",false,"2026-11-11");
  assert.equal(result.weatherScore,2);
  assert.equal(result.weatherData.risk_level,1);
});
test("an old saved trip shows an explicitly dated current assessment instead of an empty score", () => {
  const result=buildTripAssessment({weather:{risk_score:3,risk_level:1}},[],"2026-11-10",false,"2026-11-12");
  assert.equal(result.weatherScore,3);
  assert.equal(result.assessmentDate,"2026-11-12");
  assert.match(result.dateNotice,/không đánh giá lại quá khứ/);
});
test("an unavailable weather source remains unavailable, rather than receiving an invented score", () => {
  const result=buildTripAssessment({weather:{error:"provider unavailable"}},[],"2026-11-12",false,"2026-11-12");
  assert.equal(result.weatherScore,null);
  assert.equal(result.decision,"VERIFY");
  assert.match(result.advice,/Nguồn thời tiết chưa phản hồi/);
});
test("model-only PM imputation is not displayed as actual PM2.5", () => {
  const factor=assessWeather({risk_score:.5,pm25:10},{status:"unavailable",pm25:null});
  assert.equal(factor.facts.at(-1)[1],"Chưa có");
  assert.equal(factor.airUnavailable,true);
});
test("zero is a valid score and air-quality value", () => {
  const factor=assessWeather({risk_score:0,risk_level:0},{status:"available",pm25:0});
  assert.equal(factor.score,0);
  assert.equal(factor.facts.at(-1)[1],"0 µg/m³");
});

test("provisional headline attention is separate from AI risk and does not become a no-go command", () => {
  const risk={data_status:"stale",risk_score:9,recent_news:{status:"available",count:2,assessment:{score:7,counts:{adverse:1,supportive:1,uncertain:0}}}};
  const factor=assessNews(risk);
  assert.equal(factor.score,7);
  assert.equal(factor.modelScore,null);
  assert.equal(factor.tone,"warning");
  const result=buildTripAssessment({weather:{risk_score:2},traffic:{route_available:true,distance_km:20},risk},[],"2026-11-12",false,"2026-11-12");
  assert.equal(result.decision,"CAUTION");
  assert.match(result.advice,/chủ động quyết định/);
  assert.match(result.advice,/7\/10/);
});

test("invalid live duration is unavailable and estimates never produce congestion points", () => {
  const factor=assessTraffic({route_available:true,distance_km:20,traffic_available:true,time_traffic_min:0,traffic_score:8});
  assert.equal(factor.live,false);
  assert.equal(factor.score,null);
});

test("history understands advisory API wording and legacy outcomes without losing severity", () => {
  assert.equal(getVerdict("Cân nhắc điều chỉnh hoặc hoãn hành trình (thời tiết)").tone, getVerdict("KHÔNG NÊN ĐI").tone);
  assert.equal(getVerdict("Cân nhắc các lưu ý trước khi quyết định").tone,"warning");
  assert.equal(getVerdict("Có thể cân nhắc hành trình theo dữ liệu hiện có").tone,"success");
});

test("date rail includes today and exactly seven future dates across year and leap-day boundaries", () => {
  const yearEnd=planningDays("2026-12-28");
  assert.equal(yearEnd.length,8);
  assert.equal(yearEnd[0].date,"2026-12-28");
  assert.equal(yearEnd.at(-1).date,"2027-01-04");
  assert.equal(yearEnd[0].label,"Hôm nay");
  assert.equal(planningDays("2028-02-28")[1].date,"2028-02-29");
  assert.equal(planningDays("2028-02-28")[2].date,"2028-03-01");
});

test("retired congestion scores cannot change advice, while brief summaries retain full detail", () => {
  const trip={weather:{risk_score:2,air_quality:{status:"available",pm25:10}},traffic:{route_available:true,distance_km:50,time_normal_min:90,traffic_available:true,time_traffic_min:300,traffic_score:10,status:"heavy"},risk:{recent_news:{status:"available",count:0}}};
  const result=buildTripAssessment(trip,[],"2026-11-12",false,"2026-11-12");
  assert.equal(result.traffic.score,null);
  assert.equal(result.decision,"GO");
  assert.ok(result.summary.length<160);
  for (const factor of result.factors) {
    assert.ok(factor.summary.length<160);
    assert.ok(factor.advice.length>factor.summary.length);
    assert.doesNotMatch(factor.summary+' '+factor.advice,/\bAI\b|model|mô hình/);
  }
  assert.ok(!result.traffic.facts.some(([label])=>/điểm|chậm trễ/.test(label)));
});

test("restored partial results recover while valid zero scores and empty news do not", () => {
  const valid={weather:{risk_score:0},traffic:{route_available:true,distance_km:10},risk:{recent_news:{status:"available",count:0}}};
  assert.equal(needsTripRecovery(valid,100000,100001),false);
  assert.equal(needsTripRecovery({...valid,weather:{error:"unavailable"}},100000,100001),true);
  assert.equal(needsTripRecovery(valid,100000,2000000),true);
});

test("automatic recovery has a cooldown, an attempt limit, and isolates changed journeys", () => {
  const gate={};
  assert.equal(claimRecoveryAttempt(gate,'A',0),true);
  assert.equal(claimRecoveryAttempt(gate,'A',1000),false);
  assert.equal(claimRecoveryAttempt(gate,'A',60000),true);
  assert.equal(claimRecoveryAttempt(gate,'A',120000),true);
  assert.equal(claimRecoveryAttempt(gate,'A',180000),false);
  assert.equal(claimRecoveryAttempt(gate,'B',180000),true);
});

test("overview uses three clear verdicts with brief reasons, including missing-data cases", () => {
  const good={weather:{risk_score:1,air_quality:{status:"available",pm25:10}},traffic:{route_available:true,distance_km:20},risk:{recent_news:{status:"available",count:0}}};
  const evaluate=trip=>buildTripAssessment(trip,[],"2026-11-13",false,"2026-11-13");
  assert.equal(evaluate(good).title,"NÊN ĐI");
  assert.equal(evaluate({...good,weather:{risk_score:8}}).title,"KHÔNG NÊN ĐI");
  const news={...good,risk:{recent_news:{status:"available",count:4,assessment:{score:5,counts:{adverse:4}}}}};
  assert.equal(evaluate(news).title,"CẦN LƯU Ý TRƯỚC KHI ĐI");
  assert.match(evaluate(news).conclusion,/4 tin địa phương/);
  assert.equal(evaluate({...good,weather:{error:"unavailable"}}).title,"CẦN LƯU Ý TRƯỚC KHI ĐI");
  const future=buildTripAssessment(good,[],"2026-11-20",false,"2026-11-13");
  assert.equal(future.title,"CẦN LƯU Ý TRƯỚC KHI ĐI");
  assert.match(future.conclusion,/Chưa có dự báo/);
  for (const trip of [good,news,{...good,weather:{risk_score:8}}]) assert.ok(evaluate(trip).conclusion.length<150);
});

test("weather verdict thresholds are independent of news, routes and missing air observations", () => {
  for (const [score,title] of [[0,"NÊN ĐI"],[3.9,"NÊN ĐI"],[4,"CẦN LƯU Ý TRƯỚC KHI ĐI"],[6.9,"CẦN LƯU Ý TRƯỚC KHI ĐI"],[7,"KHÔNG NÊN ĐI"],[10,"KHÔNG NÊN ĐI"]]) {
    assert.equal(weatherTripVerdict({score}).title,title);
  }
  const result=buildTripAssessment({weather:{risk_score:1},traffic:{route_available:false},risk:{data_status:"fresh",risk_score:9,recent_news:{status:"available",count:4,assessment:{score:5}}}},[],"2026-11-14",false,"2026-11-14");
  assert.equal(result.weatherVerdict.title,"NÊN ĐI");
  assert.doesNotMatch(result.weatherVerdict.conclusion,/tin|tuyến/);
});

test("fresh classified high-risk news affects the overall verdict, stale scores do not", () => {
  const trip = {weather:{risk_score:1},traffic:{route_available:true,distance_km:20},risk:{data_status:"fresh",risk_score:9,recent_news:{status:"available",count:0}}};
  assert.equal(buildTripAssessment(trip,[],"2026-11-13",false,"2026-11-13").overallVerdict.decision,"DONT_GO");
  trip.risk.risk_score=5;
  assert.equal(buildTripAssessment(trip,[],"2026-11-13",false,"2026-11-13").overallVerdict.decision,"CAUTION");
  trip.risk.data_status="stale";
  assert.equal(buildTripAssessment(trip,[],"2026-11-13",false,"2026-11-13").overallVerdict.decision,"GO");
});

test("weather verdict respects selected-day forecasts and never calls missing forecasts favorable", () => {
  const trip={weather:{risk_score:9}};
  const future=buildTripAssessment(trip,[{date:"2026-11-14",risk_score:1}],"2026-11-14",false,"2026-11-13");
  assert.equal(future.weatherVerdict.title,"NÊN ĐI");
  assert.equal(weatherTripVerdict({score:null}).title,"CẦN LƯU Ý TRƯỚC KHI ĐI");
  assert.equal(weatherTripVerdict({score:1},{fallback:true,requestedDate:"2026-11-20",assessmentDate:"2026-11-13"}).title,"CẦN LƯU Ý TRƯỚC KHI ĐI");
});
