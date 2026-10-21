import { CONFIG } from "./config.js";
import { ask } from "./dialog.js";
import { getCart, changeQty } from "./store.js";
import { lines, total, formatPrice } from "./cart.js";
import { goHome, goOrder } from "./nav.js";
import { sendProductionOrder } from "./bluetooth.js";

let submitting = false;

export async function submitOrder() {
  if (submitting) return;
  submitting = true;
  const submit = document.getElementById("cart-submit");
  submit.disabled = true;
  try {
    const cartNow = { ...getCart() };
    const items = lines(cartNow, CONFIG.products);
    if (!items.length) {
      await ask(CONFIG.dialog.emptyOrder, { showCancel: false });
      return;
    }
    const summary = items.map((item) => `${item.name} ${item.qty}개`).join("\n");
    const sum = formatPrice(total(cartNow, CONFIG.products), CONFIG.priceUnit);
    if (!await ask(CONFIG.dialog.confirmOrder(summary, sum), { showCancel: true })) return;
    const receipt = await sendProductionOrder(cartNow);
    for (const item of items) changeQty(item.id, Math.max(0, (getCart()[item.id] || 0) - item.qty));
    const position = receipt.basket === "WAIT" ? "바구니 배정 대기" : `${receipt.basket}번 바구니`;
    const state = receipt.status === "collected" ? "이미 수거된 주문" : position;
    await ask(`주문이 접수되었습니다.\n${state}\n주문번호: ${receipt.id}\n생산 현황은 장비 모니터에서 확인하세요.`, { showCancel: false });
    const more = await ask(CONFIG.dialog.moreOrder, { showCancel: true, okText: CONFIG.dialog.moreYes, cancelText: CONFIG.dialog.moreNo });
    more ? goOrder() : goHome();
  } catch (error) {
    await ask(error.message, { showCancel: false });
  } finally {
    submitting = false;
    submit.disabled = false;
  }
}
