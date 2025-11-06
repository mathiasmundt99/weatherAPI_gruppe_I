
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
    const icon = el.querySelector(".nav-icon");
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
