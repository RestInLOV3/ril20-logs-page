// D1의 created_at은 SQLite datetime('now') 값(UTC, "YYYY-MM-DD HH:MM:SS")이다.
// 화면에는 한국 시간(UTC+9) 기준 날짜를 쓴다. 서버·클라이언트 결과가 같도록 Intl 대신 고정 오프셋으로 계산.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** UTC created_at → 한국 기준 "YYYY-MM-DD" */
export function toKstDate(createdAt: string): string {
  const utc = Date.parse(createdAt.replace(" ", "T") + "Z");
  if (Number.isNaN(utc)) return createdAt.slice(0, 10);
  return new Date(utc + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" → "YYYY년 M월 D일" */
export function formatKoreanDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}
