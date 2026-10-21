# 금동이네 꿀복통 (구조 문서)

복숭아 통조림 판매 웹앱(PWA). 폰 홈 화면에 설치해서 쓴다. 현재 화면 단계: 메인·상세·주문·장바구니 완료. 실제 주문 접수는 아직 없음.

## 파일 역할

| 파일 | 역할 |
|---|---|
| `config.js` | 화면 글, 글귀 이미지 경로, 상품 목록, 대화상자 문구. 값은 여기서만 정한다 |
| `assets/tagline.webp` | 제목 밑 글귀 이미지 (900×600, 투명 배경). 글귀 문구는 이 이미지 안에 있다 |
| `assets/fonts/jua/` | 글씨체 주아체(BM JUA, SIL OFL 1.1). `fonts.css`가 한글 조각 87개를 연결해서 폰은 필요한 조각만 받는다. `OFL.txt`(라이선스) 삭제 금지 |
| `assets/hwangdo.webp` `baekdo.webp` `cheondo.webp` | 상세 화면 이미지 (900폭, 투명 배경). 원본은 체크무늬가 그림으로 박혀 있어 배경을 지워서 씀 |
| `index.html` | 화면 4개(메인 `#home`, 상세 `#detail`, 주문 `#order-screen`, 장바구니 `#cart-screen`)와 대화상자 뼈대 |
| `style.css` | 모양. 안전 영역, 가로 3버튼, 고정 하단 버튼, 36px 버튼+44px 누름 범위 |
| `app.js` | 시작점. 각 화면 초기화 후 `startRouting`, 주소에 맞춰 화면 hidden 전환 |
| `route.js` | 주소(`#id`/`#order`/`#cart`) → 화면 결정 (순수 함수) |
| `nav.js` | 화면 이동 `navigate`, 뒤로 `goBack`, 메인으로 `goHome` (history depth로 앱 밖으로 안 나감) |
| `cart.js` | 장바구니 계산 (순수 함수: 담기·수량·합계·가격 표기·불러온 값 정리) |
| `store.js` | 장바구니 상태 보관, localStorage 저장(실패해도 동작), 변경 알림 |
| `products.js` | 상품 버튼 3개 만들기 (메인·주문 화면 공통) |
| `home.js` | 메인 화면 (상품 버튼 → 상세, 주문하기 → `#order`) |
| `detail.js` | 상세 화면. 주문하기 = 1개 담고 주문 화면으로 |
| `orderScreen.js` | 주문 화면: 상품 버튼(누를 때마다 +1, 개수 배지), 내역(줄마다 −/+)·합계, 장바구니 버튼 하나 |
| `cartScreen.js` | 장바구니 화면: −/+ 수량, 삭제, 전체 비우기, 합계 |
| `order.js` | 주문 흐름: 번호 확인 → 장바구니 비우고 문자 앱 열기 → 추가 주문 질문 → 장바구니/메인 |
| `sms.js` | 문자 주소·내용 만들기 (순수 함수, import 없음). 아이폰은 `&body=`, 안드로이드는 `?body=` |
| `dialog.js` | 앱 자체 대화상자 `ask()` |
| `manifest.json` | 홈 화면 설치 정보 (이름, 아이콘, 전체 화면 standalone) |
| `assets/icons/` | 앱 아이콘 (192, 512, maskable 512, apple-touch 180). 복숭아 그림 + 메인 배경색 `#fff4ea` |
| `pwa.js` | 서비스 워커 등록 (https·localhost에서만, 실패해도 앱은 동작) |
| `sw.js` | 오프라인용 서비스 워커. 온라인이면 항상 최신 파일을 받고(network-first), 받은 파일을 저장해 오프라인에서 씀 |
| `android/` | 안드로이드 앱 껍데기(WebView). 웹앱 주소(`strings.xml`의 `app_url`)를 열 뿐이라 **웹 파일을 고치면 APK 재설치 없이 반영**. 앱 이름·아이콘·주소를 바꿀 때만 APK를 다시 만든다. 뒤로 버튼은 웹 history를 따라감 |
| `.github/workflows/build-apk.yml` | GitHub Actions로 APK 빌드. 결과: 릴리스 `apk-latest`의 `geumdongi-peach.apk` (고정 다운로드 링크) |
| `test.mjs` | 회귀 테스트: `node test.mjs` |

## 의존 방향

`app.js` → 화면 모듈(`home`/`detail`/`orderScreen`/`cartScreen`) → `store.js`·`nav.js`·`order.js`·`products.js`·`dialog.js` → `cart.js`·`route.js`·`config.js`. 한 방향만, 순환 없음 (`test.mjs`가 검사). `cart.js`·`config.js`는 아무것도 import하지 않는다.

## 현재 동작

- 상품 버튼 3개(황도, 백도, 천도)는 가로 배치, 이름 글씨가 "꿀 통조림"보다 큼. 누르면 상세(`#id`)
- 상세: 왼쪽 위 뒤로 → 이미지 → "OO의 효능"+흰 카드 설명 → "꿀 통조림 이렇게 만들어져요"(설명은 나중, 비면 제목만) → 주문하기
- 주문 화면(`#order`, 메인 주문하기로 진입): 뒤로(상세와 같은 크기) → 상품 버튼 3개(탭마다 +1) → 장바구니 내역(줄마다 −/+, 1개에서 −는 줄 삭제)·합계 → 맨 아래 장바구니 버튼 하나(개수 표시). **주문 화면엔 주문하기 없음**
- 장바구니(`#cart`)가 최종 확인 화면, 여기서만 주문하기(주문 확정). 수량 −/+(1개에서 −는 비활성), 삭제, 전체 비우기(확인), 합계, 주문하기
- 장바구니는 localStorage(`geumdongi-cart`)에 저장. 최대 99개/상품. 저장이 막혀도 앱은 동작
- 가격은 **시험값 개당 10,000원**, `config.js`의 상품 `price`에서만 바꾼다
- 주문 접수는 **문자(SMS)**: 장바구니 화면의 주문하기 → (확인 질문 없이) 장바구니를 비우고 문자 앱이 열림, 주문 내용이 적혀 있어 손님은 전송만 누름 → 앱으로 돌아오면 "추가 주문을 하시겠어요?" → 추가 주문: 장바구니 화면, 아니요: 메인 화면(`goHome`이 화면 기록을 걷어냄). 앱은 문자가 실제 전송됐는지 알 수 없다 (문자 앱에서 보내지 않고 돌아오면 장바구니만 비워짐)
- 받는 번호는 `config.js`의 `orderPhone` (주인 휴대폰). **비어 있으면 주문이 막히고 안내만 나온다.** 저장소가 공개라 이 번호는 누구나 볼 수 있다
- 손님 연락처·이름은 따로 받지 않음 (문자에 보낸 번호가 자동으로 따라옴). 받을 방법(배송/수령)도 아직 없음
- 안드로이드 APK(WebView)에서는 `sms:` 주소를 `MainActivity`가 바깥 앱 열기로 처리한다 (앱 주소와 호스트가 달라서)
- 뒤로: `history.back()`(depth>0), 주소로 바로 열었으면 메인으로. 앱 밖으로 나가지 않음
- 뒤로·−/+·삭제 버튼은 눈에 보이는 크기 36px, 누르는 범위 `::after`로 44px. 눌림 표시는 색만 (scale은 누르는 범위를 줄임)
- 글씨체 주아체 하나(`font-synthesis:none`, 버튼 `font-family:inherit`). '둥근굴림'은 라이선스 확인 불가로 미사용
- "만들어져요" 글은 `config.js`의 `MAKING` 하나를 세 상품이 같이 씀 (직접 제작·껍질과 씨는 손질·꿀 넣음, 사용자가 알려 준 사실만. **기계·살균 등 공정 언급은 넣지 않는다** — 사용자 요청). 과정이 달라지면 상품별로 분리
- 효능 글은 영양 성분 사실만 (질병 예방·치료 표현 금지). 백도·천도 글은 초안, 실제 영양 표시와 대조 필요

## 배포·설치

- GitHub Pages로 공개: `https://qwe773377-png.github.io/geumdongi-peach/` (main 브랜치 루트). 파일을 올리면 1~2분 뒤 반영
- 홈 화면 설치(PWA): 안드로이드 크롬 "앱 설치", 아이폰 사파리 공유 → "홈 화면에 추가"
- **파일을 추가·삭제하면 `sw.js`의 `PRECACHE` 목록과 `VERSION`도 같이 고친다** (`test.mjs`가 빠진 .js·이미지를 검사)
- 서비스 워커는 옛 파일을 붙잡을 수 있어, 바뀐 게 안 보이면 앱을 완전히 닫았다 다시 연다
- APK: GitHub 저장소 Actions 탭 → "APK 만들기" → Run workflow (android 폴더가 바뀌어 올라가면 자동 실행). 약 3~5분 뒤 `https://github.com/qwe773377-png/geumdongi-peach/releases/download/apk-latest/geumdongi-peach.apk`
- APK는 debug 서명(빌드마다 서명이 달라, 새 APK를 덮어 설치하려면 기존 앱을 지우고 설치). 웹 파일만 고칠 땐 재설치 불필요. 구글 플레이 등록 시에는 정식 서명·targetSdk 상향 필요
- 이 작업 공간에서는 안드로이드 도구를 받을 수 없어 APK 빌드는 GitHub Actions에서만 검증된다 (코드는 문법만 확인)

## 다음 단계 (미정)

- 실제 가격 입력 (`config.js`)
- 주문 접수가 문자로 한계가 느껴지면(주문이 많아질 때) 구글 시트 자동 접수 등으로 교체
