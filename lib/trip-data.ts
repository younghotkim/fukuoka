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
    title: "도착 → 텐진 산책 → 나카스 야타이",
    mood: "도착하자마자 텐진 둘러보고 포장마차에서 첫 건배",
    summary:
      "후쿠오카 공항 → 지하철로 하카타·텐진 → 호텔 체크인 → 캐널시티 점심 → 텐진 산책 → 나카스 강변 야타이 → 마무리 바.",
    journal: ""
  },
  {
    day: 2,
    date: "5/23 토",
    title: "다자이후 + 야나가와 + 모츠나베 만찬",
    mood: "느긋한 조식 → 학문의 신 다자이후 → 야나가와 뱃놀이 → 저녁 모츠나베",
    summary:
      "다자이후 텐만구 + 우메가에모치 → 야나가와 뱃놀이(또는 후쿠오카 복귀) → 카페 → 저녁 모츠나베 → 텐진 바 호핑.",
    journal: ""
  },
  {
    day: 3,
    date: "5/24 일",
    title: "모모치 해변 → 라멘 마무리 → 출국",
    mood: "체크아웃 → 모모치 산책 → 한 그릇 라멘으로 마무리",
    summary:
      "호텔 조식·체크아웃 → 후쿠오카 타워·모모치 해변 → 캐널시티 막판 쇼핑 → 이치란/신신 라멘 → 지하철로 공항 → 출국.",
    journal: ""
  }
];

export const categoryLabels: Record<TripCategory, string> = {
  food: "미식",
  coffee: "커피",
  beer: "맥주",
  whisky: "위스키",
  sight: "관광",
  shopping: "쇼핑",
  transit: "이동",
  hotel: "체크인"
};

export const categoryColors: Record<TripCategory, string> = {
  food: "#e63946",
  coffee: "#7a4d2b",
  beer: "#d8a31a",
  whisky: "#8b3a3a",
  sight: "#2e6fdf",
  shopping: "#6f5bd3",
  transit: "#2f4858",
  hotel: "#3a7d44"
};

export const tripStops: TripStop[] = [
  {
    id: "fuk-arrival",
    day: 1,
    date: "5/22 금",
    time: "11:00",
    title: "후쿠오카 공항 도착 — 입국 & 지하철",
    subtitle: "FUK 국제선 → 지하철 공항선 직결",
    nameZh: "福岡空港 (FUK)",
    mrt: "国際線→무료 셔틀 5분→国内線→지하철 공항선 福岡空港駅 K13",
    phrase: "すみません、地下鉄の駅はどこですか？",
    phrasePron: "sumimasen, chikatetsu no eki wa doko desu ka?",
    phraseHint: "지하철역은 어디예요?",
    category: "transit",
    lat: 33.5897,
    lng: 130.4509,
    highlights: [
      "국제선 도착 → 무료 셔틀(약 5분)로 국내선 터미널",
      "국내선 지하 1층 → 지하철 공항선 福岡空港駅",
      "텐진까지 11분 ¥260, 하카타까지 5분 ¥260",
      "1일권(¥640) 또는 SUGOCA 충전 — 하루 종일 탈 거면 1일권"
    ],
    prompt: "도착 첫 사진. 짐 찾고 컨디션 한 줄.",
    mapsQuery: "Fukuoka Airport International Terminal"
  },
  {
    id: "tenjin-checkin",
    day: 1,
    date: "5/22 금",
    time: "12:30",
    title: "호텔 체크인 — 텐진/하카타",
    subtitle: "짐 풀고 가볍게 시작",
    nameZh: "ホテル チェックイン",
    mrt: "텐진역(天神駅) K08 / 하카타역(博多駅) K11 — 호텔 위치에 맞춰",
    phrase: "予約しています、チェックインお願いします。",
    phrasePron: "yoyaku shiteimasu, chekku-in onegai shimasu",
    phraseHint: "예약했어요, 체크인 부탁드려요",
    category: "hotel",
    lat: 33.5912,
    lng: 130.3996,
    highlights: [
      "체크인 정식 시간은 15:00 — 일찍 도착하면 짐만 맡기기",
      "텐진/나카스/하카타 어디든 도보·지하철 5–10분권",
      "체크인 후 바로 점심 / 산책"
    ],
    prompt: "호텔 첫인상과 창밖 풍경 한 컷.",
    mapsQuery: "Tenjin Fukuoka hotel"
  },
  {
    id: "canal-city",
    day: 1,
    date: "5/22 금",
    time: "13:30",
    title: "캐널시티 하카타 — 라멘 스타디움 (점심)",
    subtitle: "전국 유명 라멘이 한 곳에",
    nameZh: "キャナルシティ博多 ラーメンスタジアム",
    mrt: "지하철 쿠코선 祇園駅 K10 도보 7분 · 또는 하카타역 도보 10분",
    phrase: "とんこつラーメン一つ、お願いします。",
    phrasePron: "tonkotsu rāmen hitotsu, onegai shimasu",
    phraseHint: "돈코츠 라멘 하나 주세요",
    category: "food",
    lat: 33.5905,
    lng: 130.4109,
    highlights: [
      "라멘 스타디움 5층 — 전국 8개 점포 로테이션",
      "구경하다 줄 짧은 곳으로 (점심 피크 13:00 전후)",
      "분수 쇼는 매시 정각 (구경거리)"
    ],
    prompt: "고른 라멘 가게 + 한 입 후 표정 점수.",
    mapsQuery: "Canal City Hakata Ramen Stadium"
  },
  {
    id: "tenjin-stroll",
    day: 1,
    date: "5/22 금",
    time: "15:30",
    title: "텐진 산책 — 파르코·다이묘",
    subtitle: "큰 길 한 바퀴, 다이묘 골목까지",
    nameZh: "天神 · 大名エリア",
    mrt: "텐진역(天神駅) K08 / 텐진미나미역(天神南駅) N16",
    phrase: "免税はできますか？",
    phrasePron: "menzei wa dekimasu ka?",
    phraseHint: "면세 되나요?",
    category: "shopping",
    lat: 33.5912,
    lng: 130.3989,
    highlights: [
      "텐진 파르코·솔라리아 — 한국에 없는 브랜드 위주",
      "다이묘 골목 — 빈티지·편집숍·디저트",
      "쇼윈도만 보기로 정해두기 (저녁 야타이가 본 게임)"
    ],
    prompt: "다이묘에서 발견한 가게 한 곳 메모.",
    mapsQuery: "Tenjin Daimyo Fukuoka"
  },
  {
    id: "nakasu-yatai",
    day: 1,
    date: "5/22 금",
    time: "18:30",
    title: "나카스 야타이 — 강변 포장마차 (저녁)",
    subtitle: "후쿠오카 명물 — 라멘·교자·모츠나베 한 잔",
    nameZh: "中洲屋台",
    mrt: "나카스카와바타역(中洲川端駅) K09 도보 5분",
    phrase: "二人です、座れますか？",
    phrasePron: "futari desu, suwaremasu ka?",
    phraseHint: "두 명인데 자리 있어요?",
    category: "food",
    lat: 33.5946,
    lng: 130.405,
    highlights: [
      "18:00–19:00 오픈, 비 오면 휴업 — 일기예보 체크",
      "야키라멘·교자·오뎅·모츠나베가 인기 메뉴",
      "현금만 받는 야타이도 많음 — ¥10,000 정도는 챙기기",
      "1인 ¥3,000–5,000 예산"
    ],
    prompt: "야타이 사장님과 옆자리 사람들 인상 한 줄.",
    mapsQuery: "Nakasu Yatai Fukuoka"
  },
  {
    id: "bar-d1-night",
    day: 1,
    date: "5/22 금",
    time: "22:00",
    title: "위스키 바 — 텐진/나카스 한 잔",
    subtitle: "재팬 위스키로 첫 밤 마무리",
    nameZh: "BAR — Whisky Bar",
    mrt: "텐진역(天神駅) K08 또는 나카스카와바타역(中洲川端駅) K09",
    phrase: "ジャパニーズウイスキーのおすすめは？",
    phrasePron: "japanīzu uisukī no osusume wa?",
    phraseHint: "재팬 위스키 추천 좀 해주세요",
    category: "whisky",
    lat: 33.5912,
    lng: 130.4007,
    highlights: [
      "Bar Higuchi / Bar Oscar / Bar Leichhardt 후보 — 평일 워크인도 가능",
      "야마자키·하쿠슈·치치부 등 일본 위스키 라인업 확인",
      "차지(테이블 차지)가 별도 — 메뉴 확인",
      "마지막 잔은 사케 한 잔도 OK"
    ],
    prompt: "오늘의 원픽 위스키와 향, 다시 마시고 싶은지 한 줄.",
    mapsQuery: "Bar Higuchi Tenjin Fukuoka"
  },

  {
    id: "hotel-breakfast-d2",
    day: 2,
    date: "5/23 토",
    time: "08:30",
    title: "호텔 조식",
    subtitle: "느긋한 출발",
    nameZh: "ホテル朝食",
    mrt: "호텔 내",
    phrase: "朝食は何時までですか？",
    phrasePron: "chōshoku wa nanji made desu ka?",
    phraseHint: "조식은 몇 시까지예요?",
    category: "hotel",
    lat: 33.5912,
    lng: 130.3996,
    highlights: [
      "조식 시간 확인 (보통 10:00까지)",
      "체크아웃 아님 — 짐 두고 출발",
      "다자이후·야나가와 코스 길어서 든든히"
    ],
    prompt: "조식 메뉴 베스트 1, 오늘 컨디션.",
    mapsQuery: "Tenjin Hakata hotel breakfast"
  },
  {
    id: "dazaifu-tenmangu",
    day: 2,
    date: "5/23 토",
    time: "10:00",
    title: "다자이후 텐만구 — 학문의 신",
    subtitle: "20년 우정 + 한 가지씩 빈 소원",
    nameZh: "太宰府天満宮",
    mrt: "텐진역(西鉄福岡天神駅)에서 西鉄電車 다자이후행 약 30분 (¥420)",
    phrase: "おみくじはどこで引けますか？",
    phrasePron: "omikuji wa doko de hikemasu ka?",
    phraseHint: "오미쿠지(점) 어디서 뽑아요?",
    category: "sight",
    lat: 33.5217,
    lng: 130.5347,
    highlights: [
      "학문의 신 스가와라노 미치자네를 모신 신사",
      "참배길 — 우메가에모치·스타벅스 다자이후점(쿠마 켄고 건축)",
      "오미쿠지 / 에마(소원판)에 우정여행 기념 한 줄"
    ],
    prompt: "각자 빈 소원 한 줄 비밀로 기록 (메모리에 적기).",
    mapsQuery: "Dazaifu Tenmangu"
  },
  {
    id: "umegae-mochi",
    day: 2,
    date: "5/23 토",
    time: "11:30",
    title: "우메가에모치 — 참배길 명물",
    subtitle: "갓 구운 매화 떡",
    nameZh: "梅ヶ枝餅",
    mrt: "西鉄太宰府駅 참배길 곳곳 ・ 카사노야(かさの家) 본점이 유명",
    phrase: "焼きたてはありますか？",
    phrasePron: "yakitate wa arimasu ka?",
    phraseHint: "방금 구운 거 있어요?",
    category: "food",
    lat: 33.5189,
    lng: 130.5365,
    highlights: [
      "갓 구운 모치 — 식기 전에 먹기",
      "1개 ¥150 정도 — 가볍게 한 개씩",
      "선물용은 5–10개 묶음 박스"
    ],
    prompt: "갓 구운 vs 식은 거 한 입씩 비교 후 한 줄.",
    mapsQuery: "Kasanoya Dazaifu"
  },
  {
    id: "yanagawa-boat",
    day: 2,
    date: "5/23 토",
    time: "13:30",
    title: "야나가와 뱃놀이 (선택)",
    subtitle: "수향 도시 — 사공 노 젓는 70분 뱃놀이",
    nameZh: "柳川 川下り",
    mrt: "西鉄太宰府駅→二日市→西鉄柳川駅 약 50분 (¥710) ・ 야나가와역 도보 5분",
    phrase: "二人乗船お願いします。",
    phrasePron: "futari jōsen onegai shimasu",
    phraseHint: "두 명 승선할게요",
    category: "sight",
    lat: 33.1647,
    lng: 130.4055,
    highlights: [
      "수로를 따라 70분 뱃놀이 — 사공의 노래·해설",
      "16:00경 마지막 배 — 시간 빠듯하면 다자이후→후쿠오카 복귀로 변경",
      "장어덮밥(うなぎのせいろ蒸し)도 야나가와 명물"
    ],
    prompt: "뱃놀이 중 가장 좋았던 순간 한 줄.",
    mapsQuery: "Yanagawa Boat Tour"
  },
  {
    id: "afternoon-coffee",
    day: 2,
    date: "5/23 토",
    time: "16:30",
    title: "스페셜티 커피 한 잔",
    subtitle: "다이묘 또는 텐진 카페 거리",
    nameZh: "Specialty Coffee",
    mrt: "텐진역(天神駅) K08 또는 텐진미나미역(天神南駅) N16",
    phrase: "今日のおすすめは？",
    phrasePron: "kyō no osusume wa?",
    phraseHint: "오늘의 추천은요?",
    category: "coffee",
    lat: 33.589,
    lng: 130.3998,
    highlights: [
      "REC COFFEE / Manu Coffee / COFFEE COUNTY — 후쿠오카는 커피 강자",
      "다리·발 쉬고 + 디저트 한 입",
      "저녁 모츠나베까지 시간 조절"
    ],
    prompt: "오늘의 커피 산미·향·바리스타 한 줄.",
    mapsQuery: "REC COFFEE Tenjin Fukuoka"
  },
  {
    id: "motsunabe-dinner",
    day: 2,
    date: "5/23 토",
    time: "18:30",
    title: "모츠나베 — 후쿠오카 대표 저녁",
    subtitle: "곱창 전골, 우정여행에 안 빠지면 섭섭",
    nameZh: "もつ鍋",
    mrt: "텐진역(天神駅) K08 또는 하카타역(博多駅) K11 일대",
    phrase: "二人前、しょうゆ味でお願いします。",
    phrasePron: "ninin-mae, shōyu aji de onegai shimasu",
    phraseHint: "2인분, 간장 맛으로 주세요",
    category: "food",
    lat: 33.5912,
    lng: 130.4014,
    highlights: [
      "笑楽(쇼라쿠) / 楽天地 / おおいし — 텐진권 대표 가게들",
      "쇼유(간장) vs 미소(된장) 국물 — 둘이 다른 맛 시키면 비교 가능",
      "마지막에 챵폰면(ちゃんぽん麺)으로 마무리"
    ],
    prompt: "쇼유 vs 미소 — 누가 어느 쪽 손 들었는지 기록.",
    mapsQuery: "Motsunabe Shoraku Tenjin Fukuoka"
  },
  {
    id: "bar-hopping-d2",
    day: 2,
    date: "5/23 토",
    time: "21:30",
    title: "텐진 바 호핑 — 마지막 밤",
    subtitle: "스피크이지·재즈바 한 곳 더",
    nameZh: "BAR HOPPING",
    mrt: "텐진역(天神駅) K08",
    phrase: "おすすめのカクテルをお願いします。",
    phrasePron: "osusume no kakuteru o onegai shimasu",
    phraseHint: "추천 칵테일로 주세요",
    category: "whisky",
    lat: 33.5921,
    lng: 130.4023,
    highlights: [
      "Bar Leichhardt / Bar Oscar / Bar Hibiki / Speakeasy 후보",
      "차지·테이블차지 미리 확인",
      "재팬 위스키 / 클래식 칵테일 한 잔"
    ],
    prompt: "오늘 마지막 잔과 옆자리 분위기 한 줄.",
    mapsQuery: "Bar Leichhardt Fukuoka"
  },

  {
    id: "hotel-breakfast-d3",
    day: 3,
    date: "5/24 일",
    time: "08:30",
    title: "호텔 조식 + 체크아웃",
    subtitle: "짐 맡기고 출발",
    nameZh: "ホテル朝食 → チェックアウト",
    mrt: "호텔 내",
    phrase: "荷物を預けてもいいですか？",
    phrasePron: "nimotsu o azukete mo ii desu ka?",
    phraseHint: "짐 좀 맡길 수 있을까요?",
    category: "hotel",
    lat: 33.5912,
    lng: 130.3996,
    highlights: [
      "체크아웃 11:00 전후 — 짐만 프런트에 맡기기",
      "공항으로 출발 전 캐리어 픽업",
      "마지막 일정 동선 짧게"
    ],
    prompt: "조식 마지막, 컨디션 한 줄.",
    mapsQuery: "Tenjin hotel checkout"
  },
  {
    id: "momochi",
    day: 3,
    date: "5/24 일",
    time: "10:00",
    title: "후쿠오카 타워 + 모모치 해변",
    subtitle: "바다·타워·사진 산책",
    nameZh: "福岡タワー · 百道浜",
    mrt: "지하철 쿠코선 西新駅(K06)에서 도보 20분 또는 버스 10분",
    phrase: "展望台のチケットを二枚お願いします。",
    phrasePron: "tenbōdai no chiketto o nimai onegai shimasu",
    phraseHint: "전망대 티켓 두 장이요",
    category: "sight",
    lat: 33.5934,
    lng: 130.3517,
    highlights: [
      "후쿠오카 타워 전망대 (123m) — 입장료 ¥800",
      "모모치 해변 — 바다 배경 사진",
      "후쿠오카 PayPay 돔(소프트뱅크 호크스) 외관 구경"
    ],
    prompt: "타워에서 본 풍경 + 모모치 해변 사진 한 장.",
    mapsQuery: "Fukuoka Tower Momochi Seaside Park"
  },
  {
    id: "ramen-lunch",
    day: 3,
    date: "5/24 일",
    time: "12:30",
    title: "이치란 / 신신 라멘 — 마지막 라멘",
    subtitle: "후쿠오카 떠나기 전 한 그릇",
    nameZh: "一蘭 / Shin-Shin 拉麺",
    mrt: "텐진역(天神駅) K08 또는 하카타역(博多駅) K11",
    phrase: "替え玉一つお願いします。",
    phrasePron: "kaedama hitotsu onegai shimasu",
    phraseHint: "면 추가(카에다마) 하나 주세요",
    category: "food",
    lat: 33.5891,
    lng: 130.4006,
    highlights: [
      "이치란(一蘭) 본점 — 캐널시티/텐진/하카타역 지점",
      "Shin-Shin(신신) — 텐진 본점 (현지 인기)",
      "카에다마(면 추가) ¥200 정도 — 첫 그릇 다 먹기 전에 주문"
    ],
    prompt: "이번 여행 라멘 베스트 1 결정 — 둘이 합의.",
    mapsQuery: "Ichiran Hakata main shop"
  },
  {
    id: "canal-shopping",
    day: 3,
    date: "5/24 일",
    time: "14:00",
    title: "마지막 쇼핑 — 캐널시티 · 하카타역 한큐",
    subtitle: "기념품·먹거리 막판 픽업",
    nameZh: "キャナルシティ博多 · 博多阪急",
    mrt: "하카타역(博多駅) K11 직결",
    phrase: "免税で会計をお願いします。",
    phrasePron: "menzei de kaikei o onegai shimasu",
    phraseHint: "면세로 계산해 주세요",
    category: "shopping",
    lat: 33.5905,
    lng: 130.4109,
    highlights: [
      "멘타이코(辛子明太子) — 후쿠야(ふくや) 본점·역 매장",
      "히요코 만쥬·도리몬(博多通りもん) — 선물 명물",
      "하카타역 한큐 디파치카(B1) — 도시락·기념품 한 번에"
    ],
    prompt: "사 가는 기념품 리스트 한 줄 메모.",
    mapsQuery: "Hakata Hankyu B1F"
  },
  {
    id: "airport-departure",
    day: 3,
    date: "5/24 일",
    time: "15:30",
    title: "후쿠오카 공항 — 출국 수속",
    subtitle: "지하철 직결 — 공항까지 5분",
    nameZh: "福岡空港 国際線 出発",
    mrt: "지하철 공항선 福岡空港駅 K13 → 국제선 셔틀 5분",
    phrase: "国際線ターミナルへのシャトルはどこですか？",
    phrasePron: "kokusaisen tāminaru e no shatoru wa doko desu ka?",
    phraseHint: "국제선 셔틀버스 어디예요?",
    category: "transit",
    lat: 33.5897,
    lng: 130.4509,
    highlights: [
      "출발 2시간 전 도착 (국제선)",
      "지하철 福岡空港駅 → 국내선 도착 → 무료 셔틀(5분) → 국제선",
      "면세점 — 사케·야마자키·드러그스토어 마지막 체크"
    ],
    prompt: "여행 총평 한 줄 — 무엇이 베스트였나.",
    mapsQuery: "Fukuoka Airport International Departures"
  }
];

export const essentials = [
  "5/24 일 15:30까지 공항 도착 (출발 2시간 전 권장)",
  "야타이는 비 오면 휴업 — 일기예보 보고 5/22 저녁 백업 식당 미리 점찍기",
  "지하철 1일권(¥640) vs SUGOCA — 첫날·마지막 날 따져서 선택",
  "다자이후·야나가와는 西鉄電車 — 후쿠오카 시내 지하철과 환승 분리됨",
  "기념품: 멘타이코·도리몬·히요코·이치란 컵라멘"
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
    alternatives: ["니시테츠 버스로 텐진 직행", "공항 택시 (¥1,500–2,000)"],
    flexTip: "짐 분실·심사 줄로 30분 더 걸릴 수 있음. 비행기 늦으면 점심 계획부터 줄이기."
  },
  "tenjin-checkin": {
    priority: "must",
    durationMinutes: 30,
    alternatives: ["짐만 맡기고 캐널시티 직행", "체크인 늦으면 카페 대기"],
    flexTip: "이른 도착이면 짐만 맡기는 게 정석."
  },
  "canal-city": {
    priority: "must",
    durationMinutes: 75,
    alternatives: ["하카타역 1번 출구 라멘 거리", "이치란 본점 (캐널시티 근처)"],
    flexTip: "줄 짧은 라멘 가게로 즉석 변경 OK. 분수 쇼는 매시 정각."
  },
  "tenjin-stroll": {
    priority: "optional",
    durationMinutes: 90,
    alternatives: ["하카타역 한큐로 바로 가기", "텐진 지하상가만 빠르게"],
    flexTip: "비 오면 텐진 지하상가만 짧게."
  },
  "nakasu-yatai": {
    priority: "must",
    durationMinutes: 110,
    alternatives: ["하카타 모츠나베 가게 (실내)", "캐널시티 라멘 스타디움 저녁 영업"],
    flexTip: "비 예보면 백업 식당 즉시 가동. 야타이는 18:00 오픈이라 빨리 가야 자리 있음.",
    riskLevel: "medium",
    riskNote: "비/우천 시 휴업 — 일기예보 체크 필수"
  },
  "bar-d1-night": {
    priority: "optional",
    durationMinutes: 90,
    alternatives: ["호텔 근처 편의점 맥주", "Bar Oscar / Bar Leichhardt"],
    flexTip: "첫날 체력 떨어지면 패스 — 둘째 날 밤 바 호핑에 집중."
  },

  "hotel-breakfast-d2": {
    priority: "optional",
    durationMinutes: 50,
    alternatives: ["호텔 근처 카페 모닝", "편의점 간단식"],
    flexTip: "西鉄電車 다자이후행 시간만 맞추면 OK."
  },
  "dazaifu-tenmangu": {
    priority: "must",
    durationMinutes: 90,
    alternatives: ["주말이면 참배길 빨리 통과", "비 오면 본전 + 스타벅스만"],
    flexTip: "20년 우정 기념 에마(소원판) 한 장 — 둘이 같이 적고 사진."
  },
  "umegae-mochi": {
    priority: "must",
    durationMinutes: 25,
    alternatives: ["카사노야 외 다른 노포 비교", "선물용 박스만 픽업"],
    flexTip: "갓 구운 게 핵심 — 식은 거 사면 절반 손해."
  },
  "yanagawa-boat": {
    priority: "optional",
    durationMinutes: 180,
    alternatives: ["야나가와 생략 → 후쿠오카 시내 카페 거리", "오호리 공원 산책"],
    flexTip: "이동시간 큼 (왕복 ~2시간). 다자이후가 늦어지면 가장 먼저 줄일 일정.",
    riskLevel: "medium",
    riskNote: "마지막 배 16:00 전후 — 시간 빠듯하면 스킵"
  },
  "afternoon-coffee": {
    priority: "optional",
    durationMinutes: 60,
    alternatives: ["호텔 라운지에서 한 잔", "스타벅스 다자이후점 (현지에서 한 잔)"],
    flexTip: "다리·발 쉬는 용도 — 분위기 좋은 곳 발견하면 즉시 변경."
  },
  "motsunabe-dinner": {
    priority: "must",
    durationMinutes: 110,
    alternatives: ["다른 모츠나베 노포 (おおいし / 楽天地)", "하카타 모츠나베 + 라멘 한 그릇"],
    flexTip: "예약 권장. 주말이라 줄 길면 한 명 줄 서고 한 명은 산책.",
    riskLevel: "medium",
    riskNote: "주말 저녁 웨이팅 자주 발생 — 17:30 입장 시도"
  },
  "bar-hopping-d2": {
    priority: "optional",
    durationMinutes: 110,
    alternatives: ["호텔 근처 한 잔", "Bar Hibiki / Speakeasy"],
    flexTip: "둘째 날 메인 바 — 만족도 높으면 무리해서 옮기지 않아도 OK."
  },

  "hotel-breakfast-d3": {
    priority: "must",
    durationMinutes: 50,
    alternatives: ["체크아웃만 하고 모모치에서 카페 모닝"],
    flexTip: "체크아웃 시간 — 짐만 프런트 맡기는 게 핵심."
  },
  momochi: {
    priority: "optional",
    durationMinutes: 90,
    alternatives: ["오호리 공원·후쿠오카성", "캐널시티에서 시간 보내기"],
    flexTip: "비 오면 통째 스킵 — 캐널시티로 직행."
  },
  "ramen-lunch": {
    priority: "must",
    durationMinutes: 50,
    alternatives: ["하카타 잇푸도 본점", "Shin-Shin 텐진 본점"],
    flexTip: "공항 가기 전 마지막 식사 — 절대 거르지 말기."
  },
  "canal-shopping": {
    priority: "must",
    durationMinutes: 60,
    alternatives: ["공항 면세점에서 한 번 더", "텐진 지하상가"],
    flexTip: "공항 면세점도 후쿠야·도리몬 있음 — 시간 부족하면 공항에서."
  },
  "airport-departure": {
    priority: "must",
    durationMinutes: 120,
    alternatives: ["택시 (¥1,500–2,000)", "버스"],
    flexTip: "절대 스킵 불가. 다른 모든 마지막 일정은 공항 도착 기준으로 판단."
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
    description: "야타이는 휴업 가능 — 실내 모츠나베/라멘으로 대체. 다자이후·야나가와는 우산 챙기고 강행 OK."
  },
  {
    id: "tired",
    title: "피곤한 날",
    description: "선택/후보 일정을 숨기고 필수 일정 사이에 호텔 휴식 30분 확보."
  },
  {
    id: "hungry",
    title: "배고픈 날",
    description: "관광보다 미식 장소(라멘·모츠나베·야타이)를 먼저, 대기 긴 곳은 백업으로 전환."
  }
];
