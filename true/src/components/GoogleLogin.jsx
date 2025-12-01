import React, { useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function GoogleLogin({ onLogin }) {
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      /* global google */
      google.accounts.id.initialize({
        client_id:
          "570177941128-fp09vk3gubd2gu62l7b4sd16prupc4qr.apps.googleusercontent.com",
        callback: handleCredentialResponse,
      });

      google.accounts.id.renderButton(document.getElementById("googleBtn"), {
        theme: "outline",
        size: "large",
        width: "100%",
        text: "continue_with",
        shape: "rectangular",
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response) => {
    const token = response.credential;

    try {
      const res = await fetch("http://127.0.0.1:8000/google/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        console.error("Google auth failed");
        return;
      }

      const data = await res.json();

      login(data.access, data.user); // your context login

      if (onLogin) onLogin(data.user);
    } catch (error) {
      console.error("Google auth error:", error);
    }
  };

  return (
    <div className="w-full">
      <div id="googleBtn" className="flex justify-center"></div>
    </div>
  );
}

export default GoogleLogin;
