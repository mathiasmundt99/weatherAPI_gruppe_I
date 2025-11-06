// ====== KONSTANTER & STATE ======
const apiKey = "513ba87c99fa4dbda65140408252910";
const baseUrl = "https://api.weatherapi.com/v1";

let city = "Copenhagen";
let days = 5;

// DOM
const cityInput = document.getElementById("cityInput");
const suggestions = document.getElementById("suggestions");
const hourlyScroll = document.getElementById("hourlyScroll");

// LocalStorage keys
const UNIT_STORAGE_KEY = "weather.units.v1";
const TOGGLE_STORAGE_KEY = "weatherToggleSettings.v1";

// Enheder (metric/imperial)
let unitSystem = localStorage.getItem(UNIT_STORAGE_KEY) || "metric";

// Sidst hentede vejrdata (så vi kan re-rendere ved enhedsskift)
let lastWeatherData = null;



// Enhedshjælpere
const U = {
  temp: (c, f) => unitSystem === "imperial" ? Math.round(f) : Math.round(c),
  windText: (kph, mph) => unitSystem === "imperial" ? `${mph.toFixed(1)} mph` : `${(kph/3.6).toFixed(1)} m/s`,
  precipText: (mm, inch) => unitSystem === "imperial" ? `${inch.toFixed(2)} in` : `${mm} mm`,
  visText: (km, miles) => unitSystem === "imperial" ? `${miles} miles` : `${km} km`,
  deg: () => unitSystem === "imperial" ? "°F" : "°C"
};

// ====== AUTOCOMPLETE ======
if (cityInput) {
  cityInput.addEventListener("input", () => {
    const query = cityInput.value.trim();
    getSuggestions(query);
  });
}

async function getSuggestions(query) {
  suggestions.innerHTML = "";
  if (query.length < 2) {
    suggestions.style.display = "none";
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/search.json?key=${apiKey}&q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!data.length) {
      suggestions.style.display = "none";
      return;
    }

    suggestions.style.display = "block";

    data.forEach(cityObj => {
      const li = document.createElement("li");
      li.textContent = `${cityObj.name}, ${cityObj.country}`;
      li.onclick = () => {
        cityInput.value = cityObj.name;
        suggestions.innerHTML = "";
        suggestions.style.display = "none";
        getWeather(cityObj.name);
      };
      suggestions.appendChild(li);
    });
  } catch (err) {
    console.error("Fejl ved søgning:", err);
  }
}

// ====== HENT & RENDER VEJR ======
async function getWeather(locationQuery) {
  try {
    const response = await fetch(
      `${baseUrl}/forecast.json?key=${apiKey}&q=${locationQuery}&days=${days}&aqi=no&alerts=no&lang=da`
    );
    if (!response.ok) throw new Error("By ikke fundet");
    const data = await response.json();

    lastWeatherData = data;
    renderAll(data);
  } catch (error) {
    console.error(error);
  }
}

function renderAll(data) {
  showWeatherToday(data);
  clothing(data);
  showWeatherNextDays(data);
  weatherData(data);
}

// I dag
function showWeatherToday(data) {
  const { location, current, forecast } = data;

  document.querySelector(".cityName").textContent = location.name;
  document.querySelector(".cityDegree").textContent = `${U.temp(current.temp_c, current.temp_f)}°`;
  document.querySelector(".cityDescription").textContent = current.condition.text;
  document.querySelector(".cityView img").src = `https:${current.condition.icon}`;
  document.querySelector(".cityView img").alt = current.condition.text;

  if (!hourlyScroll) return;
  hourlyScroll.innerHTML = "";

  const hours = forecast.forecastday[0].hour;
  const currentHour = new Date(location.localtime).getHours();
  const upcomingHours = hours.filter(h => new Date(h.time).getHours() >= currentHour);

  upcomingHours.forEach((hourData, index) => {
    const time = new Date(hourData.time).getHours();
    const div = document.createElement("div");
    div.classList.add("hourCard");
    div.innerHTML = `
      <p>${index === 0 ? "Nu" : `${time}:00`}</p>
      <img src="https:${hourData.condition.icon}" alt="${hourData.condition.text}">
      <p>${U.temp(hourData.temp_c, hourData.temp_f)}°</p>
    `;
    if (index === 0) div.classList.add("active-hour");
    hourlyScroll.appendChild(div);
  });
}

// Tøj-anbefaling (fast på °C)
function clothing(data) {
  const t = data.current.temp_c;
  const clothingEl = document.querySelector(".clothingP");

  if (!clothingEl) return;

  if (t < 5) clothingEl.textContent = "Tag en tyk vinterjakke og vinterstøvler på";
  else if (t < 15) clothingEl.textContent = "Tag en ekstra trøje med";
  else if (t < 20) clothingEl.textContent = "Tag en let jakke på";
  else clothingEl.textContent = "Sommervejr, så på med solbriller og en t-shirt";
}

// 5-dages
function showWeatherNextDays(data) {
  const { forecast } = data;
  const forecastEl = document.querySelector(".forecast");
  if (!forecastEl) return;

  forecastEl.innerHTML = "";

  forecast.forecastday.forEach((dayData, index) => {
    const date = new Date(dayData.date);
    const options = { day: "numeric", month: "long" };
    const dayLabel = index === 0 ? "I dag" : date.toLocaleDateString("da-DK", options);

    const div = document.createElement("div");
    div.classList.add("dayCard");
    if (index === 0) div.classList.add("active-day");

    const avgTemp = U.temp(dayData.day.avgtemp_c, dayData.day.avgtemp_f);

    div.innerHTML = `
      <p>${dayLabel}</p>
      <img src="https:${dayData.day.condition.icon}" alt="${dayData.day.condition.text}">
      <p>${avgTemp}°</p>
    `;
    forecastEl.appendChild(div);
  });
}

// Ekstra data
function weatherData(data) {
  const { current, forecast } = data;

  const uvEl = document.querySelector(".uvData");
  const regnEl = document.querySelector(".regnData");
  const vindEl = document.querySelector(".vindData");
  const solEl = document.querySelector(".solData");
  const sigtEl = document.querySelector(".sigtData");
  const luftEl = document.querySelector(".luftData");

  if (uvEl) uvEl.textContent = current.uv;
  if (regnEl) regnEl.textContent = U.precipText(current.precip_mm, current.precip_in);
  if (vindEl) vindEl.textContent = U.windText(current.wind_kph, current.wind_mph);
  if (solEl) solEl.textContent = forecast.forecastday[0].astro.sunset;
  if (sigtEl) sigtEl.textContent = U.visText(current.vis_km, current.vis_miles);
  if (luftEl) luftEl.textContent = current.humidity + " %";
}

// ====== GEOLOKATION VED LOAD ======
window.addEventListener("load", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
        getWeather(coords);
      },
      () => {
        console.warn("Geolokation ikke tilgængelig, bruger standardbyen.");
        getWeather(city);
      }
    );
  } else {
    console.warn("Geolokation understøttes ikke, bruger standardbyen.");
    getWeather(city);
  }
});

// ====== MENU / OVERLAYS ======
function openOverlay(id, el) {
  const overlays = document.querySelectorAll(".overlay-container");
  const icons = document.querySelectorAll(".nav-link-wrapper .nav-icon");

  const current = document.getElementById(id);
  const isActive = current && current.classList.contains("show");

  overlays.forEach(o => o.classList.remove("show"));
  icons.forEach(i => i.classList.remove("active"));

  if (current && !isActive) {
    current.classList.add("show");
    document.body.classList.add("no-scroll");
    const icon = el?.querySelector?.(".nav-icon");
    if (icon) icon.classList.add("active");
  }
}
const openProfile = () => openOverlay("overlay-profile");
const openFavorite = () => openOverlay("overlay-favorite");
const openSettings = () => openOverlay("overlay-settings");

document.querySelectorAll(".overlay-container .close-icon").forEach(btn => {
  btn.addEventListener("click", e => {
    const overlay = e.currentTarget.closest(".overlay-container");
    overlay.classList.remove("show");
    document.body.classList.remove("no-scroll");
    document.querySelectorAll(".nav-icon.active").forEach(i => i.classList.remove("active"));
  });
});

// ====== INIT DOM-KONTROLLER (toggles + enheder) ======
document.addEventListener("DOMContentLoaded", () => {
  // --- Enhedsvælger ---
  const unitSelect = document.getElementById("unitSelect");
  if (unitSelect) {
    unitSelect.value = unitSystem;
    unitSelect.addEventListener("change", () => {
      unitSystem = unitSelect.value;
      localStorage.setItem(UNIT_STORAGE_KEY, unitSystem);
      if (lastWeatherData) renderAll(lastWeatherData);
    });
  }

  // --- Toggle-visibility + persistens ---
  const toggles = document.querySelectorAll(".data-settings .dataStyle");
  const savedToggleState = loadSavedToggleState();

  toggles.forEach(toggle => {
    const id = toggle.id;
    const cb = toggle.querySelector("input[type='checkbox']");
    if (!id || !cb) return;

    // Sæt initial værdi fra storage hvis findes
    const initialChecked = savedToggleState.hasOwnProperty(id) ? !!savedToggleState[id] : !!cb.checked;
    cb.checked = initialChecked;
    updateTargetVisibility(id, initialChecked);

    cb.addEventListener("change", () => {
      updateTargetVisibility(id, cb.checked);
      const state = collectToggleState(toggles);
      saveToggleState(state);
    });
  });
});

// Hjælpere til toggles
function updateTargetVisibility(id, checked) {
  const target = document.querySelector(`.weatherData .${CSS.escape(id)}`);
  if (target) target.style.display = checked ? "block" : "none";
}
function collectToggleState(toggles) {
  const state = {};
  toggles.forEach(t => {
    const id = t.id;
    const cb = t.querySelector("input[type='checkbox']");
    if (id && cb) state[id] = !!cb.checked;
  });
  return state;
}
function loadSavedToggleState() {
  try {
    const raw = localStorage.getItem(TOGGLE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveToggleState(state) {
  try {
    localStorage.setItem(TOGGLE_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Kunne ikke gemme toggle-indstillinger:", e);
  }
}
