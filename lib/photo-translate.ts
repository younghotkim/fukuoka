// Shared types for the photo translation feature. Kept in lib/ so both the
// API route and the client panel can import without dragging server code into
// the client bundle.

export type PhotoBlock = {
  ja: string;     // Japanese text as written
  ko: string;     // natural Korean translation
  note?: string;  // optional 1-line context: spicy / share-friendly / 추천 등
};

export type PhotoScene = "menu" | "sign" | "message" | "receipt" | "other";

export type PhotoTranslateResponse = {
  scene: PhotoScene;
  blocks: PhotoBlock[];
};
