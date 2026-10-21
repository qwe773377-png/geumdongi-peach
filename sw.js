// 오프라인에서도 열리게 하는 서비스 워커.
// 온라인이면 항상 최신 파일을 받아오고(그래서 GitHub에 올리면 바로 반영), 받은 파일은 저장해 두었다가
// 인터넷이 없을 때 꺼내 쓴다. 글씨체 조각은 한 번 쓰인 것만 저장된다.
// 파일 목록(PRECACHE)을 바꾸면 VERSION도 올려서 옛 저장분을 정리한다.
const VERSION = "v4-bluetooth";
const CACHE = `geumdongi-${VERSION}`;
const PRECACHE = [
  "./",
  "index.html",
  "style.css",
  "manifest.json",
  "assets/fonts/jua/fonts.css",
  "assets/tagline.webp",
  "assets/hwangdo.webp",
  "assets/baekdo.webp",
  "assets/cheondo.webp",
  "assets/icons/icon-192.png",
  "app.js",
  "bluetooth.js",
  "pwa.js",
  "config.js",
  "cart.js",
  "route.js",
  "dialog.js",
  "store.js",
  "nav.js",
  "products.js",
  "sms.js",
  "order.js",
  "detail.js",
  "orderScreen.js",
  "cartScreen.js",
  "home.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  event.respondWith(
    // no-cache: GitHub Pages가 파일을 10분간 브라우저에 보관하게 하므로, 매번 "바뀌었나?"만 물어봐서 올린 즉시 반영되게 한다 (안 바뀌었으면 다시 받지 않는다)
    fetch(req, { cache: "no-cache" })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html"))),
  );
});
