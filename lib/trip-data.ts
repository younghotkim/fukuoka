export type TripCategory =
  | "food"
  | "coffee"
  | "beer"
  | "whisky"
  | "sight"
  | "shopping"
  | "transit"
  | "hotel";

export type TripPriority = "must" | "optional" | "backup";

export type TripStop = {
  id: string;
  day: number;
  date: string;
  time: string;
  title: string;
  subtitle: string;
  /** Japanese (kanji/kana) display name — historically named nameZh because the app was first built for Taipei. */
  nameZh: string;
  /** Subway / JR line guidance — historically named mrt. */
  mrt: string;
  phrase: string;
  /** Romaji pronunciation for `phrase`. */
  phrasePron?: string;
  /** Korean meaning of `phrase`. */
  phraseHint?: string;
  category: TripCategory;
  lat: number;
  lng: number;
  highlights: string[];
  prompt: string;
  mapsQuery: string;
};

export type StopPlanMeta = {
  priority: TripPriority;
  durationMinutes: number;
  alternatives: string[];
  flexTip: string;
  openingHours?: string;
  bookingStatus?: string;
  riskLevel?: "low" | "medium" | "high";
  riskNote?: string;
};

export type TripDay = {
  day: number;
  date: string;
  title: string;
  mood: string;
  summary: string;
  journal: string;
};

export const tripDays: TripDay[] = [
  {
    day: 1,
    date: "5/22 금",
    title: "도착 → 다이묘 야키토리 → 사케 다찌노미",
    mood: "16:50 도착 → 호텔 풀고 다이묘 미식·술 야간",
    summary:
      "후쿠오카 도착(16:50) → LAMP LIGHT BOOKS HOTEL 체크인 → 大名へて 야키토리 → NEO MEGUSTA 사케·오뎅 다찌노미 → 위스키 바 한 잔.",
    journal: ""
  },
  {
    day: 2,
    date: "5/23 토",
    title: "풀데이 미식 + 가벼운 쇼핑",
    mood: "라멘·모츠나베·야타이 + 다이묘 텐진 가벼운 쇼핑",
    summary:
      "느긋한 모닝 카페 → 라멘 점심 → 텐진·다이묘 쇼핑 → 디저트 → 멘타이코 픽업 → 모츠나베 저녁 → 나카스 야타이 → 바 호핑.",
    journal: ""
  },
  {
    day: 3,
    date: "5/24 일",
    title: "체크아웃 → 11:30 출국",
    mood: "11:30 출국이라 사실상 출국일",
    summary:
      "07:30 조식 → 08:00 체크아웃 → 지하철로 공항 → 09:30 공항 도착 → ZE646 11:30 출국.",
    journal: ""
  }
];

export const categoryLabels: Record<TripCategory, string> = {
  food: "미식",
  coffee: "커피",
  beer: "사케·맥주",
  whisky: "위스키",
  sight: "관광",
  shopping: "쇼핑",
  transit: "이동",
  hotel: "체크인"
};

export const categoryColors: Record<TripCategory, string> = {
  food: "#d12c2c",     // 日の丸 hinomaru red — the headline category
  coffee: "#7a4d2b",   // 茶 cha — warm brown
  beer: "#d9a23a",     // 山吹 yamabuki — gold
  whisky: "#8a1f24",   // 真朱 shinshu — deep lacquer red
  sight: "#b08438",    // 古代金 ancient gold — for sights
  shopping: "#6b4a4a", // 鳶色 tobi-iro — kite-brown
  transit: "#3a2e2a",  // 涅色 kuri-iro — dark roasted chestnut
  hotel: "#c4302a"     // 朱色 shu-iro — warm vermilion
};

export const tripStops: TripStop[] = [
  // ───────── Day 1 (5/22 금) ─────────
  {
    id: "fuk-arrival",
    day: 1,
    date: "5/22 금",
    time: "16:50",
    title: "후쿠오카 공항 도착 (ZE639)",
    subtitle: "FUK 국제선 → 무료 셔틀 → 지하철 공항선",
    nameZh: "福岡空港 (FUK) 国際線",
    mrt: "国際線 → 무료 셔틀 5분 → 国内線 → 지하철 공항선 福岡空港駅 K13",
    phrase: "すみません、地下鉄の駅はどこですか？",
    phrasePron: "sumimasen, chikatetsu no eki wa doko desu ka?",
    phraseHint: "지하철역은 어디예요?",
    category: "transit",
    lat: 33.5897,
    lng: 130.4509,
    highlights: [
      "ZE639 인천(15:25) → 후쿠오카(16:50) 도착",
      "Visit Japan Web 미리 등록 → 입국심사 빠르게",
      "국제선 → 무료 셔틀 5분 → 국내선 → 지하 1F 지하철 공항선",
      "다이묘 호텔까지: 공항선 → 텐진역(11분 ¥260) → 도보 8분"
    ],
    prompt: "도착 첫 사진. 짐 찾는 데 걸린 시간 한 줄.",
    mapsQuery: "Fukuoka Airport International Terminal"
  },
  {
    id: "hotel-checkin",
    day: 1,
    date: "5/22 금",
    time: "17:45",
    title: "LAMP LIGHT BOOKS HOTEL 체크인",
    subtitle: "다이묘 책 호텔 — 베이스캠프",
    nameZh: "LAMP LIGHT BOOKS HOTEL fukuoka (大名)",
    mrt: "텐진역(天神駅) K08 / 아카사카역(赤坂駅) K07에서 도보 6~8분",
    phrase: "予約しています、チェックインお願いします。",
    phrasePron: "yoyaku shiteimasu, chekku-in onegai shimasu",
    phraseHint: "예약했어요, 체크인 부탁드려요",
    category: "hotel",
    lat: 33.5869418,
    lng: 130.3953066,
    highlights: [
      "다이묘 한복판 — 大名へて 야키토리 도보 1분",
      "1F 북카페·라운지 있음 (서점 호텔 컨셉)",
      "짐 풀고 가볍게 옷만 갈아입고 바로 야키토리로"
    ],
    prompt: "체크인 첫인상, 1F 북카페 분위기 한 줄.",
    mapsQuery: "LAMP LIGHT BOOKS HOTEL fukuoka"
  },
  {
    id: "yakitori-daimyo-hete",
    day: 1,
    date: "5/22 금",
    time: "18:30",
    title: "大名へて — 야키토리 저녁",
    subtitle: "호텔 도보 1분, 다이묘 야키토리 노포",
    nameZh: "やきとり 大名 へて",
    mrt: "텐진역(天神駅) K08 / 아카사카역(赤坂駅) K07 도보 7분",
    phrase: "二人、おすすめのコースでお願いします。",
    phrasePron: "futari, osusume no kōsu de onegai shimasu",
    phraseHint: "두 명, 추천 코스로 부탁드려요",
    category: "food",
    lat: 33.5866845,
    lng: 130.393571,
    highlights: [
      "호텔에서 도보 1~2분 — 첫 끼로 완벽",
      "닭꼬치·돼지꼬치·야사이마키(채소말이) 등 부위별",
      "주말 저녁은 예약 권장 (TableCheck/전화)",
      "사케·하이볼 곁들이면 완성"
    ],
    prompt: "오늘 베스트 꼬치 1개 + 사케/하이볼 선택 기록.",
    mapsQuery: "やきとり 大名 へて 福岡"
  },
  {
    id: "neo-megusta-imaizumi",
    day: 1,
    date: "5/22 금",
    time: "20:30",
    title: "NEO MEGUSTA 今泉店 — 사케·오뎅 다찌노미",
    subtitle: "스탠딩 바, 일본주 셀렉션 + 오뎅",
    nameZh: "ネオ メグスタ 今泉店 (日本酒とおでんの立ち飲み)",
    mrt: "텐진역(天神駅) K08 또는 텐진미나미역(天神南駅) N16 도보 5분",
    phrase: "日本酒のおすすめを少しずつ味見できますか？",
    phrasePron: "nihonshu no osusume o sukoshi zutsu ajimi dekimasu ka?",
    phraseHint: "추천 사케 조금씩 맛볼 수 있어요?",
    category: "beer",
    lat: 33.5865836,
    lng: 130.3991038,
    highlights: [
      "스탠딩 바 — 짧고 굵게",
      "일본 각지 사케 + 오뎅 한 조각씩",
      "야키토리 후 2차로 완벽한 동선 (도보 5분)"
    ],
    prompt: "오늘의 사케 베스트 + 오뎅 픽 한 줄.",
    mapsQuery: "ネオ メグスタ 今泉店 福岡"
  },
  {
    id: "akasaka-komikan",
    day: 1,
    date: "5/22 금",
    time: "20:30",
    title: "赤坂 古今館 (후보) — 이자카야·사시미·카마도 밥",
    subtitle: "다이묘/아카사카 권 고급 이자카야 — 헤테 대신 후보",
    nameZh: "赤坂 こみかん",
    mrt: "아카사카역(赤坂駅) K07 도보 3분",
    phrase: "本日のお造り盛り合わせをください。",
    phrasePron: "honjitsu no otsukuri moriawase o kudasai",
    phraseHint: "오늘의 사시미 모둠 주세요",
    category: "food",
    lat: 33.5860926,
    lng: 130.3914958,
    highlights: [
      "다이묘 자매점 — Warayaki Mikan(藁焼き みかん) 계열",
      "사시미 모둠 + 카마도(가마솥) 밥이 시그니처",
      "카운터 위주 — 예약 강력 권장",
      "Day 1 야키토리 대신 가거나 Day 2 저녁 후보로"
    ],
    prompt: "야키토리 vs 코킨칸 — 어디가 더 좋았는지 비교.",
    mapsQuery: "赤坂 古今館 福岡"
  },
  {
    id: "bar-d1",
    day: 1,
    date: "5/22 금",
    time: "22:00",
    title: "위스키 바 한 잔 (선택)",
    subtitle: "다이묘 권 위스키 바 — 첫 밤 마무리",
    nameZh: "BAR — Whisky Bar (大名 / 警固)",
    mrt: "텐진역(天神駅) K08 / 아카사카역(赤坂駅) K07 도보 5~7분",
    phrase: "ジャパニーズウイスキーのおすすめは？",
    phrasePron: "japanīzu uisukī no osusume wa?",
    phraseHint: "재팬 위스키 추천 좀 해주세요",
    category: "whisky",
    lat: 33.5872,
    lng: 130.396,
    highlights: [
      "Bar Higuchi / Bar Oscar / Bar Leichhardt 후보",
      "야마자키·하쿠슈·치치부 라인업 확인",
      "차지(테이블 차지) 있는 경우 ¥500~1,000",
      "현장 컨디션 보고 — 피곤하면 패스 → 호텔 1F 라운지"
    ],
    prompt: "오늘의 원픽 위스키 + 향, 다시 가고 싶은지.",
    mapsQuery: "Bar Higuchi Tenjin Fukuoka"
  },

  // ───────── Day 2 (5/23 토) ─────────
  {
    id: "morning-coffee",
    day: 2,
    date: "5/23 토",
    time: "09:30",
    title: "모닝 카페 — 호텔 1F or REC",
    subtitle: "느긋한 출발",
    nameZh: "Morning Café",
    mrt: "호텔 1F (LAMP LIGHT BOOKS) 또는 텐진역(天神駅) K08",
    phrase: "ホットコーヒーをお願いします。",
    phrasePron: "hotto kōhī o onegai shimasu",
    phraseHint: "따뜻한 커피 주세요",
    category: "coffee",
    lat: 33.5869,
    lng: 130.3953,
    highlights: [
      "호텔 1F 북카페 — 게으른 모닝",
      "또는 REC COFFEE / Manu Coffee 텐진점 (도보권)",
      "토요일이라 사람 몰리기 전 9~10시가 베스트"
    ],
    prompt: "오늘의 첫 커피 한 줄 + 책 한 권 골랐는지.",
    mapsQuery: "REC COFFEE Tenjin Fukuoka"
  },
  {
    id: "ramen-lunch",
    day: 2,
    date: "5/23 토",
    time: "12:00",
    title: "이치란 / 신신 라멘 — 점심",
    subtitle: "후쿠오카 돈코츠 라멘 한 그릇",
    nameZh: "一蘭 / Shin-Shin 拉麺",
    mrt: "텐진역(天神駅) K08 또는 하카타역(博多駅) K11",
    phrase: "替え玉一つお願いします。",
    phrasePron: "kaedama hitotsu onegai shimasu",
    phraseHint: "면 추가(카에다마) 하나 주세요",
    category: "food",
    lat: 33.5891,
    lng: 130.4006,
    highlights: [
      "이치란(一蘭) 텐진 / 캐널시티 / 하카타역 지점",
      "Shin-Shin(신신) — 텐진 본점 (현지 인기 1위급)",
      "카에다마(면 추가) ¥200 — 첫 그릇 다 먹기 전에 주문",
      "줄 짧은 가게로 즉석 변경 OK"
    ],
    prompt: "이치란 vs 신신 — 둘이 한 군데씩 시켜서 비교.",
    mapsQuery: "Shin-Shin Tenjin Fukuoka"
  },
  {
    id: "tenjin-daimyo-shopping",
    day: 2,
    date: "5/23 토",
    time: "14:00",
    title: "텐진·다이묘 가벼운 쇼핑",
    subtitle: "솔라리아·파르코·다이묘 골목",
    nameZh: "天神 · 大名 ショッピング",
    mrt: "텐진역(天神駅) K08 / 텐진미나미역(天神南駅) N16",
    phrase: "免税はできますか？",
    phrasePron: "menzei wa dekimasu ka?",
    phraseHint: "면세 되나요?",
    category: "shopping",
    lat: 33.5912,
    lng: 130.3989,
    highlights: [
      "솔라리아 플라자 / 파르코 — 한국에 없는 브랜드 위주",
      "다이묘 골목 — 빈티지·편집숍·디저트",
      "ABC마트·돈키호테(텐진점) 잠깐",
      "쇼핑 무거우면 호텔에 잠깐 들렀다 다시"
    ],
    prompt: "다이묘에서 발견한 가게 한 곳 + 산 거 한 가지.",
    mapsQuery: "Solaria Plaza Tenjin Fukuoka"
  },
  {
    id: "afternoon-coffee",
    day: 2,
    date: "5/23 토",
    time: "16:00",
    title: "디저트·스페셜티 커피 (선택)",
    subtitle: "다리 쉬고 + 단 거 한 입",
    nameZh: "Specialty Coffee & Sweets",
    mrt: "텐진역(天神駅) K08 도보권",
    phrase: "今日のおすすめは？",
    phrasePron: "kyō no osusume wa?",
    phraseHint: "오늘의 추천은요?",
    category: "coffee",
    lat: 33.589,
    lng: 130.3998,
    highlights: [
      "Manu Coffee / COFFEE COUNTY / FUK Coffee 후보",
      "디저트는 BAKE CHEESE TART / Henri Charpentier",
      "쇼핑·저녁 사이 환기 — 30~45분만"
    ],
    prompt: "디저트 베스트 1 + 커피 산미 한 줄.",
    mapsQuery: "Manu Coffee Daimyo Fukuoka"
  },
  {
    id: "fukuya-mentaiko",
    day: 2,
    date: "5/23 토",
    time: "17:30",
    title: "후쿠야 본점 — 멘타이코 픽업",
    subtitle: "선물·자취용 명란 마지막날 들고 가기 vs 지금 픽업",
    nameZh: "ふくや (中洲本店 / 博多駅店)",
    mrt: "나카스카와바타역(中洲川端駅) K09 본점 / 하카타역(博多駅) K11 매장",
    phrase: "保冷バッグはありますか？",
    phrasePron: "horei baggu wa arimasu ka?",
    phraseHint: "보냉백 있나요?",
    category: "shopping",
    lat: 33.5938,
    lng: 130.4081,
    highlights: [
      "후쿠야(ふくや) — 멘타이코 원조 명가",
      "본점은 나카스 / 하카타역 디파치카에도 매장",
      "보냉백 챙기기 (호텔 냉장고 → 마지막 날 캐리어)",
      "마지막날 시간 빠듯하면 공항 매장에서 픽업도 가능"
    ],
    prompt: "고른 멘타이코 종류 + 누구 줄 선물인지 메모.",
    mapsQuery: "Fukuya Nakasu Main Store"
  },
  {
    id: "motsunabe-dinner",
    day: 2,
    date: "5/23 토",
    time: "18:30",
    title: "모츠나베 저녁 — 笑楽 / 楽天地",
    subtitle: "곱창 전골, 후쿠오카 대표 저녁",
    nameZh: "もつ鍋 笑楽 / 楽天地",
    mrt: "텐진역(天神駅) K08 도보 5분",
    phrase: "二人前、しょうゆ味でお願いします。",
    phrasePron: "ninin-mae, shōyu aji de onegai shimasu",
    phraseHint: "2인분, 간장 맛으로 주세요",
    category: "food",
    lat: 33.5912,
    lng: 130.4014,
    highlights: [
      "笑楽(쇼라쿠) / 楽天地 / おおいし — 텐진권 대표",
      "쇼유(간장) vs 미소(된장) — 둘이 다른 맛 시키면 비교",
      "마지막에 챵폰면(ちゃんぽん麺)으로 마무리",
      "주말 저녁 17:30 입장 시도 (예약 권장)"
    ],
    prompt: "쇼유 vs 미소 — 누가 어느 쪽 손 들었는지 + 챵폰 점수.",
    mapsQuery: "もつ鍋 笑楽 天神 福岡"
  },
  {
    id: "nakasu-yatai",
    day: 2,
    date: "5/23 토",
    time: "21:00",
    title: "나카스 야타이 — 강변 포장마차",
    subtitle: "후쿠오카 명물 — 야키라멘·교자 가볍게",
    nameZh: "中洲屋台",
    mrt: "나카스카와바타역(中洲川端駅) K09 도보 5분",
    phrase: "二人です、座れますか？",
    phrasePron: "futari desu, suwaremasu ka?",
    phraseHint: "두 명인데 자리 있어요?",
    category: "food",
    lat: 33.5946,
    lng: 130.405,
    highlights: [
      "모츠나베로 배 부른 상태라 가볍게 — 교자 + 야키라멘 한 그릇",
      "비 오면 휴업 — 일기예보 체크",
      "현금만 받는 야타이도 많음 (¥5,000 챙기기)",
      "강변 야경 사진 1장"
    ],
    prompt: "야타이 사장님과 옆자리 사람들 인상 한 줄.",
    mapsQuery: "Nakasu Yatai Fukuoka",
  },
  {
    id: "bar-hopping-d2",
    day: 2,
    date: "5/23 토",
    time: "22:30",
    title: "위스키 바 호핑 — 마지막 밤",
    subtitle: "다이묘/텐진 위스키 바 1~2곳",
    nameZh: "BAR HOPPING",
    mrt: "텐진역(天神駅) K08 / 아카사카역(赤坂駅) K07",
    phrase: "おすすめのカクテルをお願いします。",
    phrasePron: "osusume no kakuteru o onegai shimasu",
    phraseHint: "추천 칵테일로 주세요",
    category: "whisky",
    lat: 33.5872,
    lng: 130.396,
    highlights: [
      "Bar Higuchi / Bar Oscar / Bar Leichhardt / Bar Hibiki",
      "재팬 위스키 / 클래식 칵테일 한 잔",
      "차지 미리 확인 — 보통 ¥500~1,000",
      "내일 11:30 출국 → 너무 늦지 않게"
    ],
    prompt: "이번 여행 베스트 바 + 마지막 잔 한 줄 일기.",
    mapsQuery: "Bar Leichhardt Fukuoka"
  },

  // ───────── Day 3 (5/24 일) ─────────
  {
    id: "hotel-breakfast-d3",
    day: 3,
    date: "5/24 일",
    time: "07:30",
    title: "조식 + 체크아웃",
    subtitle: "출국일 — 빠르게 정리",
    nameZh: "ホテル朝食 → チェックアウト",
    mrt: "호텔 내",
    phrase: "荷物は全部出ました。チェックアウトお願いします。",
    phrasePron: "nimotsu wa zenbu demashita. chekku-auto onegai shimasu",
    phraseHint: "짐 다 뺐어요. 체크아웃 부탁드려요",
    category: "hotel",
    lat: 33.5869418,
    lng: 130.3953066,
    highlights: [
      "조식 후 8시 전 체크아웃 목표",
      "멘타이코 보냉백 → 캐리어 안쪽에",
      "잊은 거 한 번 더 체크 (충전기·여권)"
    ],
    prompt: "마지막 호텔 사진 + 컨디션 한 줄.",
    mapsQuery: "LAMP LIGHT BOOKS HOTEL fukuoka"
  },
  {
    id: "airport-transit",
    day: 3,
    date: "5/24 일",
    time: "08:30",
    title: "공항 이동 — 지하철 공항선",
    subtitle: "다이묘 → 텐진 → 공항선 → FUK 국내선 → 셔틀 → 국제선",
    nameZh: "天神駅 → 福岡空港駅 → 国際線",
    mrt: "텐진역(天神駅) K08 공항선 → 福岡空港駅 K13 (11분)",
    phrase: "国際線ターミナルへのシャトルはどこですか？",
    phrasePron: "kokusaisen tāminaru e no shatoru wa doko desu ka?",
    phraseHint: "국제선 셔틀버스 어디예요?",
    category: "transit",
    lat: 33.5912,
    lng: 130.3996,
    highlights: [
      "다이묘 → 텐진역 도보 8분 (캐리어 끌고)",
      "공항선 11분 ¥260",
      "国内線 → 무료 셔틀 5분 → 国際線",
      "체크인 줄 길면 자동수속기/모바일 체크인"
    ],
    prompt: "공항 도착까지 걸린 총 시간 한 줄.",
    mapsQuery: "Fukuoka Tenjin Station to Airport"
  },
  {
    id: "airport-departure",
    day: 3,
    date: "5/24 일",
    time: "09:30",
    title: "후쿠오카 공항 — ZE646 11:30 출국",
    subtitle: "체크인 → 면세점 → 보안 → 게이트",
    nameZh: "福岡空港 国際線 出発",
    mrt: "지하철 공항선 福岡空港駅 K13 → 국제선 셔틀 5분",
    phrase: "搭乗券を見せてください？",
    phrasePron: "tōjōken o misete kudasai",
    phraseHint: "탑승권 보여주실래요?",
    category: "transit",
    lat: 33.5897,
    lng: 130.4509,
    highlights: [
      "ZE646 후쿠오카(11:30) → 인천(13:00) 도착",
      "체크인 마감 = 출발 50분 전 = 10:40",
      "면세점: 야마자키·산토리·드러그스토어 마지막 픽업",
      "여행 사진/메모 정리 — 비행 중 회고"
    ],
    prompt: "여행 총평 한 줄 — 무엇이 베스트였나.",
    mapsQuery: "Fukuoka Airport International Departures"
  }
];

export const essentials = [
  "5/24 일 09:30까지 공항 도착 (11:30 출국 = 체크인 마감 10:40)",
  "야타이는 비 오면 휴업 — 5/23 저녁 백업 식당 미리 점찍기",
  "지하철 1일권(¥640) vs SUGOCA — 5/23 풀데이면 1일권이 이득",
  "다이묘 호텔 기준 모든 식당 도보 1~7분",
  "선물 멘타이코는 후쿠야 본점/하카타역/공항 매장 중 선택",
  "Visit Japan Web 사전 등록 (5/22 도착 전)"
];

export const priorityLabels: Record<TripPriority, string> = {
  must: "필수",
  optional: "선택",
  backup: "후보"
};

export const stopPlanMeta: Record<string, StopPlanMeta> = {
  "fuk-arrival": {
    priority: "must",
    durationMinutes: 60,
    alternatives: ["니시테츠 버스로 텐진 직행", "공항 택시 (¥2,000~2,500)"],
    flexTip: "ZE639 도착이 늦어지면 야키토리 예약 시간 조정."
  },
  "hotel-checkin": {
    priority: "must",
    durationMinutes: 30,
    alternatives: ["짐만 맡기고 바로 야키토리"],
    flexTip: "도착이 늦으면 짐만 맡기고 바로 大名へて로."
  },
  "yakitori-daimyo-hete": {
    priority: "must",
    durationMinutes: 90,
    alternatives: ["赤坂 古今館 (사시미·카마도 밥)", "다른 다이묘 야키토리"],
    flexTip: "예약 권장 (TableCheck/전화). 못 잡으면 코킨칸으로 스위치.",
    riskLevel: "medium",
    riskNote: "주말 저녁 워크인 어려울 수 있음"
  },
  "neo-megusta-imaizumi": {
    priority: "optional",
    durationMinutes: 60,
    alternatives: ["다른 다찌노미 (今泉/警固 권)", "호텔 1F 라운지"],
    flexTip: "야키토리 후 가볍게 — 스탠딩이라 피곤하면 패스."
  },
  "akasaka-komikan": {
    priority: "backup",
    durationMinutes: 100,
    alternatives: ["大名へて (야키토리)", "다른 다이묘 이자카야"],
    flexTip: "야키토리 예약 못 잡으면 즉시 스위치. Day 2 저녁 후보로도 OK.",
    riskLevel: "medium",
    riskNote: "카운터 위주 + 인기 — 예약 강력 권장"
  },
  "bar-d1": {
    priority: "optional",
    durationMinutes: 70,
    alternatives: ["호텔 1F 라운지", "편의점 맥주 + 야경"],
    flexTip: "도착일 피곤하면 패스 — Day 2 바 호핑에 집중."
  },

  "morning-coffee": {
    priority: "optional",
    durationMinutes: 45,
    alternatives: ["호텔 룸서비스 모닝", "편의점 모닝"],
    flexTip: "느긋한 시작이 핵심. 너무 일찍 나가지 않기."
  },
  "ramen-lunch": {
    priority: "must",
    durationMinutes: 50,
    alternatives: ["하카타 잇푸도 본점", "캐널시티 라멘스타디움"],
    flexTip: "이치란·신신 둘이 한 그릇씩 시켜서 비교가 베스트."
  },
  "tenjin-daimyo-shopping": {
    priority: "optional",
    durationMinutes: 120,
    alternatives: ["하카타역 한큐 디파치카", "캐널시티 하카타"],
    flexTip: "쇼핑 무거우면 호텔에 잠깐 들렀다 다시. 가벼움 = 환기 정도."
  },
  "afternoon-coffee": {
    priority: "optional",
    durationMinutes: 45,
    alternatives: ["호텔 1F 북카페", "BAKE CHEESE TART 들고 산책"],
    flexTip: "쇼핑이 길어지면 패스."
  },
  "fukuya-mentaiko": {
    priority: "must",
    durationMinutes: 30,
    alternatives: ["하카타역 한큐 매장", "공항 면세점 매장"],
    flexTip: "마지막날 시간 빠듯하면 공항으로 미루기."
  },
  "motsunabe-dinner": {
    priority: "must",
    durationMinutes: 110,
    alternatives: ["赤坂 古今館 (이자카야 코스)", "おおいし / 楽天地"],
    flexTip: "주말 저녁 — 17:30 입장 시도. 예약 권장.",
    riskLevel: "medium",
    riskNote: "주말 저녁 웨이팅 자주 발생"
  },
  "nakasu-yatai": {
    priority: "optional",
    durationMinutes: 60,
    alternatives: ["호텔 1F 라운지", "편의점 야식"],
    flexTip: "비 예보면 스킵. 모츠나베로 이미 배 부르면 가볍게.",
    riskLevel: "medium",
    riskNote: "비/우천 시 휴업"
  },
  "bar-hopping-d2": {
    priority: "must",
    durationMinutes: 100,
    alternatives: ["호텔 근처 한 잔", "Bar Hibiki / Speakeasy"],
    flexTip: "내일 11:30 출국 — 12시 전 마무리 권장."
  },

  "hotel-breakfast-d3": {
    priority: "must",
    durationMinutes: 60,
    alternatives: ["편의점 모닝 + 즉시 공항", "스킵하고 공항에서 식사"],
    flexTip: "08시 체크아웃 목표 — 짐 점검에 집중."
  },
  "airport-transit": {
    priority: "must",
    durationMinutes: 50,
    alternatives: ["공항 택시 (¥2,000~2,500)", "니시테츠 버스"],
    flexTip: "캐리어 끌고 다이묘→텐진역 도보 8분. 비 오면 택시."
  },
  "airport-departure": {
    priority: "must",
    durationMinutes: 120,
    alternatives: [],
    flexTip: "절대 스킵 불가. 체크인 마감 10:40 (출발 50분 전)."
  }
};

export function getStopPlan(stopId: string): StopPlanMeta {
  return (
    stopPlanMeta[stopId] ?? {
      priority: "optional",
      durationMinutes: 60,
      alternatives: ["근처 카페 휴식", "다음 일정으로 바로 이동"],
      flexTip: "현장 컨디션에 따라 체류 시간을 조정.",
      openingHours: "",
      bookingStatus: "",
      riskLevel: "low",
      riskNote: ""
    }
  );
}

export const flexModes = [
  {
    id: "rain",
    title: "비 오는 날",
    description: "야타이 휴업 가능 — 실내 모츠나베/라멘/이자카야로 대체. 캐리어 동선 짧게."
  },
  {
    id: "tired",
    title: "피곤한 날",
    description: "선택/후보 일정을 숨기고 식당 사이 호텔 휴식 30분 확보."
  },
  {
    id: "hungry",
    title: "배고픈 날",
    description: "모츠나베·야키토리·라멘·야타이 모두 풀세트. 다찌노미는 가볍게."
  }
];
