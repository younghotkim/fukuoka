// 후쿠오카 여행 치트시트 — 출발 전·현지에서 빠르게 확인하는 정보 모음.

export type InfoLine = { label: string; value: string; note?: string };
export type InfoCard = { id: string; emoji: string; title: string; lines: InfoLine[] };
export type Phrase = { ko: string; zh: string; pinyin: string };

export const fukuokaInfoCards: InfoCard[] = [
  {
    id: "emergency",
    emoji: "🚨",
    title: "긴급 연락처",
    lines: [
      { label: "경찰", value: "110" },
      { label: "소방·구급차", value: "119" },
      { label: "관광객 다국어 안내", value: "050-3816-2787", note: "JNTO 24시간 다국어 콜센터" },
      { label: "주후쿠오카 대한민국 총영사관", value: "+81-92-771-0461", note: "후쿠오카시 츄오구 지교하마 1-1-3" },
      { label: "긴급 영사 (24시간)", value: "+81-90-1922-7820", note: "야간·휴일 긴급" },
      { label: "외교부 영사콜센터(서울)", value: "+82-2-3210-0404" }
    ]
  },
  {
    id: "money",
    emoji: "💳",
    title: "돈·결제",
    lines: [
      { label: "통화", value: "엔 (¥ / JPY)", note: "약 ₩9.3 / ¥1 (변동, 환율 앱으로 체크)" },
      { label: "현금", value: "야타이·소형 식당·전통시장은 현금 필수", note: "편의점·체인점·지하철은 카드/모바일 OK" },
      { label: "SUGOCA / Nimoca", value: "JR 후쿠오카·지하철역에서 ¥2,000(보증금 ¥500)에 구매", note: "지하철·JR·버스·편의점 결제. 한국 환승 호환 카드는 도쿄 SUICA·PASMO와 동일" },
      { label: "지하철 1일권", value: "¥640 — 4회 이상 탑승 예정이면 이득", note: "관광 안내소·역 자판기에서 구매" },
      { label: "ATM", value: "세븐일레븐·로손 ATM에서 한국 해외카드 출금 OK", note: "수수료 ¥110~220 + 카드사 수수료" },
      { label: "팁", value: "없음 (오히려 무례할 수 있음)", note: "료칸·고급식당은 봉사료 자동 포함되는 경우 있음" }
    ]
  },
  {
    id: "transport",
    emoji: "🚇",
    title: "교통",
    lines: [
      { label: "지하철 운행", value: "약 05:30 ~ 24:00", note: "노선 3개(공항선·하코자키선·나나쿠마선) — 노선 색깔로 구분" },
      { label: "공항↔시내", value: "지하철 공항선 福岡空港 → 텐진 11분 ¥260 / 하카타 5분 ¥260", note: "또는 西鉄バス(니시테츠 버스) — 텐진/하카타 직행" },
      { label: "다자이후·야나가와", value: "西鉄電車 (천진 西鉄福岡駅에서 출발)", note: "지하철과 분리된 사철 — 1일권 따로" },
      { label: "택시", value: "기본요금 약 ¥710 (1.6km까지)", note: "GO·Uber 앱 사용 가능, 야간 22:00~ 할증 20%" },
      { label: "JR 큐슈", value: "JR 하카타역 — 신칸센·특급 사가·구마모토행", note: "단거리 지하철이 보통 더 편함" }
    ]
  },
  {
    id: "basics",
    emoji: "ℹ️",
    title: "기본 정보",
    lines: [
      { label: "전압", value: "100V / 60Hz, 콘센트 A타입", note: "한국 110/220V 겸용 기기는 거의 그대로 사용 가능 (A타입 어댑터만 필요)" },
      { label: "물", value: "수돗물 음용 가능 (한국과 비슷)", note: "편의점 생수 ¥110~150" },
      { label: "편의점", value: "세븐일레븐·로손·패밀리마트, 대부분 24시간", note: "택배·복사·티켓·도시락·맛 있는 핫푸드" },
      { label: "전화 국가번호", value: "+81 (일본), +82 (한국)" },
      { label: "비자", value: "한국 여권 무비자 90일 (관광)", note: "입국 시 Visit Japan Web 등록 권장 (사전 작성)" },
      { label: "시차", value: "한국과 동일 (UTC+9)" },
      { label: "eSIM/유심", value: "공항·편의점·온라인 (Saily/Airalo/eSIM Japan)", note: "후쿠오카 공항 도착장에 ZenFi·SoftBank 자판기" },
      { label: "흡연", value: "노상흡연 금지(텐진·하카타 일대 벌금)", note: "지정 흡연 부스 이용 — 호텔 객실 거의 금연" }
    ]
  }
];

// Phrase 타입은 zh/pinyin 필드명을 그대로 쓰지만, 후쿠오카에서는 일본어/로마자로 사용.
export const fukuokaPhrases: Phrase[] = [
  { ko: "안녕하세요", zh: "こんにちは", pinyin: "Konnichiwa" },
  { ko: "감사합니다", zh: "ありがとうございます", pinyin: "Arigatō gozaimasu" },
  { ko: "죄송합니다 / 실례합니다", zh: "すみません", pinyin: "Sumimasen" },
  { ko: "이거 주세요", zh: "これをください", pinyin: "Kore o kudasai" },
  { ko: "얼마예요?", zh: "いくらですか？", pinyin: "Ikura desu ka?" },
  { ko: "계산해 주세요", zh: "お会計お願いします", pinyin: "Okaikei onegai shimasu" },
  { ko: "화장실 어디예요?", zh: "トイレはどこですか？", pinyin: "Toire wa doko desu ka?" },
  { ko: "맵지 않게 해주세요", zh: "辛くしないでください", pinyin: "Karaku shinaide kudasai" },
  { ko: "작은 사이즈로", zh: "小さいサイズで", pinyin: "Chiisai saizu de" },
  { ko: "포장해 주세요", zh: "持ち帰りでお願いします", pinyin: "Mochikaeri de onegai shimasu" },
  { ko: "카드 되나요?", zh: "カードは使えますか？", pinyin: "Kādo wa tsukaemasu ka?" },
  { ko: "면세 되나요?", zh: "免税できますか？", pinyin: "Menzei dekimasu ka?" },
  { ko: "도와주세요!", zh: "助けてください!", pinyin: "Tasukete kudasai!" },
  { ko: "한국 사람이에요", zh: "韓国人です", pinyin: "Kankokujin desu" },
  { ko: "영어 되나요?", zh: "英語は話せますか？", pinyin: "Eigo wa hanasemasu ka?" }
];
