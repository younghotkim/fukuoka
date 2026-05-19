"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Clock,
  ExternalLink,
  Hotel,
  Luggage,
  Plane,
  QrCode,
  ScrollText,
  X
} from "lucide-react";
import type { PackItem } from "@/lib/packing";
import type { VaultItem } from "@/lib/trip-vault";
import { daysUntilExpiry, type Traveler, type TravelerBook } from "@/lib/travelers";

const dismissKey = "yj-fukuoka-departure-dismissed-v1";
const vjwKey = "yj-fukuoka-vjw-done-v1";
const VJW_URL = "https://vjw-lp.digital.go.jp/ja/";

type VjwState = { youngha: boolean; joonho: boolean };

type Mode = "plan" | "today" | "vault" | "memories" | "ledger" | "recap";

type ReadinessRow = {
  key: string;
  icon: React.ReactNode;
  label: string;
  status: "ok" | "warn" | "todo";
  detail: string;
  cta?: { mode: Mode; label: string } | { href: string; label: string; icon?: React.ReactNode };
  toggles?: Array<{ key: keyof VjwState; label: string; done: boolean }>;
};

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

function passportComplete(t: Traveler): boolean {
  return Boolean(t.passportName && t.passportNo && t.expiryDate);
}

export function DepartureWidget({
  todayIso,
  startIso,
  packingItems,
  vaultItems,
  travelers,
  onJump
}: {
  todayIso: string;
  startIso: string;
  packingItems: PackItem[];
  vaultItems: VaultItem[];
  travelers: TravelerBook;
  onJump: (mode: Mode) => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [vjw, setVjw] = useState<VjwState>({ youngha: false, joonho: false });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(dismissKey);
    if (stored === startIso) setDismissed(true);
    const vjwStored = window.localStorage.getItem(vjwKey);
    if (vjwStored) {
      try {
        const parsed = JSON.parse(vjwStored) as Partial<VjwState>;
        setVjw({ youngha: Boolean(parsed.youngha), joonho: Boolean(parsed.joonho) });
      } catch {
        // ignore
      }
    }
  }, [startIso]);

  const toggleVjw = (who: keyof VjwState) => {
    setVjw((current) => {
      const next = { ...current, [who]: !current[who] };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(vjwKey, JSON.stringify(next));
      }
      return next;
    });
  };

  const dDays = daysBetween(todayIso, startIso);

  const rows = useMemo<ReadinessRow[]>(() => {
    const packed = packingItems.filter((i) => i.packed).length;
    const total = packingItems.length;
    const packingPct = total > 0 ? Math.round((packed / total) * 100) : 0;
    const packingStatus: ReadinessRow["status"] =
      total === 0 ? "todo" : packingPct >= 90 ? "ok" : packingPct >= 50 ? "warn" : "todo";

    const flights = vaultItems.filter((i) => i.kind === "flight");
    const flightConfirmed = flights.filter((i) => i.status === "confirmed");
    const flightStatus: ReadinessRow["status"] =
      flightConfirmed.length === 0 ? "todo" : flights.length === flightConfirmed.length ? "ok" : "warn";
    const flightDetail =
      flights.length === 0
        ? "항공편 미등록"
        : `${flightConfirmed.length}/${flights.length} 확정${
            flights.length > flightConfirmed.length ? " · 확인 필요" : ""
          }`;

    const hotels = vaultItems.filter((i) => i.kind === "hotel");
    const hotelConfirmed = hotels.filter((i) => i.status === "confirmed");
    const hotelStatus: ReadinessRow["status"] =
      hotelConfirmed.length === 0 ? "todo" : hotels.length === hotelConfirmed.length ? "ok" : "warn";
    const hotelDetail =
      hotels.length === 0
        ? "숙소 미등록"
        : `${hotelConfirmed.length}/${hotels.length} 확정${
            hotels.length > hotelConfirmed.length ? " · 확인 필요" : ""
          }`;

    const t1 = travelers.youngha;
    const t2 = travelers.joonho;
    const passportDone = [t1, t2].filter(passportComplete).length;
    // Expiry-aware: passports expiring within 6 months → warn
    const soonExpiring = [t1, t2]
      .filter(passportComplete)
      .map((t) => daysUntilExpiry(t.expiryDate))
      .some((d) => d !== null && d <= 180);
    const passportStatus: ReadinessRow["status"] =
      passportDone === 2 ? (soonExpiring ? "warn" : "ok") : passportDone === 1 ? "warn" : "todo";
    const passportDetail =
      passportDone === 2
        ? soonExpiring
          ? "둘 다 입력 · 만료 임박"
          : "둘 다 입력 완료"
        : passportDone === 1
          ? "한 명만 입력됨"
          : "여권 정보 미입력";

    const arrivalDone = [t1, t2].filter((t) => Boolean(t.arrivalCardUrl)).length;
    const arrivalStatus: ReadinessRow["status"] =
      arrivalDone === 2 ? "ok" : arrivalDone === 1 ? "warn" : "todo";
    const arrivalDetail =
      arrivalDone === 2
        ? "둘 다 첨부 완료"
        : arrivalDone === 1
          ? "한 명만 첨부됨"
          : "입국 카드 미첨부";

    const vjwDone = (vjw.youngha ? 1 : 0) + (vjw.joonho ? 1 : 0);
    const vjwStatus: ReadinessRow["status"] =
      vjwDone === 2 ? "ok" : vjwDone === 1 ? "warn" : "todo";
    const vjwDetail =
      vjwDone === 2
        ? "둘 다 등록 완료"
        : vjwDone === 1
          ? "한 명만 등록됨"
          : "도착 전 사전등록 필요";

    return [
      {
        key: "flight",
        icon: <Plane size={14} />,
        label: "항공편",
        status: flightStatus,
        detail: flightDetail,
        cta: flightStatus === "ok" ? undefined : { mode: "vault", label: "준비" }
      },
      {
        key: "hotel",
        icon: <Hotel size={14} />,
        label: "숙소",
        status: hotelStatus,
        detail: hotelDetail,
        cta: hotelStatus === "ok" ? undefined : { mode: "vault", label: "준비" }
      },
      {
        key: "passport",
        icon: <BookOpen size={14} />,
        label: "여권",
        status: passportStatus,
        detail: passportDetail,
        cta: passportStatus === "ok" ? undefined : { mode: "vault", label: "입력" }
      },
      {
        key: "vjw",
        icon: <QrCode size={14} />,
        label: "Visit Japan Web",
        status: vjwStatus,
        detail: vjwDetail,
        cta: { href: VJW_URL, label: "등록", icon: <ExternalLink size={11} /> },
        toggles: [
          { key: "youngha", label: "영하", done: vjw.youngha },
          { key: "joonho", label: "준호", done: vjw.joonho }
        ]
      },
      {
        key: "arrival",
        icon: <ScrollText size={14} />,
        label: "출입국심사서",
        status: arrivalStatus,
        detail: arrivalDetail,
        cta: arrivalStatus === "ok" ? undefined : { mode: "vault", label: "첨부" }
      },
      {
        key: "packing",
        icon: <Luggage size={14} />,
        label: "준비물",
        status: packingStatus,
        detail: total === 0 ? "목록 비어있음" : `${packed}/${total} 챙김 (${packingPct}%)`,
        cta: packingStatus === "ok" ? undefined : { mode: "vault", label: "체크" }
      }
    ];
  }, [packingItems, vaultItems, travelers, vjw]);

  // Only render when we're pre-trip (or on departure day itself).
  if (dDays < 0) return null;
  if (dismissed) return null;

  const okCount = rows.filter((r) => r.status === "ok").length;
  const totalCount = rows.length;
  const overallPct = Math.round((okCount / totalCount) * 100);

  const dismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(dismissKey, startIso);
    }
  };

  const tone: "imminent" | "soon" | "later" =
    dDays === 0 ? "imminent" : dDays <= 3 ? "soon" : "later";

  return (
    <section className={`departure departure--${tone}`} aria-label="출발 카운트다운">
      <button
        type="button"
        className="departure__dismiss"
        onClick={dismiss}
        aria-label="이 안내 숨기기"
        title="이번 여행 동안 숨기기"
      >
        <X size={14} />
      </button>
      <div className="departure__head">
        <div className="departure__count">
          <span className="departure__count-label">출발까지</span>
          <strong className="departure__count-value">
            {dDays === 0 ? "D-Day" : `D-${dDays}`}
          </strong>
          <span className="departure__count-date">
            <Clock size={11} /> {startIso}
          </span>
        </div>
        <div className="departure__overall" aria-hidden="true">
          <div className="departure__ring" style={{ ["--pct" as string]: `${overallPct}%` }}>
            <strong>{overallPct}%</strong>
            <small>준비됨</small>
          </div>
        </div>
      </div>

      <ul className="departure__rows" role="list">
        {rows.map((row) => {
          const isLinkCta = row.cta && "href" in row.cta;
          return (
            <li key={row.key} className={`departure__row departure__row--${row.status}`}>
              <span className="departure__row-icon" aria-hidden="true">
                {row.status === "ok" ? <Check size={14} /> : row.icon}
              </span>
              <span className="departure__row-main">
                <strong>{row.label}</strong>
                <small>{row.detail}</small>
                {row.toggles && (
                  <span className="departure__row-toggles">
                    {row.toggles.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        className={
                          t.done
                            ? "departure__toggle departure__toggle--done"
                            : "departure__toggle"
                        }
                        onClick={() => toggleVjw(t.key)}
                        aria-pressed={t.done}
                      >
                        {t.done && <Check size={10} />}
                        {t.label}
                      </button>
                    ))}
                  </span>
                )}
              </span>
              {row.cta && isLinkCta ? (
                <a
                  className="departure__row-cta departure__row-cta--ext"
                  href={(row.cta as { href: string }).href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {row.cta.label}
                  {(row.cta as { icon?: React.ReactNode }).icon}
                </a>
              ) : row.cta ? (
                <button
                  type="button"
                  className="departure__row-cta"
                  onClick={() => onJump((row.cta as { mode: Mode }).mode)}
                >
                  {row.cta.label} →
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
