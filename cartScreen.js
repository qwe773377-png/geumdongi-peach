import { CONFIG } from "./config.js";
import { ask } from "./dialog.js";
import { getCart, subscribe, changeQty, removeFromCart, clearCart } from "./store.js";
import { lines, total, formatPrice } from "./cart.js";
import { goBack } from "./nav.js";
import { submitOrder } from "./order.js";

const $ = (id) => document.getElementById(id);

// 장바구니 화면: 상품별 수량 조절(-/+), 삭제, 합계, 전체 비우기, 맨 아래 주문하기
export function initCartScreen() {
  $("cart-back").textContent = CONFIG.back.label;
  $("cart-back").setAttribute("aria-label", CONFIG.back.aria);
  $("cart-back").addEventListener("click", goBack);
  $("cart-title").textContent = CONFIG.cart.title;
  $("cart-empty").textContent = CONFIG.order.empty;
  $("cart-total-label").textContent = CONFIG.order.total;
  $("cart-clear").textContent = CONFIG.cart.clear;
  $("cart-submit").textContent = CONFIG.orderButton;
  $("cart-clear").addEventListener("click", onClearCart);
  $("cart-submit").addEventListener("click", submitOrder);
  subscribe(renderCartScreen);
  renderCartScreen();
}

async function onClearCart() {
  if (await ask(CONFIG.dialog.clearConfirm, { showCancel: true })) clearCart();
}

function makeEl(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function makeMiniButton(text, ariaLabel, onClick, disabled = false) {
  const btn = makeEl("button", "mini", text);
  btn.type = "button";
  btn.setAttribute("aria-label", ariaLabel);
  btn.disabled = disabled;
  btn.addEventListener("click", onClick);
  return btn;
}

function buildCartItem(item) {
  const li = makeEl("li", "cart-item");

  const head = makeEl("div", "cart-item-head");
  head.append(
    makeEl("span", "cart-name", `${item.name} ${CONFIG.productSuffix}`),
    makeMiniButton(CONFIG.cart.remove, CONFIG.cart.removeAria(item.name), () => removeFromCart(item.id)),
  );

  const stepper = makeEl("div", "stepper");
  stepper.append(
    makeMiniButton("−", CONFIG.cart.minusAria(item.name), () => changeQty(item.id, item.qty - 1), item.qty <= 1),
    makeEl("span", "qty", item.qty),
    makeMiniButton("+", CONFIG.cart.plusAria(item.name), () => changeQty(item.id, item.qty + 1), item.qty >= CONFIG.maxQty),
  );
  const foot = makeEl("div", "cart-item-foot");
  foot.append(stepper, makeEl("span", "cart-sub", formatPrice(item.subtotal, CONFIG.priceUnit)));

  li.append(head, makeEl("div", "cart-unit", formatPrice(item.price, CONFIG.priceUnit)), foot);
  return li;
}

export function renderCartScreen() {
  const cartNow = getCart();
  const items = lines(cartNow, CONFIG.products);
  const list = $("cart-list");
  list.textContent = "";
  for (const item of items) list.appendChild(buildCartItem(item));
  $("cart-empty").hidden = items.length > 0;
  $("cart-total-card").hidden = items.length === 0;
  $("cart-clear").hidden = items.length === 0;
  $("cart-total").textContent = formatPrice(total(cartNow, CONFIG.products), CONFIG.priceUnit);
}
