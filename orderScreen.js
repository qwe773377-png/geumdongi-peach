import { CONFIG } from "./config.js";
import { ask } from "./dialog.js";
import { renderProductButtons } from "./products.js";
import { getCart, subscribe, addToCart, changeQty } from "./store.js";
import { lines, total, count, formatPrice } from "./cart.js";
import { navigate, goBack } from "./nav.js";

const $ = (id) => document.getElementById(id);
let orderBadges = {};

// 주문 화면: 위 = 상품 버튼 3개(누르면 1개씩 담김), 가운데 = 장바구니 내역, 아래 = 장바구니 버튼 (주문 확정은 장바구니 화면에서)
export function initOrderScreen() {
  $("order-back").textContent = CONFIG.back.label;
  $("order-back").setAttribute("aria-label", CONFIG.back.aria);
  $("order-back").addEventListener("click", goBack);
  $("order-products").setAttribute("aria-label", CONFIG.order.productsAria);
  orderBadges = renderProductButtons($("order-products"), onPickProduct);
  $("order-summary-title").textContent = CONFIG.order.summaryTitle;
  $("order-empty").textContent = CONFIG.order.empty;
  $("order-total-label").textContent = CONFIG.order.total;
  $("order-cart-btn").addEventListener("click", () => navigate("#cart"));
  subscribe(renderOrderScreen);
  renderOrderScreen();
}

function makeStepButton(text, ariaLabel, onClick, disabled) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "mini";
  btn.textContent = text;
  btn.setAttribute("aria-label", ariaLabel);
  btn.disabled = disabled;
  btn.addEventListener("click", onClick);
  return btn;
}

async function onPickProduct(product) {
  if (!addToCart(product.id)) await ask(CONFIG.dialog.maxQty(CONFIG.maxQty), { showCancel: false });
}

export function renderOrderScreen() {
  const cartNow = getCart();
  const items = lines(cartNow, CONFIG.products);

  for (const p of CONFIG.products) {
    const qty = cartNow[p.id] ?? 0;
    orderBadges[p.id].textContent = qty;
    orderBadges[p.id].hidden = qty === 0;
  }

  const list = $("order-summary");
  list.textContent = "";
  for (const item of items) {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = `${item.name} ${CONFIG.productSuffix}`;
    // 잘못 담았을 때 여기서 바로 −/+ 로 고친다 (−는 1개에서 누르면 줄이 사라짐)
    const stepper = document.createElement("div");
    stepper.className = "stepper";
    const qty = document.createElement("span");
    qty.className = "qty";
    qty.textContent = item.qty;
    stepper.append(
      makeStepButton("−", CONFIG.cart.minusAria(item.name), () => changeQty(item.id, item.qty - 1), false),
      qty,
      makeStepButton("+", CONFIG.cart.plusAria(item.name), () => changeQty(item.id, item.qty + 1), item.qty >= CONFIG.maxQty),
    );
    li.append(name, stepper);
    list.appendChild(li);
  }
  $("order-empty").hidden = items.length > 0;
  $("order-total-row").hidden = items.length === 0;
  $("order-total").textContent = formatPrice(total(cartNow, CONFIG.products), CONFIG.priceUnit);
  $("order-cart-btn").textContent = CONFIG.order.cartButton(count(cartNow));
}
