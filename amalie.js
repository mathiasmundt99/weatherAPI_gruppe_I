const apiKey = "513ba87c99fa4dbda65140408252910";
const baseUrl = "https://api.weatherapi.com/v1";
let days = 5;

// DOM-elementer 
const cityInput = document.getElementById("cityInput");
const suggestions = document.getElementById("suggestions");
const hourlyScroll = document.getElementById("hourlyScroll");
const cityNameText = document.getElementById("cityNameText");
const favStar = document.getElementById("favStar");
const overlayFavorite = document.getElementById("overlay-favorite");

let currentCity = "";

// ==== Autocomplete søgning ====
cityInput.addEventListener("input", () => {
  const query = cityInput.value.trim();
  getSuggestions(query);
});

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

    data.forEach(city => {
      const li = document.createElement("li");
      li.textContent = `${city.name}, ${city.country}`;
      li.onclick = () => {
        cityInput.value = city.name;
        suggestions.innerHTML = "";
        suggestions.style.display = "none";
        getWeather(city.name);
      };
      suggestions.appendChild(li);
    });
  } catch (err) {
    console.error("Fejl ved søgning:", err);
  }
}

// ==== Hent vejrdata ====
async function getWeather(locationQuery) {
  try {
    const response = await fetch(
      `${baseUrl}/forecast.json?key=${apiKey}&q=${locationQuery}&days=${days}&aqi=no&alerts=no&lang=da`
    );
    if (!response.ok) throw new Error("By ikke fundet");
    const data = await response.json();

    currentCity = data.location.name;

    showWeatherToday(data);
    clothing(data);
    showWeatherNextDays(data);
    weatherData(data);
    updateFavStar();
  } catch (error) {
    console.error(error);
  }
}

// ==== Vis dagens vejr ====
function showWeatherToday(data) {
  const { location, current, forecast } = data;

  cityNameText.textContent = location.name;
  document.querySelector(".cityDegree").textContent = `${Math.round(current.temp_c)}°`;
  document.querySelector(".cityDescription").textContent = current.condition.text;
  document.querySelector(".cityView img").src = `https:${current.condition.icon}`;
  document.querySelector(".cityView img").alt = current.condition.text;

  hourlyScroll.innerHTML = "";
  const hours = forecast.forecastday[0].hour;
  const currentHour = new Date().getHours();
  const upcomingHours = hours.filter(h => new Date(h.time).getHours() >= currentHour);

  upcomingHours.forEach((hourData, index) => {
    const time = new Date(hourData.time).getHours();
    const div = document.createElement("div");
    div.classList.add("hourCard");
    div.innerHTML = `
      <p>${index === 0 ? "Nu" : `${time}:00`}</p>
      <img src="https:${hourData.condition.icon}" alt="${hourData.condition.text}">
      <p>${Math.round(hourData.temp_c)}°</p>
    `;
    if (index === 0) div.classList.add("active-hour");
    hourlyScroll.appendChild(div);
  });
}

// ==== Tøj-anbefaling ====
function clothing(data) {
  const { current } = data;
  const clothingEl = document.querySelector(".clothingP");

  if (current.temp_c < 5) clothingEl.textContent = "Tag en tyk vinterjakke og vinterstøvler på";
  else if (current.temp_c < 15) clothingEl.textContent = "Tag en ekstra trøje med";
  else if (current.temp_c < 20) clothingEl.textContent = "Tag en let jakke på";
  else clothingEl.textContent = "Sommervejr, så på med solbriller og en t-shirt";
}

// ==== 5-dages forecast ====
function showWeatherNextDays(data) {
  const { forecast } = data;
  const forecastEl = document.querySelector(".forecast");
  forecastEl.innerHTML = "";

  forecast.forecastday.forEach((dayData, index) => {
    const date = new Date(dayData.date);
    const options = { day: "numeric", month: "long" };
    const dayLabel = index === 0 ? "I dag" : date.toLocaleDateString("da-DK", options);

    const div = document.createElement("div");
    div.classList.add("dayCard");
    if (index === 0) div.classList.add("active-day");

    div.innerHTML = `
      <p>${dayLabel}</p>
      <img src="https:${dayData.day.condition.icon}" alt="${dayData.day.condition.text}">
      <p>${Math.round(dayData.day.avgtemp_c)}°</p>
    `;
    forecastEl.appendChild(div);
  });
}

// ==== Ekstra vejrdata ====
function weatherData(data) {
  const { current, forecast } = data;
  document.querySelector(".uvData").textContent = current.uv;
  document.querySelector(".regnData").textContent = current.precip_mm + " mm";
  document.querySelector(".vindData").textContent = (current.wind_kph / 3.6).toFixed(1) + " m/s";
  document.querySelector(".solData").textContent = forecast.forecastday[0].astro.sunset;
  document.querySelector(".sigtData").textContent = current.vis_km + " km";
  document.querySelector(".luftData").textContent = current.humidity + " %";
}

// ==== Favorit-håndtering ====
favStar.addEventListener("click", () => {
  let favourites = JSON.parse(localStorage.getItem("favourites") || "[]");

  if (favourites.includes(currentCity)) {
    favourites = favourites.filter(c => c !== currentCity);
  } else {
    favourites.push(currentCity);
  }

  localStorage.setItem("favourites", JSON.stringify(favourites));
  updateFavStar();
  updateFavList();
});

function updateFavStar() {
  const favourites = JSON.parse(localStorage.getItem("favourites") || "[]");
  if (favourites.includes(currentCity)) {
    favStar.classList.add("active");
  } else {
    favStar.classList.remove("active");
  }
}

// ==== Favoritter overlay ====
async function updateFavList() {
  overlayFavorite.innerHTML = `<span class="material-symbols-outlined close-icon">close</span>`;
  const favourites = JSON.parse(localStorage.getItem("favourites") || "[]");

  if (favourites.length === 0) {
    overlayFavorite.innerHTML += `<p style="padding: 1rem;">Ingen favoritter gemt</p>`;
    return;
  }

  favourites.forEach(async city => {
    try {
      const res = await fetch(`${baseUrl}/current.json?key=${apiKey}&q=${encodeURIComponent(city)}&lang=da`);
      const data = await res.json();

      const div = document.createElement("div");
      div.classList.add("favCityBox");
      div.innerHTML = `
        <span class="material-symbols-outlined ${favourites.includes(city) ? "active" : ""}">star</span>
        <p>${data.location.name}</p>
        <p>${Math.round(data.current.temp_c)}°</p>
      `;

      // Klik på stjerne i overlay for at fjerne favorit
      const starSpan = div.querySelector("span");
      starSpan.addEventListener("click", () => {
        let favs = JSON.parse(localStorage.getItem("favourites") || "[]");
        favs = favs.filter(c => c !== city);
        localStorage.setItem("favourites", JSON.stringify(favs));
        updateFavList();
        updateFavStar();
      });

      // Klik på by for at hente vejr
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
  });

  overlayFavorite.querySelector(".close-icon").addEventListener("click", () => {
    overlayFavorite.classList.remove("show");
    document.body.classList.remove("no-scroll");
    document.querySelectorAll(".nav-icon.active").forEach(i => i.classList.remove("active"));
  });
}

// ==== Overlay funktion ====
function openOverlay(id, el) {
  const overlays = document.querySelectorAll(".overlay-container");
  const icons = document.querySelectorAll(".nav-link-wrapper .nav-icon");

  const current = document.getElementById(id);
  const isActive = current.classList.contains("show");

  overlays.forEach(o => o.classList.remove("show"));
  icons.forEach(i => i.classList.remove("active"));

  if (!isActive) {
    current.classList.add("show");
    document.body.classList.add("no-scroll");
    const icon = el?.querySelector(".nav-icon");
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

// ==== Geolokation ved load ====
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



// PROFIL og velkommen
// Hent eksisterende profil
let profile = JSON.parse(localStorage.getItem("userProfile") || "null");

// Velkommen-overlay
const welcomeOverlay = document.getElementById("welcomeOverlay");
const welcomeForm = document.getElementById("welcomeForm");

if (welcomeOverlay && !profile) {
  welcomeOverlay.style.display = "flex";

  welcomeForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const gender = document.getElementById("genderSelect").value;
    if (name && gender) {
      localStorage.setItem("userProfile", JSON.stringify({ name, gender }));
      profile = { name, gender };
      welcomeOverlay.style.display = "none";
    }
  });
}

// Mine oplysninger (overlay-profile)
const profileForm = document.getElementById("profileForm");
const nameInput = document.getElementById("profileName");
const genderSelect = document.getElementById("profileGenderSelect");

if (profileForm) {
  // Udfyld med gemte data hvis de findes
  if (profile) {
    nameInput.value = profile.name;
    genderSelect.value = profile.gender;
  }

  // Gem ændringer
  profileForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const gender = genderSelect.value;

    if (name && gender) {
      localStorage.setItem("userProfile", JSON.stringify({ name, gender }));
      profile = { name, gender };
      alert("Ændringer gemt!");
    }
  });
}

// Hver gang overlay-profile åbnes
const overlayProfile = document.getElementById("overlay-profile");
if (overlayProfile) {
  const observer = new MutationObserver(() => {
    if (overlayProfile.classList.contains("show")) {
      const currentProfile = JSON.parse(localStorage.getItem("userProfile") || "null");
      if (currentProfile) {
        nameInput.value = currentProfile.name;
        genderSelect.value = currentProfile.gender;
      }
    }
  });
  observer.observe(overlayProfile, { attributes: true, attributeFilter: ["class"] });
}
