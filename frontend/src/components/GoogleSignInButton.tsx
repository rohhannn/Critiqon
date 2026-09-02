import { useEffect, useRef } from "react";

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

function GoogleSignInButton({
  onSuccess,
}: GoogleSignInButtonProps) {
  const buttonRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error(
        "Google Sign-In: VITE_GOOGLE_CLIENT_ID is missing."
      );
      return;
    }

    function renderGoogleButton() {
      if (
        !window.google ||
        !buttonRef.current
      ) {
        return;
      }

      buttonRef.current.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: clientId,

        callback: (response: any) => {
          console.log(
            "Google credential received:",
            response
          );

          if (!response?.credential) {
            console.error(
              "Google Sign-In: No credential received."
            );
            return;
          }

          onSuccess(
            response.credential
          );
        },
      });

      window.google.accounts.id.renderButton(
        buttonRef.current,
        {
          theme: "outline",
          size: "large",
          width: 350,
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
        }
      );
    }

    if (window.google) {
      renderGoogleButton();
      return;
    }

    const existingScript =
      document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        renderGoogleButton
      );

      return () => {
        existingScript.removeEventListener(
          "load",
          renderGoogleButton
        );
      };
    }

    const script =
      document.createElement("script");

    script.src =
      "https://accounts.google.com/gsi/client";

    script.async = true;
    script.defer = true;

    script.onload =
      renderGoogleButton;

    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [onSuccess]);

  return (
    <div className="google-signin-wrap">
      <div
        ref={buttonRef}
        className="google-signin-button"
      />
    </div>
  );
}

export default GoogleSignInButton;