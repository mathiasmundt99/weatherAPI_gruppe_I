const key = "513ba87c99fa4dbda65140408252910"; // din gyldige nøgle

const cityInput = document.getElementById("cityInput");
const suggestions = document.getElementById("suggestions");
const result = document.getElementById("result");

// Input event
cityInput.addEventListener("input", () => {
  const query = cityInput.value.trim();
  getSuggestions(query);
});

// Autocomplete forslag
async function getSuggestions(query) {
  suggestions.innerHTML = "";
  if (query.length < 2) return;

  try {
    const url = `https://api.weatherapi.com/v1/search.json?key=${key}&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();

    data.forEach(city => {
      const li = document.createElement("li");
      li.textContent = `${city.name}, ${city.country}`;
      li.onclick = () => {
        cityInput.value = city.name;
        suggestions.innerHTML = "";
        getWeather(city.name);
      };
      suggestions.appendChild(li);
    });
  } catch (err) {
    console.error("Fejl ved søgning:", err);
  }
}

// Hent vejr + forecast
async function getWeather(city) {
  result.textContent = "Henter vejr...";

  try {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${encodeURIComponent(city)}&days=8&aqi=no&alerts=no&lang=da`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      result.textContent = `Fejl: ${data.error.message}`;
      return;
    }

    const current = data.current;
    const forecast = data.forecast.forecastday;

    // Aktuelt vejr
    let output = `
${data.location.name}, ${data.location.country}
Temperatur: ${current.temp_c}°C (føles som ${current.feelslike_c}°C)
Vejr: ${current.condition.text}
UV-indeks: ${current.uv}
Vind: ${current.wind_kph} km/t
Solopgang: ${forecast[0].astro.sunrise}
Solnedgang: ${forecast[0].astro.sunset}
`;

    // 8-dages forecast
    output += "\n--- 8-dages forecast ---\n";
    forecast.forEach(day => {
      output += `
${day.date}:
  Max: ${day.day.maxtemp_c}°C, Min: ${day.day.mintemp_c}°C
  Føles som: ${day.day.avgtemp_c}°C
  Vejr: ${day.day.condition.text}
  UV-indeks: ${day.day.uv}
`;
    });

    // Time-for-time for første dag
    output += "\n--- Time-for-time vejr i dag ---\n";
    forecast[0].hour.forEach(hour => {
      const time = hour.time.split(" ")[1]; // hh:mm
      output += `${time}: ${hour.temp_c}°C (føles som ${hour.feelslike_c}°C), ${hour.condition.text}, Vind: ${hour.wind_kph} km/t, UV: ${hour.uv}\n`;
    });

    result.textContent = output;

  } catch (err) {
    result.textContent = `Fejl: ${err.message}`;
  }
}
