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
        <div className="char-avatar">
          {character.image_url ? (
            <img src={character.image_url} alt={character.name} />
          ) : (
            <div className="char-avatar-placeholder" />
          )}
        </div>
        <div className="char-info">
          <p className="char-name">{character.name}</p>
          <p className="char-pl">{character.pl_name}</p>
        </div>
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
        .char-card {
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e2e2de);
          border-radius: 6px;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          width: 180px;
          color: var(--text, #1c1c1a);
          font-family: inherit;
          transition: box-shadow 0.15s, border-color 0.15s;
        }
        .char-card:hover { border-color: var(--c); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .char-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid var(--c);
          flex-shrink: 0;
        }
        .char-avatar img, .char-avatar-placeholder {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: var(--border, #e2e2de);
        }
        .char-name { font-size: 0.88rem; font-weight: 600; margin-bottom: 0.1rem; }
        .char-pl { font-size: 0.73rem; color: var(--muted, #8a8a86); }

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
