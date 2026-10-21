// 화면에 나오는 모든 글, 상품 목록, 가격, 장바구니 설정은 여기서만 정한다.
// 세 복숭아 모두 만드는 과정이 같아서 한 곳에 둔다. 과정이 달라지면 상품별 making에 따로 쓴다.
const MAKING = "금동이네에서 직접 만들어요. 복숭아 껍질과 씨는 하나하나 손으로 정성껏 손질하고, 달콤한 꿀을 넣어서 완성해요.";

export const CONFIG = {
  title: "금동이네 꿀복통",
  tagline: {
    src: "assets/tagline.webp",
    alt: "금동이네 맛있는 꿀 복숭아 통조림 드세요",
  },
  footer: "금사조 (금오공고를 사랑하는 조)",
  orderButton: "주문하기",
  productSuffix: "꿀 통조림",
  priceUnit: "원",
  // 주문 문자를 받을 번호 (주인 휴대폰). 숫자만 써도 되고 010-1234-5678 처럼 써도 된다. 비어 있으면 주문이 막힌다.
  orderPhone: "010-2317-0771",
  maxQty: 99, // 한 상품당 장바구니에 담을 수 있는 최대 개수
  storageKey: "geumdongi-cart", // 폰에 장바구니를 저장하는 이름
  back: {
    label: "← 뒤로",
    aria: "이전 화면으로 돌아가기",
  },
  products: [
    {
      id: "hwangdo",
      name: "황도",
      price: 10000, // 시험용 개당 가격. 실제 가격이 정해지면 여기만 고친다
      detail: {
        image: { src: "assets/hwangdo.webp", alt: "금빛 황도 꿀 통조림" },
        benefit: "황도는 노란 과육이 단단하고 향이 진한 복숭아예요. 베타카로틴과 식이섬유가 들어 있어요. 부드럽고 달콤해서 누구나 먹기 좋아요.",
        making: MAKING, // "꿀 통조림 이렇게 만들어져요" 설명 (비우면 제목만 보임)
      },
    },
    {
      id: "baekdo",
      name: "백도",
      price: 10000,
      detail: {
        image: { src: "assets/baekdo.webp", alt: "핑크빛 백도 꿀 통조림" },
        benefit: "백도는 하얀 과육이 아주 부드럽고 달콤한 향이 진한 복숭아예요. 비타민 C와 식이섬유가 들어 있어요.",
        making: MAKING,
      },
    },
    {
      id: "cheondo",
      name: "천도",
      price: 10000,
      detail: {
        image: { src: "assets/cheondo.webp", alt: "오렌지빛 천도 꿀 통조림" },
        benefit: "천도는 껍질이 매끈하고 과육이 단단해서 새콤달콤한 맛이 살아 있어요. 식이섬유와 칼륨이 들어 있어요.",
        making: MAKING,
      },
    },
  ],
  detail: {
    benefitTitle: (name) => `${name}의 효능`,
    makingTitle: "꿀 통조림 이렇게 만들어져요",
  },
  order: {
    productsAria: "상품 담기",
    summaryTitle: "장바구니 내역",
    empty: "장바구니가 비었어요",
    cartButton: (count) => (count > 0 ? `장바구니 (${count})` : "장바구니"),
    qty: (n) => `${n}개`,
    total: "합계",
    smsHeader: "[금동이네 꿀복통 주문]", // 주문 문자 맨 윗줄
  },
  cart: {
    title: "장바구니",
    remove: "삭제",
    clear: "전체 비우기",
    minusAria: (name) => `${name} 하나 줄이기`,
    plusAria: (name) => `${name} 하나 늘리기`,
    removeAria: (name) => `${name} 삭제`,
  },
  dialog: {
    ok: "확인",
    cancel: "취소",
    emptyOrder: "장바구니가 비었어요.\n상품을 먼저 담아주세요",
    maxQty: (max) => `한 상품은 최대 ${max}개까지\n담을 수 있어요`,
    confirmOrder: (summary, total) => `${summary}\n합계 ${total}\n\n이걸로 주문할까요?`,
    clearConfirm: "장바구니를 모두 비울까요?",
    noPhone: "주문을 받는 번호가 아직 정해지지 않았어요.\n잠시 후 다시 시도해 주세요",
    moreOrder: "주문해 주셔서 감사해요!\n추가 주문을 하시겠어요?",
    moreYes: "추가 주문",
    moreNo: "아니요",
  },
};
