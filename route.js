// 주소 끝(#hwangdo)에서 상세 화면을 보여줄 상품을 찾는다. 없으면 null.
export function findDetailProduct(hash, products) {
  const id = hash.replace(/^#/, "");
  return products.find((p) => p.id === id && p.detail) ?? null;
}

// 주소 → 보여줄 화면. #order=주문, #cart=장바구니, #상품id=상세, 그 밖에는 메인.
export function resolveRoute(hash, products) {
  const id = hash.replace(/^#/, "");
  if (id === "order") return { screen: "order" };
  if (id === "cart") return { screen: "cart" };
  const product = findDetailProduct(hash, products);
  return product ? { screen: "detail", product } : { screen: "home" };
}
