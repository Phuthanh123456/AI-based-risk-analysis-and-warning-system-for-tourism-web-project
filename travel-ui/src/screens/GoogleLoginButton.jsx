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
    let observer;
    let buttonObserver;
    const timeout = window.setTimeout(() => { if (active) setFailed(true); }, 10000);
    loadGoogle().then(() => {
      if (!active) return;
      const id = window.google.accounts.id;
      id.initialize({ client_id: clientId, auto_select: false, button_auto_select: false, callback: async ({ credential }) => {
        if (!active) return;
        try {
          const result = await apiPost("/api/auth/google", { credential });
          if (active) onLogin({ email: result.user.email, token: result.token });
        } catch (error) { if (active) onError(error.message); }
      } });
      const host = container.current;
      buttonObserver = new MutationObserver(() => {
        if (!active || !host.querySelector("iframe")) return;
        window.clearTimeout(timeout);
        setFailed(false);
        setReady(true);
      });
      buttonObserver.observe(host, { childList: true, subtree: true });
      const render = () => {
        const width = Math.min(400, Math.floor(host.clientWidth));
        if (!active || !width || host.dataset.width === String(width)) return;
        try {
          host.replaceChildren();
          // Google only personalizes the large button. Keep the generic label.
          id.renderButton(host, { theme: "outline", size: "medium", shape: "pill", text: "signin_with", locale: language, width: String(width) });
          host.dataset.width = String(width);
        } catch {
          setFailed(true);
        }
      };
      delete host.dataset.width;
      render();
      observer = new ResizeObserver(render);
      observer.observe(host);
    }).catch(() => { if (active) setFailed(true); });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      observer?.disconnect();
      buttonObserver?.disconnect();
    };
  }, [clientId, language, onLogin, onError]);
  const vi = language === "vi";
  return <section className="auth-google">
    {(!ready || failed) && <>
      <button type="button" disabled>{vi ? "Đăng nhập bằng Google" : "Sign in with Google"}</button>
      <small role="status">{clientId && !failed
        ? (vi ? "\u0110ang t\u1ea3i Google\u2026" : "Loading Google\u2026")
        : (vi ? "Google hi\u1ec7n ch\u01b0a kh\u1ea3 d\u1ee5ng. B\u1ea1n c\u00f3 th\u1ec3 d\u00f9ng email v\u00e0 m\u1eadt kh\u1ea9u." : "Google sign-in is currently unavailable. You can use email and password.")}</small>
    </>}
    <div className="auth-google-slot">
      <div className="auth-google-mount" ref={container} />
    </div>
  </section>;
}
