const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#site-navigation");
const year = document.querySelector("#current-year");
const galleryImages = document.querySelectorAll(".gallery-image");

if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isExpanded));
    navigation.classList.toggle("is-open", !isExpanded);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuButton.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
    }
  });
}

if (year) {
  year.textContent = String(new Date().getFullYear());
}

galleryImages.forEach((image) => {
  const showPhoto = () => {
    if (image instanceof HTMLImageElement && image.naturalWidth > 0) {
      image.closest(".gallery-item")?.classList.add("has-photo");
    }
  };

  image.addEventListener("load", showPhoto);
  image.addEventListener("error", () => {
    const message = image.closest(".gallery-item")?.querySelector(".gallery-placeholder strong");
    if (message) {
      message.textContent = "Photo could not be loaded";
    }
  });
  showPhoto();
});
