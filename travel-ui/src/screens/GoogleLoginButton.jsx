import { useEffect, useRef, useState } from "react";
import { apiPost } from "../api";

import { useLanguage } from "../i18n/index.js";

let sdk;
function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!sdk) {
    sdk = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => { sdk = null; script.remove(); reject(new Error("Google sign-in unavailable")); };
      document.head.appendChild(script);
    });
  }
  return sdk;
}

export default function GoogleLoginButton({ onLogin, onError }) {
  const language = useLanguage();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const container = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  useEffect(() => {
    if (!clientId) return;
    let active = true;
    loadGoogle().then(() => {
      if (!active) return;
      const id = window.google.accounts.id;
      id.initialize({ client_id: clientId, callback: async ({ credential }) => {
        if (!active) return;
        try {
          const result = await apiPost("/api/auth/google", { credential });
          if (active) onLogin({ email: result.user.email, token: result.token });
        } catch (error) { if (active) onError(error.message); }
      } });
      container.current.replaceChildren();
      id.renderButton(container.current, { theme: "outline", size: "large", shape: "pill", text: "continue_with", locale: language });
      setReady(true);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [clientId, language, onLogin, onError]);
  const vi = language === "vi";
  return <section className="auth-google">
    {(!ready || failed) && <>
      <button type="button" disabled>{vi ? "Ti\u1ebfp t\u1ee5c v\u1edbi Google" : "Continue with Google"}</button>
      <small role="status">{clientId && !failed
        ? (vi ? "\u0110ang t\u1ea3i Google\u2026" : "Loading Google\u2026")
        : (vi ? "Google hi\u1ec7n ch\u01b0a kh\u1ea3 d\u1ee5ng. B\u1ea1n c\u00f3 th\u1ec3 d\u00f9ng email v\u00e0 m\u1eadt kh\u1ea9u." : "Google sign-in is currently unavailable. You can use email and password.")}</small>
    </>}
    <div ref={container} />
  </section>;
}
