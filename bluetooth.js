const PENDING_KEY = "geumdongi-pending-production-order";
let connectionWait = null;
let activeRequest = null;

function bridge() {
  if (!window.FactoryBluetooth) throw new Error("블루투스 주문은 새 Android APK에서 사용할 수 있습니다. 앱을 설치해 주세요.");
  return window.FactoryBluetooth;
}

window.addEventListener("factory-bluetooth", ({ detail }) => {
  const status = document.getElementById("bluetooth-status");
  if (detail.type === "connection") {
    if (status) status.textContent = detail.message;
    if (connectionWait) detail.connected ? connectionWait.resolve() : connectionWait.reject(new Error(detail.message));
    if (!detail.connected && activeRequest) activeRequest.reject(new Error(detail.message + " 같은 주문으로 다시 시도하세요."));
  }
  if (detail.type === "line") {
    const fields = detail.message.split("|");
    if (!activeRequest || fields[1] !== activeRequest.id) return;
    if (fields[0] === "ACK") activeRequest.resolve({ id: fields[1], basket: fields[2], status: fields[3] });
    else if (fields[0] === "ERROR") activeRequest.reject(new Error("주문 접수 실패: " + fields.slice(2).join(" ")));
  }
});

export async function connectBluetooth() {
  const native = bridge();
  if (native.isConnected()) return;
  if (connectionWait) throw new Error("블루투스 연결을 진행 중입니다.");
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("블루투스 연결 대기 시간이 지났습니다.")), 60000);
    connectionWait = { resolve, reject, timer };
    try { native.connect(); } catch (error) { reject(error); }
  }).finally(() => { clearTimeout(connectionWait?.timer); connectionWait = null; });
}

export function quantitiesForCart(cart) {
  const quantities = { baekdo: cart.baekdo ?? 0, cheondo: cart.cheondo ?? 0, hwangdo: cart.hwangdo ?? 0 };
  if (Object.values(quantities).some((n) => !Number.isInteger(n) || n < 0 || n > 99) || !Object.values(quantities).some(Boolean)) throw new Error("상품 수량을 확인하세요.");
  return quantities;
}

export async function sendProductionOrder(cart) {
  if (activeRequest) throw new Error("주문 접수 확인 중입니다.");
  const quantities = quantitiesForCart(cart);
  const signature = JSON.stringify(quantities);
  let pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "null");
  if (pending && pending.signature !== signature) throw new Error(`이전 주문의 접수 여부가 미확인입니다. 이전 수량(백도 ${pending.baekdo}, 천도 ${pending.cheondo}, 황도 ${pending.hwangdo})으로 재시도하거나 PC에서 접수 여부를 확인해 주세요.`);
  if (!pending) {
    pending = { id: "o" + Date.now().toString(36) + "_" + crypto.getRandomValues(new Uint32Array(2)).join(""), signature, ...quantities };
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  }
  await connectBluetooth();
  const receipt = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("PC 접수 확인이 없습니다. PC 연결을 확인하고 같은 주문으로 다시 시도하세요.")), 15000);
    activeRequest = { id: pending.id, resolve, reject, timer };
    try {
      if (!bridge().sendOrder(JSON.stringify(pending))) reject(new Error("블루투스 주문 전송을 시작하지 못했습니다."));
    } catch (error) { reject(error); }
  }).finally(() => { clearTimeout(activeRequest?.timer); activeRequest = null; });
  localStorage.removeItem(PENDING_KEY);
  return receipt;
}

export function initBluetooth() {
  const button = document.getElementById("bluetooth-connect");
  const status = document.getElementById("bluetooth-status");
  status.textContent = window.FactoryBluetooth ? "블루투스를 연결해 주세요" : "Android APK에서 블루투스 주문 가능";
  button.addEventListener("click", () => connectBluetooth().catch((error) => { status.textContent = error.message; }));
}
