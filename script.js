// function openProfile() {
//   document.getElementById("overlay-profile").classList.toggle("show");
// }
// function openFavorite() {
//   document.getElementById("overlay-favorite").classList.toggle("show");
// }
// function openSettings() {
//   document.getElementById("overlay-settings").classList.toggle("show");
// }
function openOverlay(id) {
  const overlays = document.querySelectorAll(".overlay-container");
  const current = document.getElementById(id);
  const isActive = current.classList.contains("show");

  // Luk alle overlays først
  overlays.forEach(o => o.classList.remove("show"));

  // Hvis det du klikkede på IKKE allerede var aktivt → åbn det
  if (!isActive) current.classList.add("show");
}

// shorthand wrappers (valgfrit)
const openProfile = () => openOverlay("overlay-profile");
const openFavorite = () => openOverlay("overlay-favorite");
const openSettings = () => openOverlay("overlay-settings");

document.querySelectorAll(".overlay-container .nav-icon").forEach(btn => {
  btn.addEventListener("click", e => e.currentTarget.closest(".overlay-container").classList.remove("show"));
});
