import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

export default function App() {
  const [coins, setCoins] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedCoin, setExpandedCoin] = useState(null);
  const [chartData, setChartData] = useState({});
  const [news, setNews] = useState([]);
  const [darkMode, setDarkMode] = useState(true);

  // 💡 Dark Mode speichern/laden
  useEffect(() => {
    const savedMode = localStorage.getItem("theme");
    if (savedMode === "light") setDarkMode(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // 🪙 Coins laden
  useEffect(() => {
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false"
    )
      .then((res) => res.json())
      .then((data) => setCoins(data))
      .catch((err) => console.error("Fehler beim Laden der Coins:", err));
  }, []);

  // 📈 Verlauf für angeklickten Coin laden
  const loadChart = async (id) => {
    if (expandedCoin === id) {
      setExpandedCoin(null);
      return;
    }

    setExpandedCoin(id);

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`
      );
      const data = await res.json();

      const chart = {
        labels: data.prices.map((p) =>
          new Date(p[0]).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "short",
          })
        ),
        datasets: [
          {
            label: `${id.toUpperCase()} Preis (7 Tage)`,
            data: data.prices.map((p) => p[1]),
            borderColor: darkMode ? "#10b981" : "#2563eb",
            backgroundColor: darkMode
              ? "rgba(16,185,129,0.1)"
              : "rgba(37,99,235,0.1)",
            fill: true,
            tension: 0.3,
          },
        ],
      };

      setChartData((prev) => ({ ...prev, [id]: chart }));
    } catch (error) {
      console.error("Fehler beim Laden des Charts:", error);
    }
  };

  // 📰 News laden
  useEffect(() => {
    fetch("https://api.coinstats.app/public/v1/news?skip=0&limit=5")
      .then((res) => res.json())
      .then((data) => {
        if (data.news) setNews(data.news);
      })
      .catch((err) => console.error("Fehler beim Laden der News:", err));
  }, []);

  // 🔍 Filterfunktion
  const filteredCoins = coins.filter((coin) =>
    coin.name.toLowerCase().includes(search.toLowerCase())
  );

  // 📊 Top Gainers / Losers berechnen
  const topGainers = [...coins]
    .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
    .slice(0, 5);

  const topLosers = [...coins]
    .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
    .slice(0, 5);

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      } p-6`}
    >
     {/* 🌙 Header mit Toggle */}
<header className="relative mb-8">
  {/* Titel mittig */}
  <h1 className="text-3xl sm:text-4xl font-bold text-center">
    💰 Crypto Dashboard
  </h1>

  {/* Darkmode-Schalter rechts oben */}
  <button
    onClick={() => setDarkMode(!darkMode)}
    className={`absolute right-0 top-0 p-2 rounded-full transition ${
      darkMode
        ? "bg-gray-800 hover:bg-gray-700 text-yellow-400"
        : "bg-gray-200 hover:bg-gray-300 text-blue-600"
    }`}
  >
    {darkMode ? "☀️" : "🌙"}
  </button>
</header>


      <p className="text-center text-gray-400 mb-6">
        Marktüberblick – {new Date().toLocaleDateString("de-DE")}
      </p>

      {/* 🔍 Suchfeld */}
      <div className="flex justify-center mb-10">
        <input
          type="text"
          placeholder="Suche nach Coin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full max-w-md p-3 rounded-lg border focus:outline-none transition ${
            darkMode
              ? "bg-gray-800 text-gray-200 border-gray-700 focus:border-green-400"
              : "bg-white text-gray-800 border-gray-300 focus:border-blue-400"
          }`}
        />
      </div>

      {/* 🪙 Haupt-Coins */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 px-2">
        {filteredCoins.slice(0, 3).map((coin) => (
          <div
            key={coin.id}
            onClick={() => loadChart(coin.id)}
            className={`rounded-xl p-6 shadow-md cursor-pointer transition-all duration-300 ${
              darkMode
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-white hover:bg-gray-100"
            } ${expandedCoin === coin.id ? "scale-105" : ""}`}
          >
            <div className="text-center">
              <img
                src={coin.image}
                alt={coin.name}
                className="w-16 h-16 mx-auto mb-4"
              />
              <h2 className="text-xl font-semibold">{coin.name}</h2>
              <p className="text-gray-400">{coin.symbol.toUpperCase()}</p>
              <p className="text-2xl font-bold mt-2">
                ${coin.current_price.toLocaleString()}
              </p>
              <p
                className={`mt-1 ${
                  coin.price_change_percentage_24h >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {coin.price_change_percentage_24h?.toFixed(2)}%
              </p>
            </div>

            {/* 📈 Mini-Chart */}
            {expandedCoin === coin.id && chartData[coin.id] && (
              <div className="mt-4">
                <Line
                  data={chartData[coin.id]}
                  options={{
                    plugins: { legend: false },
                    scales: { y: { display: false }, x: { display: false } },
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </section>

      {/* 🏆 Top Gainers & Losers */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div
          className={`rounded-2xl p-6 shadow-md ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h3
            className={`text-2xl font-semibold mb-4 text-center ${
              darkMode ? "text-green-400" : "text-green-600"
            }`}
          >
            🚀 Top Gainers
          </h3>
          {topGainers.map((coin) => (
            <div
              key={coin.id}
              className="flex justify-between items-center border-b border-gray-700 py-2"
            >
              <div className="flex items-center gap-3">
                <img src={coin.image} alt={coin.name} className="w-6 h-6" />
                <p>{coin.name}</p>
              </div>
              <p className="text-green-400 font-semibold">
                +{coin.price_change_percentage_24h?.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>

        <div
          className={`rounded-2xl p-6 shadow-md ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h3
            className={`text-2xl font-semibold mb-4 text-center ${
              darkMode ? "text-red-400" : "text-red-600"
            }`}
          >
            📉 Top Losers
          </h3>
          {topLosers.map((coin) => (
            <div
              key={coin.id}
              className="flex justify-between items-center border-b border-gray-700 py-2"
            >
              <div className="flex items-center gap-3">
                <img src={coin.image} alt={coin.name} className="w-6 h-6" />
                <p>{coin.name}</p>
              </div>
              <p className="text-red-400 font-semibold">
                {coin.price_change_percentage_24h?.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 📰 Crypto-News */}
      <section
        className={`rounded-2xl p-6 shadow-md mb-12 ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h3 className="text-2xl font-semibold mb-4 text-center">
          📰 Aktuelle Crypto-News
        </h3>
        {news.length > 0 ? (
          news.map((item, index) => (
            <div
              key={index}
              className="border-b border-gray-700 pb-3 mb-3 last:border-none last:pb-0"
            >
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-medium ${
                  darkMode
                    ? "text-green-400 hover:text-green-300"
                    : "text-blue-600 hover:text-blue-500"
                }`}
              >
                {item.title}
              </a>
              <p className="text-gray-400 text-sm mt-1">
                Quelle: {item.source?.title || "unbekannt"} —{" "}
                {new Date(item.date).toLocaleDateString("de-DE")}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center">
            Lade aktuelle Nachrichten...
          </p>
        )}
      </section>

      <footer className="text-center text-gray-500 mt-10 text-sm">
        Datenquelle: CoinGecko & CoinStats API | © 2025 Crypto Tracker
      </footer>
    </div>
  );
}
