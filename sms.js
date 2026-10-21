// 주문을 문자(SMS)로 보내기 위한 순수 함수 모음. 다른 파일을 import하지 않는다.

// 전화번호에서 숫자와 맨 앞 +만 남긴다. 예: "010-1234-5678" → "01012345678"
export function cleanPhone(raw) {
  const s = String(raw ?? "").trim();
  return (s.startsWith("+") ? "+" : "") + s.replace(/\D/g, "");
}

// 받는 번호로 쓸 수 있는지 (숫자 9~12자리, 맨 앞 + 허용)
export function isValidPhone(raw) {
  return /^\+?\d{9,12}$/.test(cleanPhone(raw));
}

// 아이폰은 번호 뒤에 &body=, 안드로이드는 ?body= 를 쓴다
export function isIos(nav) {
  const ua = nav?.userAgent ?? "";
  return /iPad|iPhone|iPod/.test(ua) || (nav?.platform === "MacIntel" && (nav?.maxTouchPoints ?? 0) > 1);
}

// 문자 앱을 여는 주소. 줄바꿈은 %0A로 들어가 문자에서도 줄이 나뉜다
export function buildSmsUrl(phone, body, ios) {
  return `sms:${cleanPhone(phone)}${ios ? "&" : "?"}body=${encodeURIComponent(body)}`;
}

// 주문 문자 내용: 머리글 + 상품 줄들 + 합계
export function buildOrderText(header, summary, totalText, totalLabel) {
  return `${header}\n${summary}\n${totalLabel} ${totalText}`;
}
