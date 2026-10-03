# Vidya Setu Education website

A responsive static website for a teacher-training institute, built with plain HTML, CSS, and JavaScript. It has no application build step; a small Node.js script generates the gallery image list.

## Run locally

Generate the gallery image list and serve the `school-website` folder with any static file server:

```sh
node scripts/generate-gallery-manifest.js
```

## Project structure

```text
school-website/
├── index.html
├── firebase.json
├── assets/
│   ├── gallery-images.json
│   ├── gallery/
│   │   └── README.md
│   └── images/
│       └── ...
├── scripts/
│   └── generate-gallery-manifest.js
├── css/
│   └── styles.css
├── js/
│   └── main.js
```

## Add gallery photos

Add `.jpg`, `.jpeg`, `.JPG`, or `.JPEG` files to `assets/images/`. The gallery image list is generated automatically during GitHub deployments, so no HTML changes are needed. To include new photos when running locally, run `node scripts/generate-gallery-manifest.js` again before serving the site. See `assets/gallery/README.md` for more guidance.

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

## Deploy automatically from GitHub

The GitHub Actions workflow deploys to the live Firebase Hosting channel whenever a change is pushed to the `main` branch.

1. In the Firebase console, open **Project settings > Service accounts** for the `vidya-setu-education` project and generate a private key for a service account with Firebase Hosting deployment permissions.
2. In the GitHub repository, open **Settings > Secrets and variables > Actions** and add a repository secret named `FIREBASE_SERVICE_ACCOUNT_VIDYA_SETU_EDUCATION`. Set its value to the full contents of the downloaded service-account JSON file. Keep this key private and do not commit it to the repository.
3. Push a change to `main`. Check the **Actions** tab in GitHub to see the deployment status.
