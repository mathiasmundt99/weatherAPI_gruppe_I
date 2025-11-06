const apiKey = "513ba87c99fa4dbda65140408252910";
const baseUrl = "https://api.weatherapi.com/v1";

// Standard by og antal dage
let city = "Copenhagen";
let days = 5;

// Hent data fra vejr API
async function getWeather(locationQuery) {
  try {
    const response = await fetch(`${baseUrl}/forecast.json?key=${apiKey}&q=${locationQuery}&days=${days}&aqi=no&alerts=no&lang=da`);
    if (!response.ok) throw new Error("By ikke fundet");
    const data = await response.json();

    showWeatherToday(data);
    clothing(data);
    showWeatherNextDays(data);
    weatherData(data);
  } catch (error) {
    console.error(error);
  }
}

// Vis vejret i dag
function showWeatherToday(data) {
  const { location, current, forecast } = data;

  document.querySelector(".cityName").textContent = location.name;
  document.querySelector(".cityDegree").textContent = `${Math.round(current.temp_c)}°`;
  document.querySelector(".cityDescription").textContent = current.condition.text;
  document.querySelector(".cityView img").src = `https:${current.condition.icon}`;
  document.querySelector(".cityView img").alt = current.condition.text;

  const hourlyScroll = document.getElementById("hourlyScroll");
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

// Anbefalet tøjvalg
function clothing(data){
  const { current } = data;
  const clothingEl = document.querySelector(".clothingP");

  if (current.temp_c < 5) clothingEl.textContent = "Tag en tyk vinterjakke og vinterstøvler på";
  else if (current.temp_c < 15) clothingEl.textContent = "Tag en ekstra trøje med";
  else if (current.temp_c < 20) clothingEl.textContent = "Tag en let jakke på";
  else clothingEl.textContent = "Sommervejr, så på med solbriller og en t-shirt";
}

// Vis vejret de næste 5 dage
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

// Viser de 6 stykker vejrdata
function weatherData(data){
  const { current, forecast } = data;
  document.querySelector(".uvData").textContent = current.uv;
  document.querySelector(".regnData").textContent = current.precip_mm + " mm";
  document.querySelector(".vindData").textContent = (current.wind_kph / 3.6).toFixed(1) + " m/s";
  document.querySelector(".solData").textContent = forecast.forecastday[0].astro.sunset;
  document.querySelector(".sigtData").textContent = current.vis_km + " km";
  document.querySelector(".luftData").textContent = current.humidity + " %";
}

// Geo lokation
window.addEventListener("load", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
        getWeather(coords); 
      },
      err => {
        console.warn("Geolokation ikke tilgængelig, bruger standardbyen.");
        getWeather(city); 
      }
    );
  } else {
    console.warn("Geolokation understøttes ikke, bruger standardbyen.");
    getWeather(city);
  }
});
