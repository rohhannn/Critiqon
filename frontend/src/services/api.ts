import axios from "axios";

/*
|--------------------------------------------------------------------------
| API BASE URL
|--------------------------------------------------------------------------
|
| Development:
|   Uses VITE_API_URL if provided.
|   Otherwise defaults to http://127.0.0.1:8000
|
| Production:
|   VITE_API_URL MUST be configured.
|
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
| Do NOT set a global Content-Type here.
|
| JSON requests are handled automatically by Axios.
| FormData requests must be allowed to set their own
| multipart/form-data boundary.
|
*/

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30_000,
  headers: {
    Accept: "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
|
| Automatically attach the JWT to authenticated requests.
|
*/

api.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
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
|
| If the backend returns 401, tell AuthContext
| to clear the current session.
|
*/

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      window.dispatchEvent(
        new Event(
          "critiqon:session-expired",
        ),
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
  fallback =
    "Something went wrong. Please try again.",
): string {
  if (axios.isAxiosError(error)) {
    const detail =
      error.response?.data?.detail;

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

    if (
      Array.isArray(detail)
    ) {
      const messages =
        detail
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
    | Status-specific messages
    |--------------------------------------------------------------------------
    */

    if (
      error.response?.status === 400
    ) {
      return "The information provided is invalid.";
    }

    if (
      error.response?.status === 401
    ) {
      return "Your session is invalid. Please sign in again.";
    }

    if (
      error.response?.status === 403
    ) {
      return "You do not have permission to perform this action.";
    }

    if (
      error.response?.status === 404
    ) {
      return "The requested resource was not found.";
    }

    if (
      error.response?.status === 409
    ) {
      return "This information already exists.";
    }

    if (
      error.response?.status === 413
    ) {
      return "The uploaded file is too large. Maximum size is 10 MB.";
    }

    if (
      error.response?.status === 422
    ) {
      return "The uploaded file could not be processed. Please select a valid PDF and try again.";
    }

    if (
      error.response?.status === 429
    ) {
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
    | Network error
    |--------------------------------------------------------------------------
    */

    if (!error.response) {
      return "Unable to reach the server. Make sure the backend is running.";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Normal JavaScript Error
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