import { useEffect, useState } from "react";

const CATEGORIES = [
  { key: "Business", label: "Business" },
  { key: "Telugu", label: "Telugu" },
  { key: "Hindi", label: "Hindi" },
  { key: "Tamil", label: "Tamil" },
  { key: "Sports", label: "Sports" },
  { key: "Agriculture", label: "Agriculture" },
  { key: "World", label: "World" },
  { key: "India", label: "India" },
];

export default function NewsPage() {
  const [category, setCategory] = useState("Business");
  const [news, setNews] = useState([]);
  const [offset, setOffset] = useState(0);

  const fetchNews = async () => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/news/?category=${category}&offset=${offset}&limit=10`
      );
      const data = await res.json();

      const newItems = data.results ?? [];

      if (offset === 0) {
        setNews(newItems);
      } else {
        setNews((prev) => [...prev, ...newItems]);
      }
    } catch (err) {
      console.error("Error loading news:", err);
    }
  };

  useEffect(() => {
    fetchNews();
    const timer = setInterval(fetchNews, 30000);
    return () => clearInterval(timer);
  }, [category, offset]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 100
      ) {
        setOffset((o) => o + 10);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="p-4">
      {/* Category Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              setCategory(c.key);
              setOffset(0);
            }}
            className={`px-4 py-2 rounded-lg font-semibold ${
              category === c.key
                ? "bg-blue-600 text-white"
                : "bg-white border"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* News */}
      <div className="space-y-4">
        {news.map((item, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold">{item.title}</h2>
            <p className="text-gray-600">{item.summary}</p>

            {item.image && (
              <img
                src={item.image}
                className="w-full h-60 object-cover rounded mt-2"
                alt=""
              />
            )}

            <a
              href={item.link}
              target="_blank"
              className="text-blue-600 mt-2 inline-block"
            >
              Read more →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
