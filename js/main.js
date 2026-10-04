const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#site-navigation");
const year = document.querySelector("#current-year");
const galleryGrid = document.querySelector("#gallery-grid");
const enquiryForm = document.querySelector("#enquiry-form");
const enquiryEmail = document.querySelector("#enquiry-email");
const enquiryAuthStatus = document.querySelector("#enquiry-auth-status");
const googleSignIn = document.querySelector("#google-sign-in");
const googleSignOut = document.querySelector("#google-sign-out");
const enquirySubmit = document.querySelector("#enquiry-submit");
const enquiryResult = document.querySelector("#enquiry-result");

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

function setEnquiryResult(message, state) {
  if (!(enquiryResult instanceof HTMLElement)) {
    return;
  }

  enquiryResult.textContent = message;
  enquiryResult.dataset.state = state;
}

function normalizePhoneNumber(value) {
  return value.replace(/[\s().-]/g, "");
}

function isValidPhoneNumber(value) {
  return /^\+?[1-9]\d{7,14}$/.test(normalizePhoneNumber(value));
}

async function initializeEnquiryForm() {
  if (
    !(enquiryForm instanceof HTMLFormElement) ||
    !(enquiryEmail instanceof HTMLInputElement) ||
    !(enquiryAuthStatus instanceof HTMLElement) ||
    !(googleSignIn instanceof HTMLButtonElement) ||
    !(googleSignOut instanceof HTMLButtonElement) ||
    !(enquirySubmit instanceof HTMLButtonElement)
  ) {
    return;
  }

  if (!window.firebase?.auth || !window.firebase?.functions) {
    enquiryAuthStatus.textContent = "Sign-in is unavailable. Please try again later.";
    console.error("Firebase Auth or Cloud Functions SDK did not load.");
    return;
  }

  const auth = window.firebase.auth();
  const submitFeedback = window.firebase.app().functions("us-central1").httpsCallable("submitFeedback");

  auth.onAuthStateChanged((user) => {
    const email = user?.email || "";
    enquiryEmail.value = email;
    enquiryEmail.disabled = !email;
    enquiryAuthStatus.textContent = email
      ? `Signed in as ${email}`
      : "Sign in with Google to prefill your email and send an enquiry.";
    googleSignIn.hidden = Boolean(email);
    googleSignOut.hidden = !email;
    enquirySubmit.disabled = !email;

    if (!email) {
      setEnquiryResult("", "");
    }
  }, (error) => {
    console.error("Could not read the Firebase Auth session.", error);
    enquiryAuthStatus.textContent = "Could not check your sign-in. Please reload the page.";
  });

  googleSignIn.addEventListener("click", async () => {
    googleSignIn.disabled = true;
    setEnquiryResult("", "");

    try {
      const provider = new window.firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
    } catch (error) {
      console.error("Google sign-in failed.", error);
      setEnquiryResult("Google sign-in failed. Please try again.", "error");
    } finally {
      googleSignIn.disabled = false;
    }
  });

  googleSignOut.addEventListener("click", async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Sign-out failed.", error);
      setEnquiryResult("Could not sign out. Please try again.", "error");
    }
  });

  const phoneInput = enquiryForm.elements.namedItem("phoneNumber");
  if (phoneInput instanceof HTMLInputElement) {
    phoneInput.addEventListener("input", () => {
      phoneInput.setCustomValidity(
        phoneInput.value === "" || isValidPhoneNumber(phoneInput.value)
          ? ""
          : "Enter a valid international phone number, including country code if needed."
      );
    });
  }

  enquiryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const user = auth.currentUser;

    if (!user?.email) {
      setEnquiryResult("Please sign in with Google before sending your enquiry.", "error");
      return;
    }

    if (!(phoneInput instanceof HTMLInputElement) || !isValidPhoneNumber(phoneInput.value)) {
      phoneInput?.setCustomValidity("Enter a valid international phone number, including country code if needed.");
      phoneInput?.reportValidity();
      return;
    }

    const formData = new FormData(enquiryForm);
    enquirySubmit.disabled = true;
    setEnquiryResult("Sending your enquiry…", "");

    try {
      await submitFeedback({
        firstName: formData.get("firstName"),
        surname: formData.get("surname"),
        phoneNumber: normalizePhoneNumber(phoneInput.value),
        program: formData.get("program"),
        feedback: formData.get("feedback"),
        consent: formData.get("consent") === "yes"
      });
      enquiryForm.reset();
      setEnquiryResult("Thank you. Your enquiry has been sent.", "success");
    } catch (error) {
      console.error("Enquiry submission failed.", error);
      setEnquiryResult("We could not send your enquiry. Please try again later.", "error");
    } finally {
      enquirySubmit.disabled = !auth.currentUser?.email;
    }
  });
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
initializeEnquiryForm();
