import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

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

const Index = () => {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;
    setSubmitted(true);
    setTimeout(() => {
      if (isURL(q)) {
        window.open(normalizeURL(q), "_blank", "noopener,noreferrer");
      } else {
        window.open(
          `https://yandex.ru/search/?text=${encodeURIComponent(q)}`,
          "_blank",
          "noopener,noreferrer"
        );
      }
      setSubmitted(false);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div
        className="mb-16 select-none"
        style={{
          animation: "fadeSlideDown 0.6s cubic-bezier(0.16,1,0.3,1) both",
        }}
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
        style={{
          animation: "fadeSlideUp 0.6s 0.15s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-full transition-all duration-300"
          style={{
            background: focused ? "#fff" : "#f5f5f5",
            border: `1.5px solid ${focused ? "#c8c8c8" : "#e8e8e8"}`,
            boxShadow: focused
              ? "0 4px 32px rgba(0,0,0,0.09)"
              : "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {/* Search icon */}
          <button
            onClick={handleSearch}
            className="flex-shrink-0 transition-opacity duration-200 hover:opacity-60"
            style={{ color: "#aaa" }}
          >
            <Icon name="Search" size={22} />
          </button>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Поиск или адрес сайта"
            className="flex-1 bg-transparent outline-none text-base text-gray-800 placeholder-gray-400"
            style={{ fontFamily: "'Golos Text', sans-serif", fontSize: "16px" }}
          />

          {/* Right icons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {query && (
              <button
                onClick={() => setQuery("")}
                className="transition-opacity duration-200 hover:opacity-60"
                style={{ color: "#bbb" }}
              >
                <Icon name="X" size={18} />
              </button>
            )}
            <button
              className="transition-opacity duration-200 hover:opacity-60"
              style={{ color: "#aaa" }}
              title="Клавиатура"
            >
              <Icon name="Keyboard" size={20} />
            </button>
            <button
              className="transition-opacity duration-200 hover:opacity-60"
              style={{ color: "#aaa" }}
              title="Голосовой поиск"
            >
              <Icon name="Mic" size={20} />
            </button>
            <button
              className="transition-opacity duration-200 hover:opacity-60"
              style={{ color: "#aaa" }}
              title="Поиск по фото"
            >
              <Icon name="ScanSearch" size={20} />
            </button>
          </div>
        </div>

        {/* Hint */}
        <p
          className="text-center mt-5 text-sm text-gray-400 transition-all duration-300"
          style={{
            fontFamily: "'Golos Text', sans-serif",
            opacity: query ? 1 : 0,
            transform: query ? "translateY(0)" : "translateY(4px)",
          }}
        >
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
        </p>
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
      `}</style>
    </div>
  );
};

export default Index;
