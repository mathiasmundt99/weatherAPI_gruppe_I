const key = "513ba87c99fa4dbda65140408252910"; // din gyldige nøgle

// DOM elementer
const cityInput = document.getElementById("cityInput");
const suggestions = document.getElementById("suggestions");
const result = document.getElementById("result");

const uvBox = document.getElementById("uvBox");
const sunriseBox = document.getElementById("sunriseBox");
const sunsetBox = document.getElementById("sunsetBox");
const feelsBox = document.getElementById("feelsBox");
const windBox = document.getElementById("windBox");

const hourlyScroll = document.getElementById("hourlyScroll");

// Input event
cityInput.addEventListener("input", () => {
  const query = cityInput.value.trim();
  getSuggestions(query);
});

// Hent autocomplete forslag
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
async function getWeather(cityOrCoords) {
  result.textContent = "Henter vejr...";

  try {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${encodeURIComponent(cityOrCoords)}&days=8&aqi=no&alerts=no&lang=da`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      result.textContent = `Fejl: ${data.error.message}`;
      return;
    }

    const current = data.current;
    const forecast = data.forecast.forecastday;

    // Opdater de 4 store bokse
    uvBox.textContent = `UV: ${current.uv}`;
    sunriseBox.textContent = `Solopgang: ${forecast[0].astro.sunrise}`;
    sunsetBox.textContent = `Solnedgang: ${forecast[0].astro.sunset}`;
    feelsBox.textContent = `Føles som: ${current.feelslike_c}°C`;
    windBox.textContent = `Vindstyrke: ${current.wind_kph} km/t`;

    // Time-for-time prognose
   // Time-for-time prognose (kun temp + ikon)
// Time-for-time prognose (kun temp + ikon) fra nu
hourlyScroll.innerHTML = ""; // ryd tidligere bokse

const now = new Date(); 
const currentHour = now.getHours(); // 0-23

// Time-for-time prognose – næste 24 timer
hourlyScroll.innerHTML = ""; // ryd tidligere bokse

// Lav et array med alle timer fra i dag + i morgen
let allHours = [...forecast[0].hour];
if (forecast[1]) { // tjek om der er næste dag
  allHours = allHours.concat(forecast[1].hour);
}

// Tag kun næste 24 timer
let count = 0;
for (let i = 0; i < allHours.length && count < 24; i++) {
  const hourData = allHours[i];
  const hourTime = parseInt(hourData.time.split(" ")[1].split(":")[0]);
  // Beregn om vi skal vise denne time
  const show = (hourData.time.split(" ")[0] === forecast[0].date && hourTime >= currentHour)
              || hourData.time.split(" ")[0] === forecast[1]?.date
              || (forecast[1] && count > 0);
  if (show) {
    const displayTime = count === 0 ? "Nu" : hourTime;
    const box = document.createElement("div");
    box.className = "hourly-box";
    box.innerHTML = `
      <div><strong>${displayTime}</strong></div>
      <img src="https:${hourData.condition.icon}" alt="${hourData.condition.text}" />
      <div>${hourData.temp_c}°C</div>
    `;
    hourlyScroll.appendChild(box);
    count++;
  }
}




    // Aktuelt vejr + 8-dages forecast (tekst i #result)
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

    result.textContent = output;

  } catch (err) {
    result.textContent = `Fejl: ${err.message}`;
  }
}

// Geolokation – kald ved load
window.addEventListener("load", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const coords = `${position.coords.latitude},${position.coords.longitude}`;
        getWeather(coords);
      },
      err => {
        console.warn("Geolokation ikke tilgængelig, brug manuel søgning.");
      }
    );
  } else {
    console.warn("Geolokation understøttes ikke af denne browser.");
  }
});
