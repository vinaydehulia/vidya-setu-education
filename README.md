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
2. In the linked Google Cloud project, enable the BigQuery API and create a dataset. The function and dataset should be in the same project. Create the `vse_feedback_table` table in the `vse_bq_dataset` dataset with this schema:

   ```sql
   CREATE TABLE `vidya-setu-education.vse_bq_dataset.vse_feedback_table` (
     id STRING,
     name STRING,
     sirname STRING,
     phone_no STRING,
     email_id STRING,
     Query STRING,
     Time TIMESTAMP
   );
   ```

   The function writes the form's first name, surname, phone, and signed-in email to their matching columns. It combines the selected program and optional message into `Query`, and stores the submission timestamp in `Time`. BigQuery stores `TIMESTAMP` as an absolute instant; to display it in IST, use `FORMAT_TIMESTAMP('%F %T', Time, 'Asia/Kolkata')`. If using a different project or dataset, adjust the table identifier and the `BIGQUERY_DATASET` function parameter.
3. Grant the deployed function's runtime service account the **BigQuery Data Editor** role on the dataset and **BigQuery Job User** role on the project. Gen 2 functions use a runtime service account; check the function's runtime settings in Google Cloud Console to confirm which account is in use. The admin page is visible to `neelam.dehulia@gmail.com` and loads up to the latest 50 enquiries ordered by `Time` newest first; the callable function also checks this verified email on the server before reading BigQuery.
4. Using Node.js 22 and the Firebase CLI, install the function dependencies and deploy the site and function:

   ```sh
   cd functions
   npm install
   cd ..
   firebase deploy --only hosting,functions
   ```

   On first deployment, provide your dataset ID when prompted for `BIGQUERY_DATASET`.
5. Test on the Firebase Hosting URL by signing in with Google, completing the enquiry form, and confirming the row appears in `vse_bq_dataset.vse_feedback_table`.

Serving the site from a plain local static server does not provide the Firebase reserved SDK initialization endpoints or a deployed function, so form submissions require Firebase Hosting and the deployed backend.

## Deploy automatically from GitHub

The GitHub Actions workflow deploys to the live Firebase Hosting channel whenever a change is pushed to the `main` branch.

1. In the Firebase console, open **Project settings > Service accounts** for the `vidya-setu-education` project and generate a private key for a service account with Firebase Hosting deployment permissions.
2. In the GitHub repository, open **Settings > Secrets and variables > Actions** and add a repository secret named `FIREBASE_SERVICE_ACCOUNT_VIDYA_SETU_EDUCATION`. Set its value to the full contents of the downloaded service-account JSON file. Keep this key private and do not commit it to the repository.
3. Push a change to `main`. Check the **Actions** tab in GitHub to see the deployment status.

## Deploy Cloud Functions from GitHub Actions

The `Deploy Firebase Functions` workflow deploys functions only when a push to `main` changes `functions/**`, `firebase.json`, or the workflow itself. It installs dependencies from the committed lockfile and deploys with Node.js 22.

1. Create a deployer service account in the linked Google Cloud project. Grant it the permissions needed to deploy 2nd-gen Cloud Functions, including Cloud Functions Admin and Cloud Build Editor. Grant **Service Account User** (`roles/iam.serviceAccountUser`) to the deployer account on each service account it must act as. In particular, this workflow requires that role on the App Engine default service account, `vidya-setu-education@appspot.gserviceaccount.com`; grant it through **IAM & Admin > Service Accounts > `vidya-setu-education@appspot.gserviceaccount.com` > Permissions > Grant access**, using the deployer service account as the principal. Depending on the project's IAM setup, deployment can also require Cloud Run and Artifact Registry permissions.
2. Create a JSON key for that deployer account and add its full contents as the GitHub Actions repository secret `FIREBASE_FUNCTIONS_SERVICE_ACCOUNT_VIDYA_SETU_EDUCATION`. Keep the key private. This secret is separate from the Hosting deploy secret above.
3. The workflow configures `BIGQUERY_DATASET=vse_bq_dataset` in a temporary project-specific Functions environment file during deployment. If you rename the dataset, update this value in `.github/workflows/firebase-functions-deploy.yml`; the dataset ID is configuration, not a secret.
4. Push a function-related change to `main` and check the **Actions** tab for the deployment result.
