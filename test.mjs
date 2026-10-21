// 회귀 방지 테스트: node test.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { CONFIG } from "./config.js";
import { findDetailProduct, resolveRoute } from "./route.js";
import { addItem, removeItem, setQty, count, lines, total, sanitize, formatPrice } from "./cart.js";
import { initStore, getCart, subscribe, addToCart, changeQty, removeFromCart, clearCart } from "./store.js";

const read = (f) => readFileSync(new URL(`./${f}`, import.meta.url), "utf8");
const exists = (f) => existsSync(new URL(`./${f}`, import.meta.url));

// ===== 설정 =====
assert.deepEqual(CONFIG.products.map((p) => p.name), ["황도", "백도", "천도"]); // 순서
assert.equal(CONFIG.productSuffix, "꿀 통조림");
assert.equal(CONFIG.title, "금동이네 꿀복통");
assert.equal(CONFIG.tagline.alt, "금동이네 맛있는 꿀 복숭아 통조림 드세요");
assert.ok(exists(CONFIG.tagline.src), "글귀 이미지 파일 없음");
assert.equal(CONFIG.footer, "금사조 (금오공고를 사랑하는 조)");
for (const p of CONFIG.products) {
  assert.ok(Number.isInteger(p.price) && p.price > 0, `${p.name} 가격이 양의 정수가 아님`);
}
assert.ok(Number.isInteger(CONFIG.maxQty) && CONFIG.maxQty >= 1);
assert.ok(CONFIG.storageKey.length > 0);

// ===== 장바구니 계산 (cart.js) =====
const items = [{ id: "a", name: "A", price: 1500 }, { id: "b", name: "B", price: 2000 }, { id: "c", name: "C", price: 10000 }];
{
  const empty = {};
  const one = addItem(empty, "a", 3);
  assert.deepEqual(one, { a: 1 });
  assert.deepEqual(empty, {}, "원래 객체를 고치면 안 됨");
  assert.deepEqual(addItem(one, "a", 3), { a: 2 });
  const full = { a: 3 };
  assert.equal(addItem(full, "a", 3), full, "최대 개수면 같은 객체(변화 없음)를 돌려줘야 함");

  assert.deepEqual(setQty({ a: 1 }, "a", 5, 99), { a: 5 });
  assert.deepEqual(setQty({ a: 1 }, "a", 0, 99), {}, "0 이하면 삭제");
  assert.deepEqual(setQty({ a: 1 }, "a", 500, 99), { a: 99 }, "최대 개수로 제한");
  const same = { a: 2 };
  assert.equal(setQty(same, "a", 2, 99), same, "같은 수량이면 변화 없음");
  assert.equal(setQty(same, "zzz", 3, 99), same, "없는 상품은 변화 없음");
  assert.deepEqual(removeItem({ a: 1, b: 2 }, "a"), { b: 2 });

  assert.equal(count({ a: 2, b: 3 }), 5);
  assert.equal(count({}), 0);
  assert.deepEqual(lines({ c: 1, a: 2 }, items).map((l) => l.id), ["a", "c"], "상품 목록 순서를 따라야 함");
  assert.deepEqual(lines({ a: 2 }, items), [{ id: "a", name: "A", qty: 2, price: 1500, subtotal: 3000 }]);
  assert.equal(total({ a: 2, b: 1, c: 3 }, items), 3000 + 2000 + 30000);
  assert.equal(total({}, items), 0);

  assert.deepEqual(sanitize({ a: 2, zzz: 5, b: -1, c: 1.5 }, items, 99), { a: 2 }, "모르는 상품·음수·소수는 버림");
  assert.deepEqual(sanitize({ a: 500 }, items, 99), { a: 99 }, "너무 큰 개수는 줄임");
  assert.deepEqual(sanitize({ a: "3" }, items, 99), {}, "문자열은 버림");
  for (const bad of [null, undefined, "x", 7, [1, 2]]) assert.deepEqual(sanitize(bad, items, 99), {});

  assert.equal(formatPrice(0, "원"), "0원");
  assert.equal(formatPrice(999, "원"), "999원");
  assert.equal(formatPrice(1000, "원"), "1,000원");
  assert.equal(formatPrice(30000, "원"), "30,000원");
  assert.equal(formatPrice(1234567, "원"), "1,234,567원");
}

// ===== 장바구니 상태·저장 (store.js) =====
{
  const disk = {};
  globalThis.localStorage = { getItem: (k) => disk[k] ?? null, setItem: (k, v) => { disk[k] = v; } };
  const [h, b] = CONFIG.products.map((p) => p.id);

  disk[CONFIG.storageKey] = JSON.stringify({ [h]: 2, 모르는상품: 5 });
  initStore();
  assert.deepEqual(getCart(), { [h]: 2 }, "저장돼 있던 값을 불러오고 모르는 상품은 버림");

  let notified = 0;
  subscribe(() => { notified++; });
  assert.equal(addToCart(b), true);
  assert.deepEqual(getCart(), { [h]: 2, [b]: 1 });
  assert.deepEqual(JSON.parse(disk[CONFIG.storageKey]), { [h]: 2, [b]: 1 }, "바뀔 때마다 저장");
  assert.equal(notified, 1);

  assert.equal(changeQty(h, CONFIG.maxQty), true);
  assert.equal(addToCart(h), false, "최대 개수에서는 false");
  assert.equal(notified, 2, "변화 없으면 화면에 알리지 않음");
  assert.equal(removeFromCart(b), true);
  assert.deepEqual(getCart(), { [h]: CONFIG.maxQty });
  assert.equal(clearCart(), true);
  assert.deepEqual(getCart(), {});
  assert.deepEqual(JSON.parse(disk[CONFIG.storageKey]), {});

  // 저장소가 고장나도 앱이 멈추면 안 됨
  disk[CONFIG.storageKey] = "{깨진 값";
  initStore();
  assert.deepEqual(getCart(), {}, "깨진 저장값은 빈 장바구니로 시작");
  globalThis.localStorage = { getItem: () => { throw new Error("막힘"); }, setItem: () => { throw new Error("막힘"); } };
  initStore();
  assert.equal(addToCart(h), true, "저장을 못 해도 담기는 동작");
  assert.deepEqual(getCart(), { [h]: 1 });
  delete globalThis.localStorage;
}

// ===== 주소 → 화면 =====
for (const p of CONFIG.products) assert.equal(findDetailProduct(`#${p.id}`, CONFIG.products).id, p.id);
assert.equal(findDetailProduct("#hwangdo", [{ id: "hwangdo", name: "황도" }]), null, "상세 없는 상품은 메인");
assert.equal(findDetailProduct("", CONFIG.products), null);
assert.equal(findDetailProduct("#", CONFIG.products), null);
assert.equal(findDetailProduct("#없는것", CONFIG.products), null);
assert.deepEqual(resolveRoute("#order", CONFIG.products), { screen: "order" });
assert.deepEqual(resolveRoute("#cart", CONFIG.products), { screen: "cart" });
for (const p of CONFIG.products) {
  const r = resolveRoute(`#${p.id}`, CONFIG.products);
  assert.equal(r.screen, "detail");
  assert.equal(r.product.id, p.id);
}
for (const h of ["", "#", "#없는것", "#ORDER"]) assert.deepEqual(resolveRoute(h, CONFIG.products), { screen: "home" });

// ===== 상세 정보 (황도·백도·천도 공통) =====
assert.equal(CONFIG.detail.makingTitle, "꿀 통조림 이렇게 만들어져요");
for (const p of CONFIG.products) {
  assert.ok(p.detail, `${p.name} 상세 정보 없음`);
  assert.ok(exists(p.detail.image.src), `${p.name} 이미지 파일 없음`);
  assert.ok(p.detail.image.alt.includes(p.name), `${p.name} 이미지 설명에 상품 이름 없음`);
  assert.ok(p.detail.benefit.includes(p.name), `${p.name} 효능 글 없음`);
  assert.equal(typeof p.detail.making, "string", `${p.name} 만드는 과정 설명 자리 없음`);
  assert.ok(p.detail.making.includes("손") && p.detail.making.includes("꿀"), `${p.name} 만드는 과정에 확인된 사실(손 손질·꿀) 빠짐`);
  assert.ok(!p.detail.making.includes("기계"), `${p.name} 만드는 과정에 기계 언급 금지(사용자 요청)`);
  assert.equal(CONFIG.detail.benefitTitle(p.name), `${p.name}의 효능`);
}

// ===== 화면 구조 =====
const html = read("index.html");
const css = read("style.css");
const inOrder = (ids, msg) => {
  const pos = ids.map((id) => html.indexOf(`id="${id}"`));
  assert.ok(pos.every((p) => p >= 0), `${msg}: 요소 누락`);
  assert.deepEqual([...pos].sort((a, b) => a - b), pos, `${msg}: 순서 어긋남`);
};
inOrder(["title", "tagline", "products", "home-order", "footer"], "메인 화면");
inOrder(["detail-back", "detail-image", "detail-benefit-title", "detail-benefit", "detail-making", "detail-making-body", "detail-order"], "상세 화면");
// 주문 화면: 뒤로(왼쪽 위) → 상품 버튼 3개 → 장바구니 내역(−/+) → 맨 아래 장바구니 버튼 하나
inOrder(["order-back", "order-products", "order-summary-title", "order-summary", "order-total-row", "order-cart-btn"], "주문 화면");
inOrder(["cart-back", "cart-title", "cart-list", "cart-total-card", "cart-clear", "cart-submit"], "장바구니 화면");
for (const id of ["home", "detail", "order-screen", "cart-screen"]) {
  assert.ok(new RegExp(`<main id="${id}" class="screen`).test(html), `${id} 화면이 .screen(안전 영역 포함)이 아님`);
}

// 코드가 찾는 요소 id가 html에 전부 있어야 함 (오타 방지) + app.js의 화면 id 목록과 html 일치
const jsFiles = readdirSync(new URL(".", import.meta.url)).filter((f) => f.endsWith(".js") && !["config.js", "cart.js"].includes(f));
for (const f of jsFiles) {
  for (const m of read(f).matchAll(/\$\("([^"]+)"\)/g)) assert.ok(html.includes(`id="${m[1]}"`), `${f}가 찾는 #${m[1]}가 html에 없음`);
}
const screenIds = [...read("app.js").match(/SCREEN_IDS = \{([^}]*)\}/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
assert.deepEqual(screenIds, ["home", "detail", "order-screen", "cart-screen"]);

// ===== 코드 구조: 한 방향 의존, 순환 참조 금지 =====
{
  const graph = {};
  for (const f of readdirSync(new URL(".", import.meta.url)).filter((x) => x.endsWith(".js"))) {
    graph[f] = [...read(f).matchAll(/from "\.\/([\w]+\.js)"/g)].map((m) => m[1]);
  }
  const state = {};
  const visit = (f, path) => {
    assert.notEqual(state[f], "visiting", `순환 참조: ${[...path, f].join(" → ")}`);
    if (state[f] === "done") return;
    state[f] = "visiting";
    for (const dep of graph[f] ?? []) visit(dep, [...path, f]);
    state[f] = "done";
  };
  for (const f of Object.keys(graph)) visit(f, []);
  assert.deepEqual(graph["cart.js"], [], "cart.js는 아무것도 가져오지 않는 순수 계산이어야 함");
  assert.deepEqual(graph["config.js"], [], "config.js는 아무것도 가져오지 않아야 함");
}

// ===== 모바일 규칙 =====
assert.ok(css.includes("safe-area-inset-bottom"), "하단 안전 영역 없음");
assert.ok(css.includes("viewport-fit") === false && html.includes("viewport-fit=cover"));
const size = (sel) => parseFloat(css.match(new RegExp(`${sel}[^}]*font-size:\\s*([\\d.]+)rem`))[1]);
assert.ok(size("\\.product \\.kind") > size("\\.product \\.suffix"), "황도/백도/천도 글씨가 더 커야 함");
assert.ok(size("\\.info-title") > size("\\.info-body"), "상세 제목이 설명보다 커야 함");
assert.ok(css.includes(".info-body:empty"), "설명이 비었을 때 빈 줄이 남음");
assert.ok(/(^|\n)\[hidden\]\s*\{\s*display:\s*none/.test(css), "hidden이 display 설정에 덮여 화면이 겹침");
assert.ok(css.match(/\.info-body\s*\{[^}]*background:\s*var\(--card\)/), "설명이 흰 카드가 아님");
assert.ok(css.match(/\.dialog-box p\s*\{[^}]*white-space:\s*pre-line/), "대화상자 줄바꿈이 안 보임");

// 작게 보이는 버튼(뒤로, 삭제, -/+, 전체 비우기)은 눌리는 범위가 사방 확장으로 44×44 이상이어야 함
const hitSize = (ruleRegex, afterRegex, label) => {
  const rule = css.match(ruleRegex)[0];
  const grow = parseInt(css.match(afterRegex)[1]);
  assert.ok(parseInt(rule.match(/min-width:\s*(\d+)px/)[1]) + 2 * grow >= 44, `${label} 누르는 폭 44 미만`);
  assert.ok(parseInt(rule.match(/min-height:\s*(\d+)px/)[1]) + 2 * grow >= 44, `${label} 누르는 높이 44 미만`);
};
hitSize(/\.back\s*\{[^}]*\}/, /\.back::after\s*\{[^}]*inset:\s*-(\d+)px/, "뒤로 버튼");
hitSize(/\.mini, \.text-btn\s*\{[^}]*\}/, /\.mini::after, \.text-btn::after\s*\{[^}]*inset:\s*-(\d+)px/, "삭제·수량·비우기 버튼");
assert.ok(parseInt(css.match(/\.order\s*\{[^}]*min-height:\s*(\d+)px/)[1]) >= 44, "주문하기 버튼 높이 44 미만");
assert.ok(parseInt(css.match(/\.product\s*\{[^}]*min-height:\s*(\d+)px/)[1]) >= 44, "상품 버튼 높이 44 미만");
for (const sel of [".back:active", ".mini:active", ".text-btn:active", ".order:active", ".product:active"]) {
  assert.ok(css.includes(sel), `${sel} 눌림 표시 없음`);
}
// 주문 화면 아래에는 장바구니 버튼 하나만 (주문 확정은 장바구니 화면에서), 안쪽 내용만 스크롤되고 버튼은 고정
assert.ok(!html.includes("order-submit"), "주문 화면에 주문하기 버튼이 남아 있음");
assert.ok(!css.includes("bottom-row") && !css.includes(".secondary"), "쓰지 않는 두 버튼 스타일이 남아 있음");
assert.ok(css.match(/\.screen\.fixed\s*\{[^}]*height:\s*100dvh/), "주문·장바구니 화면 아래 버튼이 고정되지 않음");

// ===== 글씨체 (주아체) =====
assert.ok(/font-family:\s*"Jua"/.test(css), "본문 글씨체가 주아체가 아님");
assert.ok(html.includes('href="assets/fonts/jua/fonts.css"'), "폰트 css 연결 없음");
const fontCss = read("assets/fonts/jua/fonts.css");
const fontUrls = [...fontCss.matchAll(/url\(\.\/([^)]+)\)/g)].map((m) => m[1]);
assert.ok(fontUrls.length > 0, "폰트 조각 목록 비어 있음");
for (const f of fontUrls) assert.ok(exists(`assets/fonts/jua/${f}`), `폰트 파일 없음: ${f}`);
assert.ok(exists("assets/fonts/jua/OFL.txt"), "폰트 라이선스(OFL) 문서 없음");
assert.ok(/(^|\n)button\s*\{\s*font-family:\s*inherit/.test(css), "버튼이 글씨체를 물려받지 않음");

console.log("모든 테스트 통과");

// 주문 화면 내역에서 바로 수량 조절 (장바구니 화면까지 가지 않아도 됨)
{
  const src = read("orderScreen.js");
  assert.ok(src.includes("changeQty") && src.includes("minusAria") && src.includes("plusAria"), "주문 화면 −/+ 없음");
  assert.ok(!src.includes("submitOrder"), "주문 화면에서 주문 확정을 호출함");
  assert.ok(read("cartScreen.js").includes("submitOrder"), "장바구니 화면에 주문하기 없음");
  const gap = parseInt(css.match(/\.summary-list\s*\{[^}]*gap:\s*(\d+)px/)[1]);
  assert.ok(gap >= 8, "−/+ 누름 범위가 줄끼리 겹침");
  console.log("주문 화면 −/+ 테스트 통과");
}

// ===== 홈 화면 설치(PWA) =====
{
  const manifest = JSON.parse(read("manifest.json"));
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.name && manifest.short_name && manifest.start_url, "manifest 기본 항목 누락");
  const sizes = manifest.icons.map((i) => i.sizes);
  assert.ok(sizes.includes("192x192") && sizes.includes("512x512"), "192/512 아이콘 필요");
  assert.ok(manifest.icons.some((i) => i.purpose === "maskable"), "maskable 아이콘 필요");
  for (const i of manifest.icons) assert.ok(existsSync(new URL(`./${i.src}`, import.meta.url)), `${i.src} 없음`);
  assert.ok(existsSync(new URL("./assets/icons/apple-touch-icon.png", import.meta.url)), "apple-touch-icon 없음");
  const html2 = read("index.html");
  assert.ok(html2.includes('rel="manifest"') && html2.includes("apple-touch-icon"), "index.html에 설치 정보 연결 없음");

  // 오프라인용 파일 목록이 실제 앱 파일(모든 .js 모듈, 이미지, 글씨체 css)을 빠뜨리지 않았는가
  const sw = read("sw.js");
  const list = JSON.parse(sw.match(/const PRECACHE = (\[[\s\S]*?\]);/)[1]);
  for (const f of list.filter((x) => x !== "./")) assert.ok(existsSync(new URL(`./${f}`, import.meta.url)), `PRECACHE에 없는 파일: ${f}`);
  const appJs = readdirSync(new URL("./", import.meta.url)).filter((f) => f.endsWith(".js") && !["sw.js", "test.mjs"].includes(f));
  for (const f of appJs) assert.ok(list.includes(f), `오프라인 목록에 ${f} 빠짐 (sw.js PRECACHE에 추가하고 VERSION을 올리세요)`);
  for (const f of ["style.css", "index.html", "manifest.json", "assets/fonts/jua/fonts.css"]) assert.ok(list.includes(f), `오프라인 목록에 ${f} 빠짐`);
  for (const p of CONFIG.products) for (const src of [p.detail.image.src]) assert.ok(list.includes(src), `오프라인 목록에 ${src} 빠짐`);
  assert.ok(list.includes(CONFIG.tagline.src), "오프라인 목록에 글귀 이미지 빠짐");
  assert.ok(sw.includes("skipWaiting") && sw.includes("caches.delete"), "옛 저장분 정리 없음");

  // 등록 코드는 https/localhost에서만, 실패해도 앱을 막지 않음
  const pwa = read("pwa.js");
  assert.ok(pwa.includes("https:") && pwa.includes(".catch("), "pwa.js 안전장치 없음");
  console.log("홈 화면 설치(PWA) 테스트 통과");
}

// ===== 안드로이드 APK (웹앱 주소를 여는 껍데기) =====
{
  const strings = read("android/app/src/main/res/values/strings.xml");
  const url = strings.match(/name="app_url">([^<]+)</)[1];
  assert.ok(url.startsWith("https://") && url.endsWith("/"), "app_url은 https 주소로 끝에 / 필요");
  const manifestXml = read("android/app/src/main/AndroidManifest.xml");
  assert.ok(manifestXml.includes("android.permission.INTERNET"), "INTERNET 권한 필요");
  assert.ok(manifestXml.includes('usesCleartextTraffic="false"'), "http 평문 통신 금지");
  const java = read("android/app/src/main/java/com/geumdongi/peach/MainActivity.java");
  assert.ok(java.includes("setDomStorageEnabled(true)"), "장바구니 저장(localStorage)에 DOM 저장소 필요");
  assert.ok(java.includes("onBackPressed") && java.includes("canGoBack"), "안드로이드 뒤로 버튼 처리 없음");
  assert.ok(read("android/app/build.gradle").includes("applicationId 'com.geumdongi.peach'"), "applicationId 변경됨 (바꾸면 새 앱으로 인식)");
  for (const f of ["android/settings.gradle", "android/build.gradle", ".github/workflows/build-apk.yml",
    "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png", "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png",
    "android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml"]) assert.ok(existsSync(new URL(`./${f}`, import.meta.url)), `${f} 없음`);
  const wf = read(".github/workflows/build-apk.yml");
  assert.ok(wf.includes("workflow_dispatch") && wf.includes("assembleDebug") && wf.includes("apk-latest"), "워크플로 항목 누락");
  console.log("안드로이드 APK 구성 테스트 통과");
}

// ===== 주문 접수: 문자(SMS) =====
{
  const sms = await import("./sms.js");
  assert.equal(sms.cleanPhone("010-1234-5678"), "01012345678");
  assert.equal(sms.cleanPhone(" +82 10-1234-5678 "), "+821012345678");
  assert.equal(sms.cleanPhone(undefined), "");
  assert.ok(sms.isValidPhone("010-1234-5678") && sms.isValidPhone("01012345678") && sms.isValidPhone("+821012345678"));
  assert.ok(!sms.isValidPhone("") && !sms.isValidPhone("123") && !sms.isValidPhone("abc") && !sms.isValidPhone(null), "잘못된 번호를 통과시킴");
  assert.ok(sms.isIos({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" }));
  assert.ok(sms.isIos({ userAgent: "Mozilla/5.0 (Macintosh)", platform: "MacIntel", maxTouchPoints: 5 }), "아이패드(데스크톱 표시) 인식 실패");
  assert.ok(!sms.isIos({ userAgent: "Mozilla/5.0 (Linux; Android 14)", platform: "Linux armv8l", maxTouchPoints: 5 }));
  assert.ok(!sms.isIos({ userAgent: "Mozilla/5.0 (Macintosh)", platform: "MacIntel", maxTouchPoints: 0 }), "맥 PC를 아이폰으로 착각");
  const body = sms.buildOrderText("[주문]", "황도 꿀 통조림 2개\n백도 꿀 통조림 1개", "30,000원", "합계");
  assert.equal(body, "[주문]\n황도 꿀 통조림 2개\n백도 꿀 통조림 1개\n합계 30,000원");
  const android = sms.buildSmsUrl("010-1234-5678", body, false);
  const iphone = sms.buildSmsUrl("010-1234-5678", body, true);
  assert.ok(android.startsWith("sms:01012345678?body=") && iphone.startsWith("sms:01012345678&body="), "문자 주소 형식 틀림");
  assert.equal(decodeURIComponent(android.split("body=")[1]), body, "문자 내용이 깨짐(줄바꿈·한글·쉼표)");
  assert.ok(!android.includes("\n") && !android.includes(" "), "주소에 줄바꿈·공백이 그대로 들어감");

  console.log("기존 문자 유틸리티 테스트 통과 (현재 주문은 Bluetooth 사용)");
}

// Native SPP order flow is tested with asynchronous acknowledgements.
{
  const listeners = new Map();
  globalThis.window = { addEventListener: (name, fn) => listeners.set(name, fn) };
  globalThis.document = { getElementById: () => null };
  const memory = new Map();
  globalThis.localStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key),
  };
  const { quantitiesForCart, sendProductionOrder } = await import("./bluetooth.js");
  assert.deepEqual(quantitiesForCart({ hwangdo: 3, baekdo: 2 }), { baekdo: 2, cheondo: 0, hwangdo: 3 });
  assert.throws(() => quantitiesForCart({ baekdo: 100 }));
  assert.throws(() => quantitiesForCart({}));
  await assert.rejects(sendProductionOrder({ baekdo: 2 }), /Android APK/);
  let failedId;
  window.FactoryBluetooth = {
    isConnected: () => true,
    sendOrder: (json) => {
      failedId = JSON.parse(json).id;
      queueMicrotask(() => listeners.get("factory-bluetooth")({ detail: { type: "line", message: `ERROR|${failedId}|PC_OFFLINE` } }));
      return true;
    },
  };
  await assert.rejects(sendProductionOrder({ baekdo: 2 }), /PC_OFFLINE/);
  assert.ok(memory.size > 0, "미확인 주문 ID를 보존해야 함");
  await assert.rejects(sendProductionOrder({ baekdo: 1 }), /미확인/);
  window.FactoryBluetooth.sendOrder = (json) => {
    const pending = JSON.parse(json);
    assert.equal(pending.id, failedId, "재전송은 같은 주문 ID를 사용해야 함");
    queueMicrotask(() => listeners.get("factory-bluetooth")({ detail: { type: "line", message: `ACK|${pending.id}|2|producing` } }));
    return true;
  };
  const receipt = await sendProductionOrder({ baekdo: 2 });
  assert.equal(receipt.basket, "2");
  assert.equal(memory.size, 0, "접수 확인 후에만 미확인 주문을 제거해야 함");
  console.log("Bluetooth 수량 매핑 · 오류 · 재전송 · 접수 확인 테스트 통과");
}
