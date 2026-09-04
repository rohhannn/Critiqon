import {
  useEffect,
  useState,
} from "react";

import type {
  AppNotification,
} from "../services/notifications";

import "./NotificationCenter.css";


type NotificationItem =
  AppNotification & {
    id: number;
  };


export default function NotificationCenter() {

  const [
    items,
    setItems,
  ] = useState<NotificationItem[]>([]);


  useEffect(() => {

    function handleNotification(
      event: Event,
    ) {

      const customEvent =
        event as CustomEvent<AppNotification>;

      const notification =
        customEvent.detail;


      if (
        !notification ||
        !notification.title ||
        !notification.message
      ) {
        return;
      }


      const item: NotificationItem = {
        ...notification,
        id:
          Date.now() +
          Math.random(),
      };


      setItems(
        current => [
          ...current,
          item,
        ].slice(-3),
      );


      window.setTimeout(
        () => {
          setItems(
            current =>
              current.filter(
                existing =>
                  existing.id !==
                  item.id,
              ),
          );
        },
        5000,
      );
    }


    window.addEventListener(
      "critiqon:notification",
      handleNotification,
    );


    return () => {
      window.removeEventListener(
        "critiqon:notification",
        handleNotification,
      );
    };

  }, []);


  function dismiss(
    id: number,
  ) {
    setItems(
      current =>
        current.filter(
          item =>
            item.id !== id,
        ),
    );
  }


  return (
    <div
      className="notification-stack"
      aria-live="assertive"
      aria-atomic="false"
    >

      {items.map(
        item => (
          <div
            key={item.id}
            className={
              `app-notification ${item.type}`
            }
            role="alert"
          >

            <div className="notification-content">

              <strong>
                {item.title}
              </strong>

              <p>
                {item.message}
              </p>

            </div>


            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() =>
                dismiss(item.id)
              }
            >
              ×
            </button>

          </div>
        ),
      )}

    </div>
  );
}