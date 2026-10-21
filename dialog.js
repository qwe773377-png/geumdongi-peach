import { CONFIG } from "./config.js";

const $ = (id) => document.getElementById(id);

export function initDialog() {
  $("dialog-ok").textContent = CONFIG.dialog.ok;
  $("dialog-cancel").textContent = CONFIG.dialog.cancel;
}

// 앱 자체 대화상자. 확인이면 true, 취소면 false를 돌려준다.
// okText·cancelText를 주면 이번 한 번만 버튼 글자를 바꾼다 (안 주면 기본 글자).
export function ask(text, { showCancel, okText, cancelText }) {
  return new Promise((resolve) => {
    $("dialog-text").textContent = text;
    $("dialog-ok").textContent = okText ?? CONFIG.dialog.ok;
    $("dialog-cancel").textContent = cancelText ?? CONFIG.dialog.cancel;
    $("dialog-cancel").hidden = !showCancel;
    $("dialog").hidden = false;
    const close = (result) => {
      $("dialog").hidden = true;
      $("dialog-ok").onclick = null;
      $("dialog-cancel").onclick = null;
      resolve(result);
    };
    $("dialog-ok").onclick = () => close(true);
    $("dialog-cancel").onclick = () => close(false);
  });
}
