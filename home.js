import { CONFIG } from "./config.js";
import { renderProductButtons } from "./products.js";
import { navigate } from "./nav.js";

const $ = (id) => document.getElementById(id);

// 메인 화면: 상품 버튼은 그 상품의 상세 화면으로, 주문하기는 주문 화면으로 간다.
export function initHome() {
  $("title").textContent = CONFIG.title;
  $("tagline").src = CONFIG.tagline.src;
  $("tagline").alt = CONFIG.tagline.alt;
  $("footer").textContent = CONFIG.footer;
  $("home-order").textContent = CONFIG.orderButton;
  renderProductButtons($("products"), (product) => navigate(`#${product.id}`));
  $("home-order").addEventListener("click", () => navigate("#order"));
}
