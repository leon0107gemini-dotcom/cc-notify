// 커맨드센터 알림 앱 서비스워커: 푸시 표시 + 누르면 커맨드센터 그 방 열기
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: "커맨드센터", body: e.data ? e.data.text() : "" }; }
  const icon = { meeting: "🗳 ", urgent: "⚠️ " }[d.kind] || "";
  const opts = {
    body: d.body || "",
    icon: "icon-192.png",
    badge: "badge-96.png",
    tag: d.room ? "room-" + d.room : "cc-" + (d.id || Date.now()),
    renotify: true,
    data: { url: d.url || "", id: d.id, kind: d.kind },
    actions: d.kind === "meeting" ? [{ action: "open", title: "결정 회의 열기" }, { action: "app", title: "알림 앱에서 보기" }] : [{ action: "open", title: "채팅방 열기" }]
  };
  e.waitUntil((async () => {
    await self.registration.showNotification(icon + (d.title || "커맨드센터"), opts);
    if (self.navigator && "setAppBadge" in self.navigator && d.badge != null) { try { await self.navigator.setAppBadge(d.badge); } catch (_) {} }
    const cs = await self.clients.matchAll({ type: "window" });
    cs.forEach(c => c.postMessage({ type: "refresh" }));
  })());
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const d = e.notification.data || {};
  const toApp = e.action === "app" || !d.url;
  const url = toApp ? self.registration.scope + "#notes" : d.url;
  e.waitUntil((async () => {
    // 읽음 처리는 알림 앱이 열릴 때 함께
    try { const cs = await self.clients.matchAll({ type: "window" }); cs.forEach(c => c.postMessage({ type: "read", id: d.id })); } catch (_) {}
    return self.clients.openWindow(url);
  })());
});
