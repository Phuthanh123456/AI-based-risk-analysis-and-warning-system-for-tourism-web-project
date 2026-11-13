export function needsTripRecovery(trip, checkedAt, now = Date.now()) {
  const score = trip?.weather?.adjusted_risk_score ?? trip?.weather?.risk_score;
  return !trip || !checkedAt || now - checkedAt > 30 * 60 * 1000
    || !!trip.weather?.error || score == null || !Number.isFinite(Number(score))
    || trip.traffic?.route_available === false || !(Number(trip.traffic?.distance_km) > 0)
    || trip.risk?.recent_news?.status !== "available";
}

export function claimRecoveryAttempt(state, key, now = Date.now()) {
  if (state.key !== key) Object.assign(state, { key, attempts: 0, last: -Infinity });
  if (state.attempts >= 3 || now - state.last < 60000) return false;
  state.attempts += 1;
  state.last = now;
  return true;
}
