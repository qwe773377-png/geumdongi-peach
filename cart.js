// 장바구니 계산. 화면과 저장소를 모르는 순수 함수만 둔다.
// cart는 { 상품id: 개수 } 모양의 객체이고, 함수들은 원래 객체를 고치지 않고 새 객체를 돌려준다.

export function addItem(cart, id, max) {
  const next = (cart[id] ?? 0) + 1;
  return next > max ? cart : { ...cart, [id]: next }; // 최대 개수면 같은 객체를 돌려줘 "변화 없음"을 알린다
}

export function removeItem(cart, id) {
  const rest = { ...cart };
  delete rest[id];
  return rest;
}

export function setQty(cart, id, qty, max) {
  if (!(id in cart)) return cart;
  if (qty <= 0) return removeItem(cart, id);
  const next = Math.min(qty, max);
  return next === cart[id] ? cart : { ...cart, [id]: next };
}

export function count(cart) {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

// 화면에 보여줄 줄 목록. 상품 목록 순서(황도, 백도, 천도)를 따른다.
export function lines(cart, products) {
  return products
    .filter((p) => cart[p.id] > 0)
    .map((p) => ({ id: p.id, name: p.name, qty: cart[p.id], price: p.price, subtotal: p.price * cart[p.id] }));
}

export function total(cart, products) {
  return lines(cart, products).reduce((sum, line) => sum + line.subtotal, 0);
}

// 폰에 저장돼 있던 값을 믿지 않고 걸러낸다: 모르는 상품, 소수, 음수, 너무 큰 개수는 버리거나 줄인다.
export function sanitize(raw, products, max) {
  const clean = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return clean;
  for (const p of products) {
    const qty = raw[p.id];
    if (Number.isInteger(qty) && qty > 0) clean[p.id] = Math.min(qty, max);
  }
  return clean;
}

export function formatPrice(amount, unit) {
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + unit;
}
