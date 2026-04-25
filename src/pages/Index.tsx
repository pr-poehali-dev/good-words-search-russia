import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

// Список плохих слов (фильтр)
const BAD_WORDS = [
  "убий","убить","смерть","умри","ненавижу","дурак","идиот","тупой","придурок",
  "stupid","kill","hate","die","dead","murder","shit","fuck","ass","damn","bitch",
  "сука","блять","блядь","хуй","пизда","ебать","ёбаный","пидор","мразь","урод",
  "говно","дерьмо","козёл","козел","шлюха","лох","лошара","чмо","быдло","скотина",
];

// Запрещённые сайты
const BLOCKED_SITES = [
  "tiktok.com","tiktok","тикток",
  "google.com","google","гугл",
];

const containsBadWords = (text: string): boolean => {
  const lower = text.toLowerCase();
  return BAD_WORDS.some((w) => lower.includes(w));
};

const isURL = (str: string): boolean => {
  const trimmed = str.trim();
  if (!trimmed) return false;
  const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/i;
  return urlPattern.test(trimmed);
};

const normalizeURL = (str: string): string => {
  const trimmed = str.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const QUICK_SITES = [
  { label: "YouTube", url: "https://youtube.com", emoji: "▶️", blocked: false },
  { label: "ВКонтакте", url: "https://vk.com", emoji: "💙", blocked: false },
  { label: "Мессенджер", url: "https://max.ru", emoji: "💬", blocked: false },
  { label: "Госуслуги", url: "https://gosuslugi.ru", emoji: "🇷🇺", blocked: false },
  { label: "TikTok", url: "https://tiktok.com", emoji: "🎵", blocked: true },
  { label: "Google", url: "https://google.com", emoji: "🔍", blocked: true },
];

const Index = () => {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningStep, setWarningStep] = useState(0);
  const [listening, setListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const isBlockedSite = (text: string): boolean => {
    const lower = text.toLowerCase();
    return BLOCKED_SITES.some((s) => lower.includes(s));
  };

  const handleSearch = (q?: string) => {
    const text = (q ?? query).trim();
    if (!text) return;

    if (isBlockedSite(text)) {
      setBlocked(true);
      setShowWarning(true);
      setWarningStep(0);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(() => {}, () => {});
      }
      setTimeout(() => setWarningStep(1), 800);
      setTimeout(() => setWarningStep(2), 2000);
      setTimeout(() => setWarningStep(3), 3500);
      return;
    }

    if (containsBadWords(text)) {
      setBlocked(true);
      setShowWarning(true);
      setWarningStep(0);
      // запрашиваем геолокацию по-настоящему
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(() => {}, () => {});
      }
      // шаги угрозы
      setTimeout(() => setWarningStep(1), 800);
      setTimeout(() => setWarningStep(2), 2000);
      setTimeout(() => setWarningStep(3), 3500);
      return;
    }

    if (isURL(text)) {
      window.open(normalizeURL(text), "_blank", "noopener,noreferrer");
    } else {
      window.open(
        `https://yandex.ru/search/?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleVoice = () => {
    type SR = { new(): SpeechRecognitionInstance };
    type SpeechRecognitionInstance = {
      lang: string; interimResults: boolean; start: () => void; stop: () => void;
      onstart: () => void; onend: () => void;
      onresult: (e: { results: { 0: { transcript: string }[] }[] }) => void;
    };
    const SpeechRecognition: SR | undefined =
      (window as Window & { SpeechRecognition?: SR; webkitSpeechRecognition?: SR }).SpeechRecognition ||
      (window as Window & { SpeechRecognition?: SR; webkitSpeechRecognition?: SR }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Ваш браузер не поддерживает голосовой ввод");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setQuery(transcript);
      setTimeout(() => handleSearch(transcript), 100);
    };
    recognition.start();
  };

  const handleCamera = () => {
    window.open("https://yandex.ru/images/", "_blank", "noopener,noreferrer");
  };

  const handleKeyboard = () => {
    inputRef.current?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (blocked) setBlocked(false);
    // Запрашиваем геолокацию сразу при вводе плохого слова
    if (containsBadWords(val) && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => {}, () => {});
    }
  };

  const dismissWarning = () => {
    setShowWarning(false);
    setBlocked(false);
    setWarningStep(0);
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 pb-10">

      {/* ПРЕДУПРЕЖДЕНИЕ при плохих словах */}
      {showWarning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.85)", animation: "fadeIn 0.2s both" }}
        >
          <div
            className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{
              background: "#0d0d0d",
              border: "1.5px solid #ff3b3b",
              boxShadow: "0 0 60px rgba(255,50,50,0.3)",
              animation: "scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            {/* Заголовок */}
            <div
              className="px-6 pt-6 pb-4 text-center"
              style={{ borderBottom: "1px solid #1e1e1e" }}
            >
              <div className="text-4xl mb-3" style={{ animation: warningStep >= 0 ? "pulse 0.6s infinite" : "none" }}>
                🚨
              </div>
              <p className="text-red-400 font-bold text-lg" style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "0.05em" }}>
                НАРУШЕНИЕ ОБНАРУЖЕНО
              </p>
            </div>

            {/* Шаги */}
            <div className="px-6 py-5 space-y-3">
              <div
                className="flex items-start gap-3 transition-all duration-500"
                style={{ opacity: warningStep >= 0 ? 1 : 0, transform: warningStep >= 0 ? "translateX(0)" : "translateX(-10px)" }}
              >
                <span className="text-xl mt-0.5">📍</span>
                <div>
                  <p className="text-white text-sm font-semibold" style={{ fontFamily: "'Golos Text', sans-serif" }}>
                    Запрос геолокации отправлен
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">Ваше местоположение определяется...</p>
                </div>
              </div>

              <div
                className="flex items-start gap-3 transition-all duration-500"
                style={{ opacity: warningStep >= 1 ? 1 : 0, transform: warningStep >= 1 ? "translateX(0)" : "translateX(-10px)" }}
              >
                <span className="text-xl mt-0.5">👁️</span>
                <div>
                  <p className="text-white text-sm font-semibold" style={{ fontFamily: "'Golos Text', sans-serif" }}>
                    За вами ведётся наблюдение
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">Данные передаются администратору...</p>
                </div>
              </div>

              <div
                className="flex items-start gap-3 transition-all duration-500"
                style={{ opacity: warningStep >= 2 ? 1 : 0, transform: warningStep >= 2 ? "translateX(0)" : "translateX(-10px)" }}
              >
                <span className="text-xl mt-0.5">⚙️</span>
                <div>
                  <p className="text-white text-sm font-semibold" style={{ fontFamily: "'Golos Text', sans-serif" }}>
                    Добавлен в список нарушителей
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">Информация занесена в базу данных...</p>
                </div>
              </div>
            </div>

            {/* Кнопка */}
            <div className="px-6 pb-6">
              <button
                onClick={dismissWarning}
                className="w-full py-3 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-95"
                style={{
                  background: warningStep >= 3 ? "#ff3b3b" : "#1e1e1e",
                  color: warningStep >= 3 ? "#fff" : "#555",
                  fontFamily: "'Golos Text', sans-serif",
                  cursor: warningStep >= 3 ? "pointer" : "not-allowed",
                  transition: "all 0.5s",
                }}
              >
                {warningStep >= 3 ? "Я всё понял, буду вежливым" : "Подождите..."}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Logo */}
      <div
        className="mb-14 select-none"
        style={{ animation: "fadeSlideDown 0.6s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <h1
          className="text-logo font-black tracking-widest uppercase"
          style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "0.12em" }}
        >
          <span style={{ color: "#0d0d0d" }}>МАКС </span>
          <span style={{ position: "relative", display: "inline-block" }}>
            <span style={{ color: "#0d0d0d" }}>П</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "0.85em",
                height: "0.85em",
                background: "linear-gradient(135deg, #6c63ff 0%, #8b5cf6 50%, #a78bfa 100%)",
                borderRadius: "50%",
                verticalAlign: "middle",
                margin: "0 0.02em",
                position: "relative",
                top: "-0.05em",
              }}
            >
              <svg width="45%" height="45%" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  fill="white"
                />
              </svg>
            </span>
            <span style={{ color: "#0d0d0d" }}>ИСК</span>
          </span>
        </h1>
      </div>

      {/* Search box */}
      <div
        className="w-full max-w-2xl"
        style={{ animation: "fadeSlideUp 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-full transition-all duration-300"
          style={{
            background: blocked ? "#fff5f5" : focused ? "#fff" : "#f5f5f5",
            border: `1.5px solid ${blocked ? "#fca5a5" : focused ? "#c8c8c8" : "#e8e8e8"}`,
            boxShadow: blocked
              ? "0 4px 20px rgba(239,68,68,0.12)"
              : focused
              ? "0 4px 32px rgba(0,0,0,0.09)"
              : "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <button
            onClick={() => handleSearch()}
            className="flex-shrink-0 transition-opacity duration-200 hover:opacity-60"
            style={{ color: "#aaa" }}
          >
            <Icon name="Search" size={22} />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Поиск или адрес сайта"
            className="flex-1 bg-transparent outline-none text-base text-gray-800 placeholder-gray-400"
            style={{ fontFamily: "'Golos Text', sans-serif", fontSize: "16px" }}
          />

          <div className="flex items-center gap-3 flex-shrink-0">
            {query && (
              <button
                onClick={() => { setQuery(""); setBlocked(false); }}
                className="transition-opacity duration-200 hover:opacity-60"
                style={{ color: "#bbb" }}
              >
                <Icon name="X" size={18} />
              </button>
            )}
            <button
              onClick={handleKeyboard}
              className="transition-opacity duration-200 hover:opacity-60"
              style={{ color: "#aaa" }}
              title="Ввод с клавиатуры"
            >
              <Icon name="Keyboard" size={20} />
            </button>
            <button
              onClick={handleVoice}
              className="transition-all duration-200"
              style={{
                color: listening ? "#6c63ff" : "#aaa",
                transform: listening ? "scale(1.15)" : "scale(1)",
              }}
              title="Голосовой поиск"
            >
              <Icon name={listening ? "MicOff" : "Mic"} size={20} />
            </button>
            <button
              onClick={handleCamera}
              className="transition-opacity duration-200 hover:opacity-60"
              style={{ color: "#aaa" }}
              title="Поиск по картинке"
            >
              <Icon name="ScanSearch" size={20} />
            </button>
          </div>
        </div>

        {/* Hint / blocked */}
        <div
          className="text-center mt-4 text-sm transition-all duration-300"
          style={{
            fontFamily: "'Golos Text', sans-serif",
            minHeight: "24px",
          }}
        >
          {blocked ? (
            <span
              className="text-red-400 font-medium"
              style={{ animation: "shakeX 0.4s both" }}
            >
              🚫 Пожалуйста, используй добрые слова!
            </span>
          ) : query ? (
            <span className="text-gray-400">
              {isURL(query) ? (
                <>
                  <Icon name="ExternalLink" size={13} className="inline mr-1 mb-0.5" />
                  Откроет сайт:{" "}
                  <span className="text-gray-600 font-medium">{normalizeURL(query)}</span>
                </>
              ) : (
                <>
                  <Icon name="Search" size={13} className="inline mr-1 mb-0.5" />
                  Поиск в Яндексе:{" "}
                  <span className="text-gray-600 font-medium">«{query}»</span>
                </>
              )}
            </span>
          ) : null}
        </div>
      </div>

      {/* Quick sites */}
      <div
        className="mt-12 w-full max-w-2xl"
        style={{ animation: "fadeSlideUp 0.6s 0.3s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <p
          className="text-center text-xs text-gray-300 mb-5 uppercase tracking-widest"
          style={{ fontFamily: "'Golos Text', sans-serif" }}
        >
          Быстрый переход
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_SITES.map((site) => (
            <button
              key={site.url}
              onClick={() => {
                if (site.blocked) {
                  setBlocked(true);
                  setShowWarning(true);
                  setWarningStep(0);
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(() => {}, () => {});
                  }
                  setTimeout(() => setWarningStep(1), 800);
                  setTimeout(() => setWarningStep(2), 2000);
                  setTimeout(() => setWarningStep(3), 3500);
                } else {
                  window.open(site.url, "_blank", "noopener,noreferrer");
                }
              }}
              className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all duration-200 active:scale-95"
              style={{
                background: site.blocked ? "#f5f5f5" : "#f7f7f7",
                border: `1.5px solid ${site.blocked ? "#e0e0e0" : "#efefef"}`,
                opacity: site.blocked ? 0.6 : 1,
                cursor: site.blocked ? "not-allowed" : "pointer",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!site.blocked) {
                  (e.currentTarget as HTMLElement).style.background = "#f0f0ff";
                  (e.currentTarget as HTMLElement).style.borderColor = "#d0c8ff";
                }
              }}
              onMouseLeave={(e) => {
                if (!site.blocked) {
                  (e.currentTarget as HTMLElement).style.background = "#f7f7f7";
                  (e.currentTarget as HTMLElement).style.borderColor = "#efefef";
                }
              }}
            >
              <span style={{ fontSize: "1.6rem", lineHeight: 1, filter: site.blocked ? "grayscale(1)" : "none" }}>
                {site.emoji}
              </span>
              <span
                className="text-xs font-medium"
                style={{ fontFamily: "'Golos Text', sans-serif", color: site.blocked ? "#bbb" : "#6b7280" }}
              >
                {site.label}
              </span>
              {site.blocked && (
                <span style={{ fontSize: "0.6rem", color: "#d0d0d0", marginTop: "-4px" }}>🔒 заблокирован</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .text-logo { font-size: clamp(2.5rem, 8vw, 5.5rem); }

        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shakeX {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default Index;