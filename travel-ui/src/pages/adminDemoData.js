const destinations = [
  ["Đà Lạt", 32], ["Đà Nẵng", 25], ["Hội An", 19], ["Nha Trang", 18],
  ["Hạ Long", 15], ["Sa Pa", 12], ["Phú Quốc", 10], ["Huế", 9],
];

const dailySignIns = [7, 10, 9, 14, 16, 12, 19, 23, 15, 11, 17, 24, 21, 29];
const dailyAssessments = [3, 5, 4, 8, 9, 7, 12, 14, 9, 7, 10, 16, 16, 20];

export function withAdminDemoData(live) {
  const demoSignIns = dailySignIns.reduce((sum, count) => sum + count, 0);
  const demoAssessments = dailyAssessments.reduce((sum, count) => sum + count, 0);
  const methods = new Map(live.sign_in_providers.map(({ provider, total }) => [provider, total]));
  const google = Math.round(demoSignIns * 0.65);
  methods.set("google", (methods.get("google") ?? 0) + google);
  methods.set("password", (methods.get("password") ?? 0) + demoSignIns - google);

  const places = new Map(live.destinations.map(({ destination, total }) => [destination, total]));
  for (const [destination, count] of destinations) {
    places.set(destination, (places.get(destination) ?? 0) + count);
  }

  return {
    counts: {
      accounts: live.counts.accounts + 50,
      assessments: live.counts.assessments + demoAssessments,
      sign_ins: live.counts.sign_ins + demoSignIns,
      subscriptions: live.counts.subscriptions + 28,
    },
    activity: live.activity.map((day, index) => {
      const demoIndex = index + dailySignIns.length - live.activity.length;
      return {
        ...day,
        assessments: day.assessments + (dailyAssessments[demoIndex] ?? 0),
        sign_ins: day.sign_ins + (dailySignIns[demoIndex] ?? 0),
      };
    }),
    sign_in_providers: [...methods].map(([provider, total]) => ({ provider, total })),
    destinations: [...places].map(([destination, total]) => ({ destination, total }))
      .sort((a, b) => b.total - a.total || a.destination.localeCompare(b.destination, "vi"))
      .slice(0, 10),
  };
}
