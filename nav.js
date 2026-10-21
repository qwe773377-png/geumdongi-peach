import { CONFIG } from "./config.js";
import { resolveRoute } from "./route.js";

// 화면 이동. 주소(#...)로 화면을 정하고, 앱 안에서 몇 단계 들어왔는지(depth)를 기록해
// 뒤로가기가 앱 밖으로 나가지 않게 한다.
let onRoute = () => {};

const depth = () => history.state?.depth ?? 0;
const currentRoute = () => resolveRoute(location.hash, CONFIG.products);

export function startRouting(listener) {
  onRoute = listener;
  window.addEventListener("popstate", () => onRoute(currentRoute())); // 폰 뒤로가기
  onRoute(currentRoute());
}

export function navigate(hash) {
  history.pushState({ depth: depth() + 1 }, "", hash);
  onRoute(currentRoute());
}

export function goBack() {
  if (depth() > 0) {
    history.back(); // popstate가 화면을 바꾼다
    return;
  }
  history.replaceState({ depth: 0 }, "", "#"); // 주소로 바로 열었을 때는 앱 안 메인으로
  onRoute(currentRoute());
}

// 화면 기록을 level 단계까지 걷어내고 그 자리를 hash 화면으로 바꾼다.
// 폰 뒤로가기를 눌렀을 때 방금 있던 화면(예: 비워진 장바구니)으로 되돌아가지 않게 한다.
function resetTo(hash, level) {
  const steps = depth() - level;
  if (steps <= 0) {
    history.replaceState({ depth: depth() }, "", hash);
    onRoute(currentRoute());
    return;
  }
  window.addEventListener(
    "popstate",
    () => {
      history.replaceState({ depth: level }, "", hash);
      onRoute(currentRoute());
    },
    { once: true },
  );
  history.go(-steps);
}

// 메인 화면으로
export const goHome = () => resetTo("#", 0);

// 주문 화면으로 (메인 → 주문 한 단계 위치로 맞춘다)
export const goOrder = () => resetTo("#order", 1);
