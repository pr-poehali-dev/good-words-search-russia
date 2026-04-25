import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/1e8f16c2-6908-4fbe-acbd-4c63fe466f7e";

interface Violator {
  id: number;
  bad_word: string;
  latitude: number | null;
  longitude: number | null;
  city: string;
  created_at: string;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const Violators = () => {
  const [list, setList] = useState<Violator[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((data) => {
        setList(typeof data === "string" ? JSON.parse(data) : data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Шапка */}
        <div className="flex items-center gap-4 mb-10" style={{ animation: "fadeSlideDown 0.5s both" }}>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors text-sm"
            style={{ fontFamily: "'Golos Text', sans-serif" }}
          >
            <Icon name="ArrowLeft" size={18} />
            Назад
          </button>
          <div>
            <h1
              className="font-black text-2xl tracking-widest uppercase"
              style={{ fontFamily: "'Oswald', sans-serif", color: "#0d0d0d" }}
            >
              🚨 Нарушители
            </h1>
            <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'Golos Text', sans-serif" }}>
              Все кто писал плохие слова
            </p>
          </div>
        </div>

        {/* Список */}
        {loading ? (
          <div className="text-center py-20 text-gray-300" style={{ fontFamily: "'Golos Text', sans-serif" }}>
            Загрузка...
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">😇</div>
            <p className="text-gray-400" style={{ fontFamily: "'Golos Text', sans-serif" }}>
              Нарушителей пока нет — все ведут себя хорошо!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((v, i) => (
              <div
                key={v.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "#fafafa",
                  border: "1.5px solid #f0f0f0",
                  animation: `fadeSlideUp 0.4s ${i * 0.05}s both`,
                }}
              >
                <div className="px-5 py-4 flex items-start gap-4">
                  {/* Номер */}
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "#fff0f0", color: "#ff4444", fontFamily: "'Oswald', sans-serif" }}
                  >
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Слово */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-400" style={{ fontFamily: "'Golos Text', sans-serif" }}>написал:</span>
                      <span
                        className="px-2 py-0.5 rounded-lg text-sm font-bold"
                        style={{ background: "#fff0f0", color: "#cc2222", fontFamily: "'Oswald', sans-serif", letterSpacing: "0.03em" }}
                      >
                        «{v.bad_word}»
                      </span>
                    </div>

                    {/* Локация */}
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-1.5">
                        <span>📍</span>
                        <span className="text-sm text-gray-600" style={{ fontFamily: "'Golos Text', sans-serif" }}>
                          {v.city || "Неизвестно"}
                        </span>
                      </div>
                      {v.latitude && v.longitude && (
                        <a
                          href={`https://yandex.ru/maps/?pt=${v.longitude},${v.latitude}&z=14&l=map`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
                        >
                          <span className="text-xs text-purple-400 underline" style={{ fontFamily: "'Golos Text', sans-serif" }}>
                            {v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}
                          </span>
                          <Icon name="ExternalLink" size={11} className="text-purple-300" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Дата */}
                  <div className="flex-shrink-0 text-right">
                    <span className="text-xs text-gray-300" style={{ fontFamily: "'Golos Text', sans-serif" }}>
                      {v.created_at ? formatDate(v.created_at) : ""}
                    </span>
                  </div>
                </div>

                {/* Карта-ссылка если есть координаты */}
                {v.latitude && v.longitude && (
                  <a
                    href={`https://yandex.ru/maps/?pt=${v.longitude},${v.latitude}&z=14&l=map`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-5 py-2 text-xs transition-colors"
                    style={{
                      borderTop: "1px solid #f0f0f0",
                      color: "#aaa",
                      fontFamily: "'Golos Text', sans-serif",
                      background: "#f7f7f7",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0f0ff"; (e.currentTarget as HTMLElement).style.color = "#7c6fff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#f7f7f7"; (e.currentTarget as HTMLElement).style.color = "#aaa"; }}
                  >
                    🗺️ Открыть на карте в Яндекс.Картах →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Violators;
