
const apiKey = "513ba87c99fa4dbda65140408252910";
const baseUrl = "https://api.weatherapi.com/v1";
let days = 5;

const cityInput = document.getElementById("cityInput");
const suggestions = document.getElementById("suggestions");
const hourlyScroll = document.getElementById("hourlyScroll");
const cityNameText = document.getElementById("cityNameText");
const favStar = document.getElementById("favStar");
const overlayFavorite = document.getElementById("overlay-favorite");
const cityDegreeEl = document.querySelector(".cityDegree");
const cityDescEl = document.querySelector(".cityDescription");
const cityViewImg = document.querySelector(".cityView img");
const feelsLikeEl = document.querySelector(".feelsLike");

let currentCity = "";
const UNIT_STORAGE_KEY = "weather.units.v1";
const TOGGLE_STORAGE_KEY = "weatherToggleSettings.v1";
let unitSystem = localStorage.getItem(UNIT_STORAGE_KEY) || "metric";
let lastWeatherData = null;

// Javascript til enheder
const U = {
  temp: (c, f) => unitSystem === "imperial" ? Math.round(f) : Math.round(c),
  windText: (kph, mph) =>
    unitSystem === "imperial" ? `${mph.toFixed(1)} mph` : `${(kph / 3.6).toFixed(1)} m/s`,
  precipText: (mm, inch) =>
    unitSystem === "imperial" ? `${inch.toFixed(2)} in` : `${mm} mm`,
  visText: (km, miles) =>
    unitSystem === "imperial" ? `${miles} miles` : `${km} km`,
  deg: () => (unitSystem === "imperial" ? "°F" : "°C"),
};

// Søgefunktion
if (cityInput) {
  cityInput.addEventListener("input", () => {
    const query = cityInput.value.trim();
    getSuggestions(query);
  });
}
async function getSuggestions(query) {
  if (!suggestions) return;
  suggestions.innerHTML = "";
  if (query.length < 2) {
    suggestions.style.display = "none";
    return;
  }
  try {
    const res = await fetch(`${baseUrl}/search.json?key=${apiKey}&q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) {
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

// Fetch funktion til at hente vejret
async function getWeather(locationQuery) {
  try {
    const response = await fetch(
      `${baseUrl}/forecast.json?key=${apiKey}&q=${locationQuery}&days=${days}&aqi=no&alerts=no&lang=da`
    );
    if (!response.ok) throw new Error("By ikke fundet");
    const data = await response.json();
    lastWeatherData = data;
    currentCity = data?.location?.name || ""; 
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
  updateFavStar();
}

// Vis dagens vejr
function showWeatherToday(data) {
  const { location, current, forecast } = data;
  if (cityNameText) cityNameText.textContent = location.name;
  if (cityDegreeEl) {
    cityDegreeEl.textContent = `${U.temp(current.temp_c, current.temp_f)}${U.deg()}`;
  }
  if (feelsLikeEl) {
    feelsLikeEl.textContent = `Føles som ${U.temp(current.feelslike_c, current.feelslike_f)}${U.deg()}`;
  }
  if (cityDescEl) cityDescEl.textContent = current.condition.text;
  if (cityViewImg) {
    cityViewImg.src = `https:${current.condition.icon}`;
    cityViewImg.alt = current.condition.text;
  }

  // Time for time
  if (!hourlyScroll) return;
  hourlyScroll.innerHTML = "";
  const hours = forecast?.forecastday?.[0]?.hour || [];
  const currentHour = new Date(location.localtime).getHours();
  const upcomingHours = hours.filter(h => new Date(h.time).getHours() >= currentHour);
  upcomingHours.forEach((hourData, index) => {
    const time = new Date(hourData.time).getHours();
    const div = document.createElement("div");
    div.classList.add("hourCard");
    div.innerHTML = `
      <p>${index === 0 ? "Nu" : `${time}:00`}</p>
      <img src="https:${hourData.condition.icon}" alt="${hourData.condition.text}">
      <p>${U.temp(hourData.temp_c, hourData.temp_f)}${U.deg()}</p>
    `;
    if (index === 0) div.classList.add("active-hour");
    hourlyScroll.appendChild(div);
  });
}

// tøjanbefaling
function clothing(data) {
  const { current } = data;
  const clothingEl = document.querySelector(".clothingP");
  if (!clothingEl) return;

  let recommendation = "";

  
  if (current.temp_c < 5) recommendation = "Tag en tyk vinterjakke og vinterstøvler på.";
  else if (current.temp_c < 15) recommendation = "Tag en ekstra trøje med.";
  else if (current.temp_c < 20) recommendation = "Tag en let jakke på.";
  else recommendation = "Sommervejr, så på med solbriller og en t-shirt.";

  
  if (current.precip_mm > 0) {
    recommendation += " Husk regntøj / paraply!";
  }

  clothingEl.textContent = recommendation;
}

// Vis vejret de næste 5 dage
function showWeatherNextDays(data) {
  const { forecast } = data;
  const forecastEl = document.querySelector(".forecast");
  if (!forecastEl) return;
  forecastEl.innerHTML = "";
  (forecast?.forecastday || []).forEach((dayData, index) => {
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
      <p>${avgTemp}${U.deg()}</p>  <!-- tilføjet U.deg() -->
    `;
    forecastEl.appendChild(div);
  });
}

// Vejrdata kort
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
  if (solEl) solEl.textContent = forecast?.forecastday?.[0]?.astro?.sunset || "";
  if (sigtEl) sigtEl.textContent = U.visText(current.vis_km, current.vis_miles);
  if (luftEl) luftEl.textContent = current.humidity + " %";
}

// Favoritter
if (favStar) {
  favStar.addEventListener("click", () => {
    let favourites = JSON.parse(localStorage.getItem("favourites") || "[]");
    if (currentCity) {
      if (favourites.includes(currentCity)) {
        favourites = favourites.filter(c => c !== currentCity);
      } else {
        favourites.push(currentCity);
      }
      localStorage.setItem("favourites", JSON.stringify(favourites));
      updateFavStar();
      updateFavList();
    }
  });
}
function updateFavStar() {
  if (!favStar) return;
  const favourites = JSON.parse(localStorage.getItem("favourites") || "[]");
  if (currentCity && favourites.includes(currentCity)) {
    favStar.classList.add("active");
  } else {
    favStar.classList.remove("active");
  }
}
async function updateFavList() {
  if (!overlayFavorite) return;
  overlayFavorite.innerHTML = `<span class="material-symbols-outlined close-icon">close</span>`;
  overlayFavorite.querySelector(".close-icon").addEventListener("click", e => {
    const overlay = e.currentTarget.closest(".overlay-container");
    overlay?.classList.remove("show");
    document.body.classList.remove("no-scroll");
    document.querySelectorAll(".nav-icon.active").forEach(i => i.classList.remove("active"));
  });
  const favourites = JSON.parse(localStorage.getItem("favourites") || "[]");
  if (favourites.length === 0) {
    overlayFavorite.innerHTML += `<p style="padding: 1rem;">Ingen favoritter gemt</p>`;
    return;
  }
  for (const city of favourites) {
    try {
      const res = await fetch(`${baseUrl}/current.json?key=${apiKey}&q=${encodeURIComponent(city)}&lang=da`);
      const data = await res.json();
      const div = document.createElement("div");
      div.classList.add("favCityBox");
      div.innerHTML = `
        <span class="material-symbols-outlined ${favourites.includes(city) ? "active" : ""}">star</span>
        <p>${data.location.name}</p>
        <p>${U.temp(data.current.temp_c, data.current.temp_f)}${U.deg()}</p> <!-- brug helpers her -->
      `;
      const starSpan = div.querySelector("span");
      starSpan.addEventListener("click", () => {
        let favs = JSON.parse(localStorage.getItem("favourites") || "[]");
        favs = favs.filter(c => c !== city);
        localStorage.setItem("favourites", JSON.stringify(favs));
        updateFavList();
        updateFavStar();
      });
      div.addEventListener("click", e => {
        if (e.target !== starSpan) {
          getWeather(city);
          overlayFavorite.classList.remove("show");
          document.body.classList.remove("no-scroll");
        }
      });
      overlayFavorite.appendChild(div);
    } catch (err) {
      console.error(err);
    }
  }

  overlayFavorite.querySelectorAll(".close-icon").forEach(btn => {
    btn.addEventListener("click", e => {
      const overlay = e.currentTarget.closest(".overlay-container");
      overlay?.classList.remove("show");
      document.body.classList.remove("no-scroll");
      document.querySelectorAll(".nav-icon.active").forEach(i => i.classList.remove("active"));
    });
  });
}

// de 3 overlays fra menulinjen
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
    if (id === "overlay-favorite") updateFavList();
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

// Geolokation 
window.addEventListener("load", () => {
  const defaultCity = "Copenhagen";
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => getWeather(`${pos.coords.latitude},${pos.coords.longitude}`),
      () => getWeather(defaultCity)
    );
  } else {
    getWeather(defaultCity);
  }
});

// velkommen side og profil

// Hent gemt brugerprofil fra localStorage
let profile = JSON.parse(localStorage.getItem("userProfile") || "null");

// Henter elementer til velkommen overlay og formular
const welcomeOverlay = document.getElementById("welcomeOverlay");
const welcomeForm = document.getElementById("welcomeForm");

// Hvis der ikke findes en oprettet profil, viser den overlay
if (welcomeOverlay && !profile) {
  welcomeOverlay.style.display = "flex";
  // Når brugeren udfylder forumlar og submitter forhindres overlay for at blive vist
  if (welcomeForm) {
    welcomeForm.addEventListener("submit", e => {
      e.preventDefault();
      // Henter navn og køn fra inputfelterne
      const name = document.getElementById("name").value.trim();
      const gender = document.getElementById("genderSelect").value;
      // Hvis begge felter bliver udfyldt, gemmes profil i localstorage
      if (name && gender) {
        localStorage.setItem("userProfile", JSON.stringify({ name, gender }));
        profile = { name, gender };
        welcomeOverlay.style.display = "none";
      }
    });
  }
}

// Profil
// Henter  profilformular elementerme
const profileForm = document.getElementById("profileForm");
const nameInput = document.getElementById("profileName");
const genderSelect = document.getElementById("profileGenderSelect");
// Hvis der findes en profil, vil den vise det i felterne
if (profileForm) {
  if (profile) {
    if (nameInput) nameInput.value = profile.name;
    if (genderSelect) genderSelect.value = profile.gender;
  }
  // Når brugeren gemmer ændringer
  profileForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = nameInput?.value.trim();
    const gender = genderSelect?.value;
    // Opdater profil i local storage
    if (name && gender) {
      localStorage.setItem("userProfile", JSON.stringify({ name, gender }));
      profile = { name, gender };
      alert("Ændringer gemt!");
    }
  });
}
// Overvåger overlay, så felterne bliver opdateret
const overlayProfile = document.getElementById("overlay-profile");
if (overlayProfile) {
  const observer = new MutationObserver(() => {
    if (overlayProfile.classList.contains("show")) {
      // Henter den opdaterede profil fra localstorage
      const currentProfile = JSON.parse(localStorage.getItem("userProfile") || "null");
      if (currentProfile) {
        if (nameInput) nameInput.value = currentProfile.name;
        if (genderSelect) genderSelect.value = currentProfile.gender;
      }
    }
  });
  observer.observe(overlayProfile, { attributes: true, attributeFilter: ["class"] });
}

// indstillingstoggle og enhedsvælger
document.addEventListener("DOMContentLoaded", () => {
  const unitSelect = document.getElementById("unitSelect");
  if (unitSelect) {
    unitSelect.value = unitSystem;
    unitSelect.addEventListener("change", () => {
      unitSystem = unitSelect.value;
      localStorage.setItem(UNIT_STORAGE_KEY, unitSystem);
      if (lastWeatherData) renderAll(lastWeatherData); 
    });
  }

  const toggles = document.querySelectorAll(".data-settings .dataStyle");
  const savedToggleState = loadSavedToggleState();
  toggles.forEach(toggle => {
    const id = toggle.id;
    const cb = toggle.querySelector("input[type='checkbox']");
    if (!id || !cb) return;
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