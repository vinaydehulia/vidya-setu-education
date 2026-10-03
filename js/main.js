const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#site-navigation");
const year = document.querySelector("#current-year");
const galleryGrid = document.querySelector("#gallery-grid");

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

async function loadGallery() {
  if (!(galleryGrid instanceof HTMLElement)) {
    return;
  }

  try {
    const response = await fetch("assets/gallery-images.json");
    if (!response.ok) {
      throw new Error(`Gallery image list request failed: ${response.status}`);
    }

    const imageNames = await response.json();
    if (!Array.isArray(imageNames) || !imageNames.every((name) => (
      typeof name === "string" && /\.(jpe?g)$/i.test(name)
    ))) {
      throw new Error("Gallery image list has an invalid format");
    }

    if (imageNames.length === 0) {
      galleryGrid.textContent = "No gallery photos have been added yet.";
      return;
    }

    imageNames.forEach((name, index) => {
      const item = document.createElement("article");
      item.className = "gallery-item";

      const image = document.createElement("img");
      image.className = "gallery-image";
      image.alt = `Vidya Setu Education gallery photo: ${name}`;
      image.loading = "lazy";

      const placeholder = document.createElement("div");
      placeholder.className = "gallery-placeholder";

      const icon = document.createElement("span");
      icon.className = "gallery-placeholder-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = ["✳", "✦", "◒"][index % 3];

      const message = document.createElement("strong");
      message.textContent = "Loading photo";

      const filename = document.createElement("span");
      filename.textContent = name;

      placeholder.append(icon, message, filename);
      item.append(image, placeholder);
      galleryGrid.append(item);

      image.addEventListener("load", () => {
        item.classList.add("has-photo");
      });
      image.addEventListener("error", () => {
        message.textContent = "Photo could not be loaded";
      });
      image.src = `assets/images/${encodeURIComponent(name)}`;
    });
  } catch (error) {
    console.error("Could not load the gallery image list.", error);
    galleryGrid.textContent = "Gallery photos could not be loaded.";
  }
}

loadGallery();
