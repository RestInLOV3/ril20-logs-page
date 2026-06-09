import { useState } from "react";

interface Props {
  readonly scenarioSlug: string;
  readonly accentColor: string;
}

export default function ReviewForm({ scenarioSlug, accentColor }: Props) {
  const [plName, setPlName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch(`/logs/api/scenarios/${scenarioSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pl_name: isAnonymous ? null : plName.trim() || null,
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        const data: { message: string } = await res.json();
        throw new Error(data.message ?? "오류가 발생했습니다.");
      }

      setStatus("done");
      setContent("");
      setPlName("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setStatus("error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ "--c": accentColor } as React.CSSProperties}
    >
      {/* <h3 className="form-title">후기 작성</h3> */}

      <div className="form-row">
        <label className="form-label">
          {"PL 이름"}
          <input
            type="text"
            value={plName}
            onChange={(e) => setPlName(e.target.value)}
            disabled={isAnonymous || status === "loading"}
            placeholder={isAnonymous ? "익명" : "닉네임"}
            maxLength={30}
            className="form-input"
          />
        </label>
        <label className="anon-label">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            disabled={status === "loading"}
          />
          {" 익명으로 작성"}
        </label>
      </div>

      <div className="form-row">
        <label className="form-label full">
          {"내용"}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={status === "loading"}
            placeholder="후기를 작성해주세요 (최대 1000자)"
            maxLength={1000}
            rows={4}
            className="form-textarea"
            required
          />
        </label>
        <div className="char-count">{content.length} / 1000</div>
      </div>

      {status === "error" && <p className="form-error">{errorMsg}</p>}
      {status === "done" && (
        <p className="form-success">후기가 등록되었습니다. 감사합니다!</p>
      )}

      <button
        type="submit"
        disabled={status === "loading" || !content.trim()}
        className="form-submit"
      >
        {status === "loading" ? "등록 중…" : "후기 등록"}
      </button>

      <style>{`
        form[style] {
          padding: 1.5rem;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e2e2de);
          border-radius: 6px;
          font-family: inherit;
        }
        .form-title {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted, #8a8a86);
          margin-bottom: 1.25rem;
        }
        .form-row {
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .form-label {
          font-size: 0.8rem;
          color: var(--muted, #8a8a86);
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .form-label.full { width: 100%; }
        .form-input, .form-textarea {
          background: var(--bg, #f6f6f4);
          border: 1px solid var(--border, #e2e2de);
          border-radius: 4px;
          color: var(--text, #1c1c1a);
          font-size: 0.88rem;
          font-family: inherit;
          padding: 0.5rem 0.75rem;
          transition: border-color 0.15s;
          outline: none;
        }
        .form-input:focus, .form-textarea:focus { border-color: var(--c); }
        .form-input:disabled, .form-textarea:disabled { opacity: 0.5; }
        .form-textarea { resize: vertical; min-height: 100px; }
        .anon-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: var(--muted, #8a8a86);
          cursor: pointer;
        }
        .char-count { font-size: 0.73rem; color: var(--muted, #8a8a86); text-align: right; }
        .form-error { font-size: 0.83rem; color: #c0392b; margin-bottom: 0.75rem; }
        .form-success { font-size: 0.83rem; color: #27ae60; margin-bottom: 0.75rem; }
        .form-submit {
          background: var(--c);
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 0.55rem 1.4rem;
          font-size: 0.88rem;
          font-family: inherit;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .form-submit:hover:not(:disabled) { opacity: 0.85; }
        .form-submit:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </form>
  );
}
