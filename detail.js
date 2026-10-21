import { CONFIG } from "./config.js";
import { addToCart } from "./store.js";
import { navigate, goBack } from "./nav.js";

const $ = (id) => document.getElementById(id);
let detailProduct = null;

export function initDetail() {
  $("detail-back").textContent = CONFIG.back.label;
  $("detail-back").setAttribute("aria-label", CONFIG.back.aria);
  $("detail-making").textContent = CONFIG.detail.makingTitle;
  $("detail-order").textContent = CONFIG.orderButton;
  $("detail-back").addEventListener("click", goBack);
  // 이 상품을 1개 담고 주문 화면으로 간다
  $("detail-order").addEventListener("click", () => {
    addToCart(detailProduct.id);
    navigate("#order");
  });
}

export function renderDetail(product) {
  detailProduct = product;
  $("detail-image").src = product.detail.image.src;
  $("detail-image").alt = product.detail.image.alt;
  $("detail-benefit-title").textContent = CONFIG.detail.benefitTitle(product.name);
  $("detail-benefit").textContent = product.detail.benefit;
  $("detail-making-body").textContent = product.detail.making;
}
