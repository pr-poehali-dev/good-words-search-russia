import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const ADMIN_API = "https://functions.poehali.dev/835e8ee8-6a9d-4ea4-b83f-325872ed9bb9";

interface Violator {
  id: number;
  bad_word: string;
  latitude: number | null;
  longitude: number | null;
  city: string;
  ip: string | null;
  created_at: string;
}
interface CustomWord { id: number; word: string; added_at: string; }

const call = async (action: string, extra: Record<string, unknown>, method = "POST") => {
  const creds = JSON.parse(localStorage.getItem("maks_admin") || "{}");
  const r = await fetch(ADMIN_API, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...creds, ...extra }),
  });
  const text = await r.json();
  return typeof text === "string" ? JSON.parse(text) : text;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// ---- Экран входа ----
const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!phone || !password) { setError("Введи номер и пароль"); return; }
    setLoading(true); setError("");
    try {
      const r = await fetch(ADMIN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", phone, password }),
      });
      const data = await r.json();
      const d = typeof data === "string" ? JSON.parse(data) : data;
      if (d.ok) {
        localStorage.setItem("maks_admin", JSON.stringify({ phone, password }));
        onLogin();
      } else {
        setError(d.error || "Неверные данные");
      }
    } catch {
      setError("Ошибка соединения");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div
        className="w-full max-w-sm"
        style={{ animation: "fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        {/* Логотип */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="font-black text-2xl tracking-widest uppercase" style={{ fontFamily: "'Oswald', sans-serif", color: "#0d0d0d" }}>
            Вход для создателя
          </h1>
          <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: "'Golos Text', sans-serif" }}>
            МАКС ПОИСК · Панель управления
          </p>
        </div>

        <div className="space-y-3">
          {/* Телефон */}
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: "#f7f7f7", border: "1.5px solid #efefef" }}
          >
            <span className="text-gray-400"><Icon name="Phone" size={18} /></span>
            <input
              type="tel"
              placeholder="+7 999 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700"
              style={{ fontFamily: "'Golos Text', sans-serif" }}
            />
          </div>

          {/* Пароль */}
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: "#f7f7f7", border: "1.5px solid #efefef" }}
          >
            <span className="text-gray-400"><Icon name="Lock" size={18} /></span>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700"
              style={{ fontFamily: "'Golos Text', sans-serif" }}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center" style={{ fontFamily: "'Golos Text', sans-serif" }}>
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95"
            style={{
              background: loading ? "#e0e0e0" : "linear-gradient(135deg, #6c63ff, #a78bfa)",
              color: "#fff",
              fontFamily: "'Golos Text', sans-serif",
            }}
          >
            {loading ? "Проверяю..." : "Войти как создатель"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ---- Панель создателя ----
const AdminPanel = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"violators" | "words">("violators");
  const [violators, setViolators] = useState<Violator[]>([]);
  const [words, setWords] = useState<CustomWord[]>([]);
  const [newWord, setNewWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const flash = (text: string) => { setMsg(text); setTimeout(() => setMsg(""), 2500); };

  const loadViolators = async () => {
    setLoading(true);
    const data = await call("list_violators", {});
    setViolators(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const loadWords = async () => {
    setLoading(true);
    const data = await call("list_words", {});
    setWords(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { loadViolators(); }, []);
  useEffect(() => { if (tab === "violators") loadViolators(); else loadWords(); }, [tab]);

  const deleteViolator = async (id: number) => {
    await call("delete_violator", { id }, "DELETE");
    setViolators((v) => v.filter((x) => x.id !== id));
    flash("Удалено!");
  };

  const addWord = async () => {
    if (!newWord.trim()) return;
    const r = await call("add_word", { word: newWord.trim() });
    if (r.ok) { setNewWord(""); loadWords(); flash("Слово добавлено!"); }
  };

  const deleteWord = async (word: string) => {
    await call("delete_word", { word }, "DELETE");
    setWords((w) => w.filter((x) => x.word !== word));
    flash("Слово удалено!");
  };

  const logout = () => {
    localStorage.removeItem("maks_admin");
    onLogout();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Шапка */}
      <div
        className="px-4 py-4 flex items-center justify-between"
        style={{ borderBottom: "1.5px solid #f0f0f0" }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-gray-400 hover:text-gray-700 transition-colors">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <h1 className="font-black text-lg tracking-wider uppercase" style={{ fontFamily: "'Oswald', sans-serif", color: "#0d0d0d" }}>
              👑 Панель создателя
            </h1>
            <p className="text-xs text-gray-400" style={{ fontFamily: "'Golos Text', sans-serif" }}>МАКС ПОИСК</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-xl"
          style={{ fontFamily: "'Golos Text', sans-serif", border: "1px solid #f0f0f0" }}
        >
          <Icon name="LogOut" size={14} />
          Выйти
        </button>
      </div>

      {/* Flash сообщение */}
      {msg && (
        <div className="mx-4 mt-3 py-2 px-4 rounded-xl text-center text-sm font-medium text-green-600"
          style={{ background: "#f0fff4", border: "1px solid #bbf7d0", fontFamily: "'Golos Text', sans-serif" }}>
          ✅ {msg}
        </div>
      )}

      {/* Табы */}
      <div className="px-4 mt-4 flex gap-2">
        {[
          { key: "violators", label: `🚨 Нарушители (${violators.length})` },
          { key: "words", label: `🔤 Плохие слова (${words.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as "violators" | "words")}
            className="px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200"
            style={{
              fontFamily: "'Golos Text', sans-serif",
              background: tab === t.key ? "#0d0d0d" : "#f5f5f5",
              color: tab === t.key ? "#fff" : "#888",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 pb-10">
        {/* ---- Нарушители ---- */}
        {tab === "violators" && (
          <div>
            {loading ? (
              <div className="text-center py-16 text-gray-300" style={{ fontFamily: "'Golos Text', sans-serif" }}>Загрузка...</div>
            ) : violators.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-2">😇</div>
                <p className="text-gray-400 text-sm" style={{ fontFamily: "'Golos Text', sans-serif" }}>Нарушителей нет</p>
              </div>
            ) : (
              <div className="space-y-2 max-w-2xl mx-auto">
                {violators.map((v, i) => (
                  <div
                    key={v.id}
                    className="flex items-start gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: "#fafafa", border: "1.5px solid #f0f0f0", animation: `fadeSlideUp 0.3s ${i * 0.03}s both` }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: "#fff0f0", color: "#cc2222", fontFamily: "'Oswald', sans-serif" }}>
                          «{v.bad_word}»
                        </span>
                        {v.city && <span className="text-xs text-gray-400" style={{ fontFamily: "'Golos Text', sans-serif" }}>📍 {v.city}</span>}
                        {v.ip && <span className="text-xs text-gray-300" style={{ fontFamily: "'Golos Text', sans-serif" }}>IP: {v.ip}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {v.latitude && v.longitude && (
                          <a
                            href={`https://yandex.ru/maps/?pt=${v.longitude},${v.latitude}&z=14`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs text-purple-400 underline"
                            style={{ fontFamily: "'Golos Text', sans-serif" }}
                          >
                            {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)} →
                          </a>
                        )}
                        <span className="text-xs text-gray-300" style={{ fontFamily: "'Golos Text', sans-serif" }}>
                          {v.created_at ? fmt(v.created_at) : ""}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteViolator(v.id)}
                      className="flex-shrink-0 p-2 rounded-xl transition-all hover:bg-red-50 text-gray-300 hover:text-red-400"
                    >
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---- Плохие слова ---- */}
        {tab === "words" && (
          <div className="max-w-2xl mx-auto">
            {/* Добавить слово */}
            <div className="flex gap-2 mb-4">
              <div
                className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{ background: "#f7f7f7", border: "1.5px solid #efefef" }}
              >
                <input
                  type="text"
                  placeholder="Новое плохое слово..."
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addWord()}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-700"
                  style={{ fontFamily: "'Golos Text', sans-serif" }}
                />
              </div>
              <button
                onClick={addWord}
                className="px-4 py-3 rounded-2xl font-semibold text-sm transition-all hover:scale-105 active:scale-95"
                style={{ background: "#0d0d0d", color: "#fff", fontFamily: "'Golos Text', sans-serif" }}
              >
                + Добавить
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-3" style={{ fontFamily: "'Golos Text', sans-serif" }}>
              * Слова из встроенного списка всегда активны. Здесь — дополнительные слова которые ты добавил.
            </p>

            {loading ? (
              <div className="text-center py-10 text-gray-300" style={{ fontFamily: "'Golos Text', sans-serif" }}>Загрузка...</div>
            ) : words.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">📝</div>
                <p className="text-gray-400 text-sm" style={{ fontFamily: "'Golos Text', sans-serif" }}>Пока нет добавленных слов</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {words.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                    style={{ background: "#fff0f0", border: "1px solid #ffd0d0" }}
                  >
                    <span className="text-sm font-semibold text-red-500" style={{ fontFamily: "'Golos Text', sans-serif" }}>
                      {w.word}
                    </span>
                    <button
                      onClick={() => deleteWord(w.word)}
                      className="text-red-300 hover:text-red-500 transition-colors"
                    >
                      <Icon name="X" size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ---- Главный компонент ----
const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("maks_admin");
    if (saved) setIsLoggedIn(true);
  }, []);

  if (!isLoggedIn) return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  return <AdminPanel onLogout={() => setIsLoggedIn(false)} />;
};

export default Admin;
