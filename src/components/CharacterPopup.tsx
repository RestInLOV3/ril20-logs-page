import { useState, useEffect, useRef } from "react";

interface Quote {
  id: number;
  quote: string;
}

interface Character {
  id: number;
  name: string;
  pl_name: string;
  image_url: string | null;
  bio: string | null;
  quotes: (Quote | string)[];
}

interface Props {
  character: Character;
  accentColor: string;
}

export default function CharacterPopup({ character, accentColor }: Props) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const quotes = character.quotes.map((q) =>
    typeof q === "string" ? q : q.quote,
  );

  const randomQuote =
    quotes.length > 0
      ? quotes[Math.floor(Math.random() * quotes.length)]
      : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) dialog.showModal();
    else dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => setOpen(false);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  return (
    <>
      <button
        className="char-card"
        style={{ "--c": accentColor } as React.CSSProperties}
        onClick={() => setOpen(true)}
        aria-label={`${character.name} 상세 정보`}
      >
        <span className="char-diamond">
          {character.image_url ? (
            <img src={character.image_url} alt="" />
          ) : (
            <span className="char-avatar-placeholder" />
          )}
          <span className="char-info">
            <span className="char-name">{character.name}</span>
            <span className="char-pl">{character.pl_name}</span>
          </span>
        </span>
      </button>

      <dialog
        ref={dialogRef}
        className="char-dialog"
        style={{ "--c": accentColor } as React.CSSProperties}
      >
        <div className="dialog-inner">
          <button
            className="dialog-close"
            onClick={() => setOpen(false)}
            aria-label="닫기"
          >
            ✕
          </button>

          <div className="dialog-avatar">
            {character.image_url ? (
              <img src={character.image_url} alt={character.name} />
            ) : (
              <div className="dialog-avatar-placeholder" />
            )}
          </div>

          <h2 className="dialog-name">{character.name}</h2>
          <p className="dialog-pl">PL · {character.pl_name}</p>

          {character.bio && <p className="dialog-bio">{character.bio}</p>}

          {randomQuote && (
            <blockquote className="dialog-quote">
              &ldquo;{randomQuote}&rdquo;
            </blockquote>
          )}
        </div>
      </dialog>

      <style>{`
        /* 마름모 카드: 바깥(버튼)이 강조색 테두리, 안쪽이 이미지. clip-path로 클릭 영역도 마름모로 제한 */
        .char-card {
          --diamond: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          padding: 0;
          border: none;
          background: var(--c);
          clip-path: var(--diamond);
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.3s ease;
        }
        .char-diamond {
          position: absolute;
          inset: 4px;
          clip-path: var(--diamond);
          background: var(--surface, #fff);
          overflow: hidden;
        }
        .char-diamond img, .char-avatar-placeholder {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: var(--border, #e2e2de);
          transition: transform 0.4s ease, filter 0.3s ease;
        }
        .char-info {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 22%;
          text-align: center;
          color: #fff;
          background: rgba(0, 0, 0, 0.5);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .char-name, .char-pl {
          display: block;
          transform: translateY(8px);
          transition: transform 0.35s ease;
        }
        .char-name { font-size: 0.88rem; font-weight: 600; line-height: 1.3; word-break: keep-all; }
        .char-pl { font-size: 0.72rem; opacity: 0.8; margin-top: 0.2rem; transition-delay: 0.05s; }

        .char-card:focus-visible { outline: none; }
        /* 이름 노출은 마우스가 있는 데스크톱에서만. 모바일은 탭 → 팝업으로 확인 */
        @media (hover: hover) and (min-width: 601px) {
          .char-card:hover, .char-card:focus-visible { transform: scale(1.06); }
          .char-card:hover .char-diamond img,
          .char-card:focus-visible .char-diamond img { transform: scale(1.08); filter: blur(1px); }
          .char-card:hover .char-info,
          .char-card:focus-visible .char-info { opacity: 1; }
          .char-card:hover :is(.char-name, .char-pl),
          .char-card:focus-visible :is(.char-name, .char-pl) { transform: none; }
        }
        @media (max-width: 600px) {
          .char-info { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .char-card, .char-card *, .char-card img { transition: none !important; }
        }

        .char-dialog {
          background: var(--surface, #fff);
          color: var(--text, #1c1c1a);
          border: 1px solid var(--border, #e2e2de);
          border-radius: 10px;
          padding: 0;
          max-width: 400px;
          width: 90vw;
          max-height: 90vh;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        }
        .char-dialog::backdrop {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(2px);
        }
        .dialog-inner {
          padding: 2rem;
          position: relative;
          text-align: center;
        }
        .dialog-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: var(--muted, #8a8a86);
          font-size: 1rem;
          cursor: pointer;
          font-family: inherit;
        }
        .dialog-close:hover { color: var(--text, #1c1c1a); }
        .dialog-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid var(--c);
          margin: 0 auto 1rem;
        }
        .dialog-avatar img, .dialog-avatar-placeholder {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: var(--border, #e2e2de);
        }
        .dialog-name {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text, #1c1c1a);
          margin-bottom: 0.2rem;
        }
        .dialog-pl {
          font-size: 0.78rem;
          color: var(--muted, #8a8a86);
          margin-bottom: 1rem;
        }
        .dialog-bio {
          font-size: 0.88rem;
          line-height: 1.7;
          color: var(--text, #1c1c1a);
          margin-bottom: 1.25rem;
          text-align: left;
        }
        .dialog-quote {
          border-left: 3px solid var(--c);
          padding: 0.6rem 1rem;
          font-style: italic;
          font-size: 0.88rem;
          color: var(--muted, #8a8a86);
          text-align: left;
          margin: 0;
          background: color-mix(in srgb, var(--c) 6%, var(--surface, #fff));
          border-radius: 0 4px 4px 0;
        }
      `}</style>
    </>
  );
}
