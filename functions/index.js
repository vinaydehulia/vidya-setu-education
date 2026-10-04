const { randomUUID } = require("node:crypto");
const { BigQuery } = require("@google-cloud/bigquery");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");

const bigQueryDataset = defineString("BIGQUERY_DATASET");
const bigQuery = new BigQuery({ projectId: "vidya-setu-education" });
const allowedPrograms = new Set([
  "teaching-foundations",
  "classroom-practice",
  "professional-growth",
  "other"
]);

function requireText(value, field, maxLength) {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `The ${field} field is required.`);
  }

  const text = value.trim();
  if (!text || text.length > maxLength) {
    throw new HttpsError("invalid-argument", `The ${field} field is invalid.`);
  }

  return text;
}

function validatePhoneNumber(value) {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", "A valid phone number is required.");
  }

  const phoneNumber = value.replace(/[\s().-]/g, "");
  if (!/^\+?[1-9]\d{7,14}$/.test(phoneNumber)) {
    throw new HttpsError("invalid-argument", "A valid international phone number is required.");
  }

  return phoneNumber;
}

exports.submitFeedback = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in before sending an enquiry.");
  }

  const email = request.auth.token.email;
  if (typeof email !== "string" || !email || request.auth.token.email_verified !== true) {
    throw new HttpsError("failed-precondition", "A verified email address is required.");
  }

  if (request.data?.consent !== true) {
    throw new HttpsError("failed-precondition", "Consent is required to submit an enquiry.");
  }

  const firstName = requireText(request.data?.firstName, "first name", 100);
  const surname = requireText(request.data?.surname, "surname", 100);
  const phoneNumber = validatePhoneNumber(request.data?.phoneNumber);
  const program = requireText(request.data?.program, "program", 40);
  if (!allowedPrograms.has(program)) {
    throw new HttpsError("invalid-argument", "Choose a valid program.");
  }

  const feedback = request.data?.feedback;
  if (feedback !== undefined && feedback !== null && typeof feedback !== "string") {
    throw new HttpsError("invalid-argument", "The feedback field is invalid.");
  }
  const message = typeof feedback === "string" ? feedback.trim() : "";
  if (message.length > 2000) {
    throw new HttpsError("invalid-argument", "The feedback field is too long.");
  }

  const datasetId = bigQueryDataset.value();
  if (!/^[A-Za-z0-9_]{1,1024}$/.test(datasetId)) {
    throw new HttpsError("failed-precondition", "The BigQuery dataset is not configured correctly.");
  }

  const submissionId = randomUUID();
  const query = [
    `Program of interest: ${program}`,
    message
  ].filter(Boolean).join("\n\n");
  const row = {
    id: submissionId,
    name: firstName,
    sirname: surname,
    phone_no: phoneNumber,
    email_id: email,
    Query: query
  };

  try {
    await bigQuery
      .dataset(datasetId)
      .table("vse_feedback_table")
      .insert(row);
  } catch (error) {
    const rowErrors = Array.isArray(error?.errors)
      ? error.errors.flatMap((rowError) => (
        Array.isArray(rowError.errors) ? rowError.errors : []
      ))
      : [];
    const insertErrors = rowErrors.map(({ reason, location, message: errorMessage }) => ({
      reason,
      location,
      message: errorMessage
    }));

    console.error("Could not write enquiry to BigQuery.", {
      code: error?.code,
      message: error?.message,
      insertErrors
    });
    throw new HttpsError("internal", "Your enquiry could not be saved. Please try again.");
  }

  return { success: true };
});
