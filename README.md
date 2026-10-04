# Vidya Setu Education website

A responsive static website for a teacher-training institute, built with plain HTML, CSS, and JavaScript. It has no application build step; a small Node.js script generates the gallery image list.

The enquiry form uses Firebase Authentication and a Firebase callable Cloud Function to save enquiries to BigQuery. Its email address comes from the signed-in Google account; BigQuery credentials are only used by the function, never by the browser.

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
├── functions/
│   ├── index.js
│   └── package.json
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

## Set up enquiry submissions

The form requires a Firebase project with billing enabled: deploying Firebase Cloud Functions requires the Blaze plan, and BigQuery streaming inserts are not available in the no-billing sandbox/free tier. BigQuery storage and writes can incur usage-based charges. Review the Google Cloud pricing and quotas before enabling billing.

1. In Firebase Console, enable **Authentication > Sign-in method > Google**. Add the deployed Hosting domain (and any custom domain) to the authorized domains.
2. In the linked Google Cloud project, enable the BigQuery API and create a dataset. The function and dataset should be in the same project. Create the `user_feedback` table in that dataset with this schema:

   ```sql
   CREATE TABLE `PROJECT_ID.DATASET_ID.user_feedback` (
     submission_id STRING NOT NULL,
     full_name STRING NOT NULL,
     phone_number STRING NOT NULL,
     email STRING NOT NULL,
     program STRING NOT NULL,
     feedback STRING,
     consent_given BOOL NOT NULL,
     created_at TIMESTAMP NOT NULL
   );
   ```

   Replace `PROJECT_ID` and `DATASET_ID` with the linked Firebase project ID and your chosen BigQuery dataset ID. The dataset name is supplied as the `BIGQUERY_DATASET` parameter when the function is deployed.
3. Grant the deployed function's runtime service account the **BigQuery Data Editor** role on the dataset. Gen 2 functions use a runtime service account; check the function's runtime settings in Google Cloud Console to confirm which account is in use.
4. Using Node.js 22 and the Firebase CLI, install the function dependencies and deploy the site and function:

   ```sh
   cd functions
   npm install
   cd ..
   firebase deploy --only hosting,functions
   ```

   On first deployment, provide your dataset ID when prompted for `BIGQUERY_DATASET`.
5. Test on the Firebase Hosting URL by signing in with Google, completing the enquiry form, and confirming the row appears in `DATASET_ID.user_feedback`.

The existing GitHub Actions workflow deploys Hosting only. Deploy Cloud Functions with the Firebase CLI after changing `functions/`; CI deployment for functions needs separate setup and appropriate Google Cloud IAM permissions. Serving the site from a plain local static server does not provide the Firebase reserved SDK initialization endpoints or a deployed function, so form submissions require Firebase Hosting and the deployed backend.

## Deploy automatically from GitHub

The GitHub Actions workflow deploys to the live Firebase Hosting channel whenever a change is pushed to the `main` branch.

1. In the Firebase console, open **Project settings > Service accounts** for the `vidya-setu-education` project and generate a private key for a service account with Firebase Hosting deployment permissions.
2. In the GitHub repository, open **Settings > Secrets and variables > Actions** and add a repository secret named `FIREBASE_SERVICE_ACCOUNT_VIDYA_SETU_EDUCATION`. Set its value to the full contents of the downloaded service-account JSON file. Keep this key private and do not commit it to the repository.
3. Push a change to `main`. Check the **Actions** tab in GitHub to see the deployment status.
