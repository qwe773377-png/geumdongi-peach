import { CONFIG } from "./config.js";

// 황도·백도·천도 버튼 3개를 container에 만든다. 메인 화면과 주문 화면이 같이 쓴다.
// 누르면 onPick(상품)을 부른다. 상품id별 개수 표시(badge) 요소 목록을 돌려준다.
export function renderProductButtons(container, onPick) {
  container.textContent = "";
  const badgeById = {};
  for (const p of CONFIG.products) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "product";
    btn.dataset.id = p.id;
    btn.innerHTML = `<span class="kind"></span><span class="suffix"></span><span class="badge" hidden></span>`;
    btn.querySelector(".kind").textContent = p.name;
    btn.querySelector(".suffix").textContent = CONFIG.productSuffix;
    btn.addEventListener("click", () => onPick(p));
    badgeById[p.id] = btn.querySelector(".badge");
    container.appendChild(btn);
  }
  return badgeById;
}
