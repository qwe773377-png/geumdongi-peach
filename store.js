import { CONFIG } from "./config.js";
import { addItem, removeItem, setQty, sanitize } from "./cart.js";

// 장바구니의 현재 상태를 한 곳에서 들고 있고, 바뀔 때마다 폰에 저장하고 화면에 알린다.
let currentCart = {};
const listeners = [];

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.storageKey));
  } catch {
    return null; // 저장소를 못 쓰거나 값이 깨졌으면 빈 장바구니로 시작
  }
}

function writeSaved() {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(currentCart));
  } catch {
    // 저장을 못 해도 화면은 계속 동작한다
  }
}

// 바뀌었으면 true, 변화가 없으면 false
function commit(next) {
  if (next === currentCart) return false;
  currentCart = next;
  writeSaved();
  listeners.forEach((fn) => fn(currentCart));
  return true;
}

export function initStore() {
  currentCart = sanitize(readSaved(), CONFIG.products, CONFIG.maxQty);
}

export const getCart = () => currentCart;
export const subscribe = (fn) => listeners.push(fn);
export const addToCart = (id) => commit(addItem(currentCart, id, CONFIG.maxQty)); // false면 최대 개수
export const changeQty = (id, qty) => commit(setQty(currentCart, id, qty, CONFIG.maxQty));
export const removeFromCart = (id) => commit(removeItem(currentCart, id));
export const clearCart = () => commit({});
