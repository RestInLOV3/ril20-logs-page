import { useEffect, useRef, useState } from "react";
import ReviewForm from "./ReviewForm";
import { formatKoreanDate, toKstDate } from "../lib/date";
import type { Review } from "../lib/types";

type ReviewItem = Pick<Review, "id" | "pl_name" | "content" | "created_at">;

interface Props {
  readonly scenarioSlug: string;
  readonly accentColor: string;
  /** 오래된 순으로 정렬된 후기 */
  readonly initialReviews: ReviewItem[];
}

// 메시지 앱처럼 오래된 후기가 위, 최신이 아래. 날짜(KST)가 바뀌면 구분선,
// 같은 이름이 같은 날 연달아 쓰면 한 묶음: 이름은 첫 말풍선에만, 꼬리는 마지막 말풍선에만
// (익명은 서로 다른 사람일 수 있으므로 묶지 않음)
function buildFeed(reviews: ReviewItem[]) {
  const dates = reviews.map((r) => toKstDate(r.created_at));
  const sameSender = (i: number, j: number) =>
    j >= 0 &&
    j < reviews.length &&
    reviews[i].pl_name !== null &&
    reviews[i].pl_name === reviews[j].pl_name &&
    dates[i] === dates[j];

  return reviews.map((r, i) => ({
    id: r.id,
    name: r.pl_name ?? "익명",
    content: r.content,
    date: dates[i],
    showDate: i === 0 || dates[i - 1] !== dates[i],
    groupStart: !sameSender(i, i - 1),
    groupEnd: !sameSender(i, i + 1),
  }));
}

export default function ReviewChat({
  scenarioSlug,
  accentColor,
  initialReviews,
}: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const feedRef = useRef<HTMLUListElement>(null);
  const isFirstScroll = useRef(true);
  const initialIds = useRef(new Set(initialReviews.map((r) => r.id)));

  // 처음엔 즉시, 새 후기가 추가되면 부드럽게 맨 아래로
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    feed.scrollTo({
      top: feed.scrollHeight,
      behavior: isFirstScroll.current ? "auto" : "smooth",
    });
    isFirstScroll.current = false;
  }, [reviews.length]);

  const feed = buildFeed(reviews);

  return (
    <div className="review-chat">
      {feed.length > 0 ? (
        <ul className="review-feed" ref={feedRef}>
          {feed.map((m) => [
            m.showDate && (
              <li key={`d-${m.date}`} className="review-date">
                <time dateTime={m.date}>{formatKoreanDate(m.date)}</time>
              </li>
            ),
            <li
              key={m.id}
              className={`review-item${m.groupStart ? " group-start" : ""}${
                initialIds.current.has(m.id) ? "" : " is-new"
              }`}
            >
              {m.groupStart && <span className="review-name">{m.name}</span>}
              <p className={`review-bubble${m.groupEnd ? " tail" : ""}`}>
                {m.content}
              </p>
            </li>,
          ])}
        </ul>
      ) : (
        <p className="review-empty">아직 후기가 없습니다.</p>
      )}

      <ReviewForm
        scenarioSlug={scenarioSlug}
        accentColor={accentColor}
        onSubmitted={(review) => setReviews((prev) => [...prev, review])}
      />

      <style>{`
        .review-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          min-height: 0;
        }
        .review-empty {
          flex: 1;
          display: grid;
          place-items: center;
          color: var(--muted, #8a8a86);
          font-size: 0.85rem;
        }

        /* iMessage 수신 말풍선 스타일 */
        .review-feed {
          --bubble: #e9e9eb;
          flex: 1;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0 0.25rem 0 10px;
          overflow-y: auto;
          min-height: 0;
        }
        .review-date {
          margin: 0.9rem 0 0.4rem;
          text-align: center;
          font-size: 0.68rem;
          font-weight: 500;
          color: var(--muted, #8a8a86);
        }
        .review-date:first-child { margin-top: 0; }
        .review-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .review-item.is-new { animation: review-in 0.3s ease; }
        .review-item.group-start { margin-top: 0.5rem; }
        .review-date + .review-item.group-start { margin-top: 0; }
        .review-name {
          margin: 0 0 2px 12px;
          font-size: 0.68rem;
          color: var(--muted, #8a8a86);
        }
        .review-bubble {
          position: relative;
          max-width: 85%;
          padding: 7px 12px;
          border-radius: 18px;
          background: var(--bubble);
          color: #000;
          font-size: 0.86rem;
          line-height: 1.4;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }
        /* 말풍선 꼬리: 말풍선 색 곡선(::before)을 패널 배경색 곡선(::after)으로 깎아냄 */
        .review-bubble.tail::before,
        .review-bubble.tail::after {
          content: "";
          position: absolute;
          bottom: 0;
          height: 20px;
        }
        .review-bubble.tail::before {
          left: -7px;
          width: 20px;
          background: var(--bubble);
          border-bottom-right-radius: 16px 14px;
        }
        .review-bubble.tail::after {
          left: -10px;
          width: 10px;
          background: var(--panel-bg, var(--surface, #fff));
          border-bottom-right-radius: 10px;
        }
        @keyframes review-in {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
        }
        @media (prefers-reduced-motion: reduce) {
          .review-item.is-new { animation: none; }
        }
      `}</style>
    </div>
  );
}
