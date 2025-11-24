import { useEffect, useState } from "react";

export default function Weather() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/weather/")
      .then((r) => r.json())
      .then(setWeather);
  }, []);

  if (!weather) return null;

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h2 className="text-lg font-semibold">Weather</h2>
      <p>{weather.city}</p>
      <p>{weather.temp}°C — {weather.condition}</p>
    </div>
  );
}
