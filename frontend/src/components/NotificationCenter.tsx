import { useEffect, useState } from "react";
import type { AppNotification } from "../services/notifications";
import "./NotificationCenter.css";

export default function NotificationCenter() {
  const [items, setItems] = useState<
    (AppNotification & { id: number })[]
  >([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<AppNotification>;
      const item = { ...custom.detail, id: Date.now() + Math.random() };
      setItems((current) => [...current, item].slice(-3));
      window.setTimeout(() => {
        setItems((current) => current.filter((x) => x.id !== item.id));
      }, 5000);
    };

    window.addEventListener("critiqon:notification", handler);
    return () =>
      window.removeEventListener("critiqon:notification", handler);
  }, []);

  return (
    <div className="notification-stack" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`app-notification ${item.type}`}>
          <div>
            <strong>{item.title}</strong>
            <p>{item.message}</p>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() =>
              setItems((current) =>
                current.filter((x) => x.id !== item.id)
              )
            }
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
