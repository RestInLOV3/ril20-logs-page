import { useState, useEffect } from 'react';

// ── 타입 ──────────────────────────────────────────────

interface Scenario {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  color: string;
  cover_r2: string | null;
  cover_url: string | null;
  log_count: number;
  rule: string | null;
  scenario_type: string | null;
}

const RULE_OPTIONS = [
  { value: '', label: '미지정' },
  { value: 'coc', label: 'CoC' },
  { value: 'dnd', label: 'D&D' },
  { value: 'gundok', label: '건독' },
];

const TYPE_OPTIONS = [
  { value: '', label: '미지정' },
  { value: 'campaign', label: '캠페인' },
  { value: 'short', label: '단편' },
];

interface Character {
  id: number;
  name: string;
  pl_name: string;
  image_r2: string | null;
  image_url: string | null;
  bio: string | null;
  sort_order: number;
  quotes: { id: number; quote: string }[];
}

interface Log {
  id: number;
  title: string;
  order_num: number;
}

interface Review {
  id: number;
  pl_name: string | null;
  content: string;
  created_at: string;
}

// ── 유틸 ──────────────────────────────────────────────

function apiHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function extractError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string };
    return data.message ?? '오류가 발생했습니다.';
  } catch {
    return '오류가 발생했습니다.';
  }
}

// ── 인증 화면 ─────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/logs/api/admin/ping', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { setError('토큰이 유효하지 않습니다.'); return; }
      onLogin(token);
    } catch {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <h1 className="login-title">관리자 로그인</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ADMIN_TOKEN"
          className="login-input"
          required
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '확인 중…' : '접속'}
        </button>
      </form>
    </div>
  );
}

// ── 시나리오 폼 ───────────────────────────────────────

function ScenarioForm({
  token, initial, onSaved, onCancel,
}: {
  token: string;
  initial?: Partial<Scenario>;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [coverR2, setCoverR2] = useState<string | null>(initial?.cover_r2 ?? null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initial?.cover_url ?? null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [color, setColor] = useState(initial?.color ?? '#808080');
  const [rule, setRule] = useState(initial?.rule ?? '');
  const [scenarioType, setScenarioType] = useState(initial?.scenario_type ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!initial?.id;

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    if (file) setCoverPreview(URL.createObjectURL(file));
  };

  const clearCover = () => {
    setCoverFile(null);
    setCoverR2(null);
    setCoverPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let finalCoverR2 = coverR2;

      if (coverFile) {
        const ext = coverFile.name.split('.').pop();
        const key = `scenarios/${slug}/cover.${ext}`;
        const form = new FormData();
        form.append('key', key);
        form.append('file', coverFile);
        const upRes = await fetch('/logs/api/admin/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!upRes.ok) throw new Error('커버 이미지 업로드에 실패했습니다.');
        finalCoverR2 = key;
      }

      const body = {
        slug, title, description: description || null,
        cover_r2: finalCoverR2,
        color, rule: rule || null, scenario_type: scenarioType || null,
      };
      const res = isEdit
        ? await fetch(`/logs/api/admin/scenarios/${initial!.id}`, {
            method: 'PUT',
            headers: apiHeaders(token),
            body: JSON.stringify(body),
          })
        : await fetch('/logs/api/admin/scenarios', {
            method: 'POST',
            headers: apiHeaders(token),
            body: JSON.stringify(body),
          });
      if (!res.ok) throw new Error(await extractError(res));
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="panel">
      <h3 className="panel-title">{isEdit ? '시나리오 수정' : '시나리오 추가'}</h3>
      <div className="form-grid">
        <label className="form-label">
          슬러그 (URL용, 영소문자·숫자·하이픈)
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="form-input"
            pattern="^[-a-z0-9]+" required disabled={isEdit} />
        </label>
        <label className="form-label">
          제목
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" required />
        </label>
        <label className="form-label">
          설명 (선택)
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            className="form-textarea" rows={2} />
        </label>
        <div className="form-label">
          커버 이미지 (선택)
          {coverPreview && (
            <div className="cover-preview-wrap">
              <img src={coverPreview} alt="커버 미리보기" className="cover-preview" />
              <button type="button" onClick={clearCover} className="cover-remove-btn">이미지 제거</button>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleCoverChange} className="form-input" />
        </div>
        <label className="form-label color-row">
          고유 색상
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            className="color-input" />
          <span className="color-hex">{color}</span>
        </label>
        <label className="form-label">
          룰 시스템
          <select value={rule} onChange={(e) => setRule(e.target.value)} className="form-input">
            {RULE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="form-label">
          유형
          <select value={scenarioType} onChange={(e) => setScenarioType(e.target.value)} className="form-input">
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="btn-row">
        <button type="button" onClick={onCancel} className="btn-secondary">취소</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '저장 중…' : '저장'}
        </button>
      </div>
    </form>
  );
}

// ── 로그 폼 (신규 업로드 + 수정 통합) ────────────────

function LogForm({ token, scenarioId, initial, onSaved, onCancel }: {
  token: string; scenarioId: number; initial?: Log;
  onSaved: () => void; onCancel?: () => void;
}) {
  const isEdit = !!initial?.id;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [orderNum, setOrderNum] = useState(String(initial?.order_num ?? ''));
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !file) return;
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('title', title);
      form.append('order_num', orderNum);
      if (file) form.append('file', file);

      const url = isEdit
        ? `/logs/api/admin/logs/${initial!.id}`
        : `/logs/api/admin/scenarios/${scenarioId}/logs`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error(await extractError(res));
      if (!isEdit) { setTitle(''); setOrderNum(''); setFile(null); }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="sub-form">
      <div className="form-grid">
        <label className="form-label">
          로그 제목
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" required />
        </label>
        <label className="form-label">
          순서 번호
          <input type="number" value={orderNum} onChange={(e) => setOrderNum(e.target.value)}
            className="form-input" min={1} required />
        </label>
        <label className="form-label">
          HTML 파일{isEdit && ' (변경 시에만 선택)'}
          <input type="file" accept=".html,.htm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="form-input" required={!isEdit} />
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="btn-row">
        {onCancel && <button type="button" onClick={onCancel} className="btn-secondary">취소</button>}
        <button type="submit" className="btn-primary" disabled={loading || (!isEdit && !file)}>
          {loading ? (isEdit ? '저장 중…' : '업로드 중…') : (isEdit ? '저장' : '로그 업로드')}
        </button>
      </div>
    </form>
  );
}

// ── 캐릭터 폼 (신규 추가 + 수정 통합) ───────────────

function CharacterForm({ token, scenarioId, scenarioSlug, initial, onSaved, onCancel }: {
  token: string; scenarioId: number; scenarioSlug: string;
  initial?: Character; onSaved: () => void; onCancel: () => void;
}) {
  const isEdit = !!initial?.id;
  const [name, setName] = useState(initial?.name ?? '');
  const [plName, setPlName] = useState(initial?.pl_name ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? '0'));
  const [quotes, setQuotes] = useState<string[]>(
    initial?.quotes?.length ? initial.quotes.map((q) => q.quote) : [''],
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageR2, setImageR2] = useState<string | null>(initial?.image_r2 ?? null);
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image_url ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setImageFile(f);
    if (f) setImagePreview(URL.createObjectURL(f));
  };

  const clearImage = () => { setImageFile(null); setImageR2(null); setImagePreview(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let finalImageR2 = imageR2;

      if (imageFile) {
        const key = `scenarios/${scenarioSlug}/characters/${Date.now()}.${imageFile.name.split('.').pop()}`;
        const form = new FormData();
        form.append('key', key);
        form.append('file', imageFile);
        const upRes = await fetch('/logs/api/admin/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!upRes.ok) throw new Error('이미지 업로드에 실패했습니다.');
        finalImageR2 = key;
      }

      const payload = {
        name, pl_name: plName, bio: bio || null,
        sort_order: parseInt(sortOrder),
        image_r2: finalImageR2,
        quotes: quotes.filter((q) => q.trim()),
      };

      const res = isEdit
        ? await fetch(`/logs/api/admin/characters/${initial!.id}`, {
            method: 'PUT', headers: apiHeaders(token), body: JSON.stringify(payload),
          })
        : await fetch(`/logs/api/admin/scenarios/${scenarioId}/characters`, {
            method: 'POST', headers: apiHeaders(token), body: JSON.stringify(payload),
          });
      if (!res.ok) throw new Error(await extractError(res));
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="sub-form">
      <div className="form-grid">
        <label className="form-label">캐릭터명
          <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" required />
        </label>
        <label className="form-label">PL명
          <input value={plName} onChange={(e) => setPlName(e.target.value)} className="form-input" required />
        </label>
        <label className="form-label">소개 (팝업용)
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="form-textarea" rows={2} />
        </label>
        <label className="form-label">표시 순서
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
            className="form-input" min={0} />
        </label>
        <div className="form-label">
          캐릭터 이미지
          {imagePreview && (
            <div className="cover-preview-wrap">
              <img src={imagePreview} alt="캐릭터 이미지 미리보기" className="cover-preview" />
              <button type="button" onClick={clearImage} className="cover-remove-btn">이미지 제거</button>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImageChange} className="form-input" />
        </div>
        <div className="form-label">
          대사 목록 (팝업에서 랜덤 표시)
          {quotes.map((q, i) => (
            <div key={i} className="quote-row">
              <input value={q} onChange={(e) => {
                const next = [...quotes]; next[i] = e.target.value; setQuotes(next);
              }} className="form-input" placeholder={`대사 ${i + 1}`} />
              {quotes.length > 1 && (
                <button type="button" onClick={() => setQuotes(quotes.filter((_, j) => j !== i))}
                  className="btn-remove">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setQuotes([...quotes, ''])} className="btn-add">
            + 대사 추가
          </button>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="btn-row">
        <button type="button" onClick={onCancel} className="btn-secondary">취소</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '저장 중…' : (isEdit ? '저장' : '캐릭터 추가')}
        </button>
      </div>
    </form>
  );
}

// ── 시나리오 상세 패널 ────────────────────────────────

function ScenarioDetail({ token, scenario, onBack }: {
  token: string; scenario: Scenario; onBack: () => void;
}) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [chars, setChars] = useState<Character[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showCharForm, setShowCharForm] = useState(false);
  const [editChar, setEditChar] = useState<Character | null>(null);
  const [editLog, setEditLog] = useState<Log | null>(null);
  const [editScenario, setEditScenario] = useState(false);

  const fetchAll = async () => {
    const detail = await fetch(`/logs/api/scenarios/${scenario.slug}`).then((r) => r.json() as Promise<{
      logs: Log[]; characters: Character[];
    }>);
    setLogs(detail.logs ?? []);
    setChars(detail.characters ?? []);
    const rv = await fetch(`/logs/api/scenarios/${scenario.slug}/reviews`).then((r) => r.json() as Promise<Review[]>);
    setReviews(rv);
  };

  useEffect(() => { void fetchAll(); }, []);

  const deleteLog = async (id: number) => {
    if (!confirm('이 로그를 삭제하시겠습니까?')) return;
    await fetch(`/logs/api/admin/logs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    void fetchAll();
  };

  const deleteChar = async (id: number) => {
    if (!confirm('이 캐릭터를 삭제하시겠습니까?')) return;
    await fetch(`/logs/api/admin/characters/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    void fetchAll();
  };

  const deleteReview = async (id: number) => {
    if (!confirm('이 후기를 삭제하시겠습니까?')) return;
    await fetch(`/logs/api/admin/reviews/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    void fetchAll();
  };

  return (
    <div>
      <button onClick={onBack} className="btn-back">← 목록으로</button>
      <div className="scenario-header" style={{ borderColor: scenario.color }}>
        <h2 className="scenario-h2" style={{ color: scenario.color }}>{scenario.title}</h2>
        <p className="scenario-slug">/{scenario.slug}</p>
        <button onClick={() => setEditScenario(true)} className="btn-secondary btn-sm">수정</button>
      </div>

      {editScenario && (
        <ScenarioForm
          token={token}
          initial={scenario}
          onSaved={() => { setEditScenario(false); onBack(); }}
          onCancel={() => setEditScenario(false)}
        />
      )}

      {/* 로그 */}
      <section className="admin-section">
        <h3 className="section-h3">로그 ({logs.length}개)</h3>
        <ul className="admin-list">
          {logs.map((log) => (
            <li key={log.id} className="admin-list-item">
              <span>#{log.order_num} {log.title}</span>
              <div className="btn-row">
                <button onClick={() => { setEditLog(log); }} className="btn-secondary btn-sm">수정</button>
                <button onClick={() => deleteLog(log.id)} className="btn-danger btn-sm">삭제</button>
              </div>
            </li>
          ))}
        </ul>
        {editLog && (
          <LogForm
            token={token}
            scenarioId={scenario.id}
            initial={editLog}
            onSaved={() => { setEditLog(null); void fetchAll(); }}
            onCancel={() => setEditLog(null)}
          />
        )}
        {!editLog && (
          <LogForm token={token} scenarioId={scenario.id} onSaved={fetchAll} />
        )}
      </section>

      {/* 캐릭터 */}
      <section className="admin-section">
        <h3 className="section-h3">캐릭터 ({chars.length}명)</h3>
        <ul className="admin-list">
          {chars.map((ch) => (
            <li key={ch.id} className="admin-list-item">
              <span>{ch.name} (PL: {ch.pl_name})</span>
              <div className="btn-row">
                <button onClick={() => { setEditChar(ch); setShowCharForm(false); }}
                  className="btn-secondary btn-sm">수정</button>
                <button onClick={() => deleteChar(ch.id)} className="btn-danger btn-sm">삭제</button>
              </div>
            </li>
          ))}
        </ul>
        {editChar && (
          <CharacterForm
            token={token}
            scenarioId={scenario.id}
            scenarioSlug={scenario.slug}
            initial={editChar}
            onSaved={() => { setEditChar(null); void fetchAll(); }}
            onCancel={() => setEditChar(null)}
          />
        )}
        {!editChar && !showCharForm && (
          <button onClick={() => setShowCharForm(true)} className="btn-secondary">+ 캐릭터 추가</button>
        )}
        {!editChar && showCharForm && (
          <CharacterForm
            token={token}
            scenarioId={scenario.id}
            scenarioSlug={scenario.slug}
            onSaved={() => { setShowCharForm(false); void fetchAll(); }}
            onCancel={() => setShowCharForm(false)}
          />
        )}
      </section>

      {/* 후기 */}
      <section className="admin-section">
        <h3 className="section-h3">후기 ({reviews.length}개)</h3>
        <ul className="admin-list">
          {reviews.map((r) => (
            <li key={r.id} className="admin-list-item admin-review-item">
              <div>
                <span className="review-name">{r.pl_name ?? '익명'}</span>
                <span className="review-text">{r.content}</span>
              </div>
              <button onClick={() => deleteReview(r.id)} className="btn-danger btn-sm">삭제</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ── 메인 앱 ───────────────────────────────────────────

export default function AdminApp() {
  const [token, setToken] = useState('');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchScenarios = async () => {
    const data = await fetch('/logs/api/scenarios').then((r) => r.json() as Promise<Scenario[]>);
    setScenarios(data);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (token) { sessionStorage.setItem('admin_token', token); void fetchScenarios(); }
  }, [token]);

  const deleteScenario = async (id: number) => {
    if (!confirm('시나리오와 모든 관련 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    await fetch(`/logs/api/admin/scenarios/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    void fetchScenarios();
  };

  if (!token) return <LoginScreen onLogin={setToken} />;

  if (selected) {
    return (
      <ScenarioDetail
        token={token}
        scenario={selected}
        onBack={() => { setSelected(null); void fetchScenarios(); }}
      />
    );
  }

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">로그 관리</h1>
        <div className="btn-row">
          <button onClick={() => setShowCreate(true)} className="btn-primary">+ 시나리오 추가</button>
          <button onClick={() => { setToken(''); sessionStorage.removeItem('admin_token'); }}
            className="btn-secondary">로그아웃</button>
        </div>
      </div>

      {showCreate && (
        <ScenarioForm
          token={token}
          onSaved={() => { setShowCreate(false); void fetchScenarios(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      <ul className="admin-scenario-list">
        {scenarios.map((s) => (
          <li key={s.id} className="admin-scenario-item" style={{ '--c': s.color } as React.CSSProperties}>
            <button className="scenario-btn" onClick={() => setSelected(s)}>
              <span className="scenario-color-dot" />
              <span className="scenario-info">
                <span className="scenario-title">{s.title}</span>
                <span className="scenario-meta">/{s.slug} · {s.log_count}개 로그</span>
              </span>
            </button>
            <button onClick={() => deleteScenario(s.id)} className="btn-danger btn-sm">삭제</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
