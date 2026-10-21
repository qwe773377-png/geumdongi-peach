import { initDialog } from "./dialog.js";
import { initStore } from "./store.js";
import { startRouting } from "./nav.js";
import { initHome } from "./home.js";
import { initDetail, renderDetail } from "./detail.js";
import { initOrderScreen } from "./orderScreen.js";
import { initCartScreen } from "./cartScreen.js";
import { registerOffline } from "./pwa.js";
import { initBluetooth } from "./bluetooth.js";

const $ = (id) => document.getElementById(id);

// 화면 이름(route.js가 돌려주는 값) → 화면 요소 id
const SCREEN_IDS = { home: "home", detail: "detail", order: "order-screen", cart: "cart-screen" };

function showRoute(route) {
  if (route.screen === "detail") renderDetail(route.product);
  for (const [name, id] of Object.entries(SCREEN_IDS)) $(id).hidden = name !== route.screen;
  window.scrollTo(0, 0);
  for (const area of document.querySelectorAll(".scroll")) area.scrollTop = 0;
}

initDialog();
initBluetooth();
initStore();
initHome();
initDetail();
initOrderScreen();
initCartScreen();
startRouting(showRoute);
registerOffline();
