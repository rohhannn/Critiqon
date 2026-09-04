export type AppNotification = {
  type: "success" | "error" | "info";
  title: string;
  message: string;
};


export function notify(
  notification: AppNotification,
) {
  window.dispatchEvent(
    new CustomEvent<AppNotification>(
      "critiqon:notification",
      {
        detail: notification,
      },
    ),
  );
}