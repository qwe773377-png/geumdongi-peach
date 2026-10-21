// 서비스 워커 등록. 주소가 https(또는 localhost)일 때만 켜지고, 실패해도 앱은 그대로 동작한다.
export function registerOffline() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost") return;
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
