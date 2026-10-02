# Vidya Setu Education website

A responsive static website for a teacher-training institute, built with plain HTML, CSS, and JavaScript. It does not need a build step.

## Run locally

Open `index.html` in a browser, or serve the `school-website` folder with any static file server.

## Project structure

```text
school-website/
├── index.html
├── firebase.json
├── css/
│   └── styles.css
├── js/
│   └── main.js
└── assets/
    ├── gallery/
    │   └── README.md
    └── images/
        ├── photo-01.JPG
        ├── photo-02.jpg.JPG
        ├── photo-03.jpg.JPG
        └── photo-04.jpg.JPG
```

## Add gallery photos

The gallery currently uses the four photos in `assets/images/`. Keep the filenames and letter case exactly as shown in the project tree, or update the matching `src` paths in `index.html`. Image paths are case-sensitive on the hosting server. Update each image's `alt` text in `index.html` to describe the photo. See `assets/gallery/README.md` for more guidance.

## Host on Google Cloud with Firebase Hosting

Firebase Hosting is a straightforward Google Cloud option for this static site. It provides HTTPS and a hosted `web.app` address; you can connect a custom domain afterward.

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/). It is backed by a Google Cloud project.
2. Install Node.js if it is not already installed, then install and sign in to the Firebase CLI:

   ```sh
   npm install -g firebase-tools
   firebase login
   ```

3. From this website folder, link your local site to the Firebase project:

   ```sh
   firebase use --add
   ```

   Select the project you created and choose an alias such as `default`.
4. Deploy the site:

   ```sh
   firebase deploy --only hosting
   ```

5. Open the `Hosting URL` printed by the command. To use your own domain, go to **Hosting** in the Firebase Console, choose **Add custom domain**, and follow the DNS verification steps.

The included `firebase.json` serves this folder as the static site. Add your photos before deploying so they appear in the live gallery. Replace the example contact email in `index.html` with your real address.
