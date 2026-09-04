import axios from "axios";

/*
|--------------------------------------------------------------------------
| API BASE URL
|--------------------------------------------------------------------------
*/

const configuredApiUrl = String(
  import.meta.env.VITE_API_URL || "",
).trim();

let apiBaseUrl: string;

if (configuredApiUrl) {
  apiBaseUrl = configuredApiUrl.replace(/\/$/, "");
} else if (import.meta.env.DEV) {
  apiBaseUrl = "http://127.0.0.1:8000";
} else {
  console.error(
    "VITE_API_URL is not configured in production.",
  );

  apiBaseUrl = window.location.origin;
}

/*
|--------------------------------------------------------------------------
| Axios Instance
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Interview question generation and AI answer evaluation can take
| longer than normal API requests.
|
| 2 minutes gives the backend enough time to:
| - send the request to OpenAI
| - process a large resume
| - generate up to 20 questions
| - receive the JSON response
| - save the interview session
|
*/

const api = axios.create({
  baseURL: apiBaseUrl,

  // Increased from 30 seconds to 2 minutes.
  timeout: 120_000,

  headers: {
    Accept: "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      window.dispatchEvent(
        new Event("critiqon:session-expired"),
      );
    }

    return Promise.reject(error);
  },
);

/*
|--------------------------------------------------------------------------
| API ERROR MESSAGE
|--------------------------------------------------------------------------
*/

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    /*
    |--------------------------------------------------------------------------
    | FastAPI string error
    |--------------------------------------------------------------------------
    */

    if (
      typeof detail === "string" &&
      detail.trim()
    ) {
      return detail;
    }

    /*
    |--------------------------------------------------------------------------
    | Object error
    |--------------------------------------------------------------------------
    */

    if (
      detail &&
      typeof detail === "object" &&
      typeof detail.message === "string"
    ) {
      return detail.message;
    }

    /*
    |--------------------------------------------------------------------------
    | FastAPI validation errors
    |--------------------------------------------------------------------------
    */

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (
            item &&
            typeof item === "object" &&
            "msg" in item &&
            typeof item.msg === "string"
          ) {
            return item.msg;
          }

          return null;
        })
        .filter(
          (
            message,
          ): message is string =>
            Boolean(message),
        );

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }

    /*
    |--------------------------------------------------------------------------
    | QUESTION LIMIT
    |--------------------------------------------------------------------------
    */

    if (
      detail &&
      typeof detail === "object" &&
      detail.code === "QUESTION_LIMIT"
    ) {
      const plan =
        typeof detail.current_plan === "string"
          ? detail.current_plan
          : "current";

      const limit =
        typeof detail.limit === "number"
          ? detail.limit
          : 10;

      return (
        `Your ${plan} plan allows up to ` +
        `${limit} interview questions per session.`
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Status-specific messages
    |--------------------------------------------------------------------------
    */

    if (error.response?.status === 400) {
      return "The information provided is invalid.";
    }

    if (error.response?.status === 401) {
      return "Your session is invalid. Please sign in again.";
    }

    if (error.response?.status === 403) {
      return "You do not have permission to perform this action.";
    }

    if (error.response?.status === 404) {
      return "The requested resource was not found.";
    }

    if (error.response?.status === 409) {
      return "This information already exists.";
    }

    if (error.response?.status === 413) {
      return "The uploaded file is too large. Maximum size is 10 MB.";
    }

    if (error.response?.status === 422) {
      return "The uploaded file could not be processed. Please select a valid PDF and try again.";
    }

    if (error.response?.status === 429) {
      return "Too many requests. Please wait a moment and try again.";
    }

    if (
      error.response?.status &&
      error.response.status >= 500
    ) {
      return "The server is temporarily unavailable. Please try again shortly.";
    }

    /*
    |--------------------------------------------------------------------------
    | TIMEOUT
    |--------------------------------------------------------------------------
    */

    if (
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT"
    ) {
      return (
        "The AI is taking longer than expected to generate the interview. " +
        "Please try again. Large 20-question interviews may take a little longer."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | NETWORK ERROR
    |--------------------------------------------------------------------------
    */

    if (!error.response) {
      return (
        "Unable to reach the server. " +
        "Make sure the backend is running."
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | NORMAL JAVASCRIPT ERROR
  |--------------------------------------------------------------------------
    */

  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}

export default api;