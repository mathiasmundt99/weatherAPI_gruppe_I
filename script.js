
function openOverlay(id) {
  const overlays = document.querySelectorAll(".overlay-container");
  const current = document.getElementById(id);
  const isActive = current.classList.contains("show");

  overlays.forEach(o => o.classList.remove("show"));

  if (!isActive) current.classList.add("show");
}

const openProfile = () => openOverlay("overlay-profile");
const openFavorite = () => openOverlay("overlay-favorite");
const openSettings = () => openOverlay("overlay-settings");

document.querySelectorAll(".overlay-container .close-icon").forEach(btn => {
  btn.addEventListener("click", e => e.currentTarget.closest(".overlay-container").classList.remove("show"));
});
