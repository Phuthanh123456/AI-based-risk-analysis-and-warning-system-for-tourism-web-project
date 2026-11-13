import { useTranslate } from "../i18n/index.js";import { useState } from "react";
import { apiPost } from "../api";
import AuthLayout from "../tourism/AuthLayout";

export function LoginScreen({ onLogin, onBack, onGoToRegister }) {const translate = useTranslate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  async function handleSubmit(event) {
    event.preventDefault();setErr("");
    if (!email.trim() || !password.trim()) {setErr("Vui lòng nhập đầy đủ email và mật khẩu.");return;}
    setLoading(true);
    try {const data = await apiPost("/api/auth/login", { email: email.trim(), password });onLogin({ email: data.user.email, token: data.token });}
    catch (reason) {setErr(reason.message || "Sai email hoặc mật khẩu.");} finally
    {setLoading(false);}
  }
  return <AuthLayout title={translate("Chào mừng trở lại.")} subtitle="Đăng nhập để lên kế hoạch, xem nhận định chuyến đi và theo dõi những điểm đến của bạn." onBack={onBack}>
    <form className="auth-form" onSubmit={handleSubmit} aria-busy={loading}>
      <label className="auth-field" htmlFor="login-email">{translate("Email")}<input id="login-email" name={translate("email")} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <label className="auth-field" htmlFor="login-password">{translate("Mật khẩu")}<input id="login-password" name={translate("password")} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      {translate(err && <div className="auth-error" role="alert">{translate(err)}</div>)}
      <button className="tour-button tour-button-blue" type="submit" disabled={loading}>{translate(loading ? "Đang đăng nhập…" : "Đăng nhập và khám phá")}</button>
    </form><p className="auth-switch">{translate("Chưa có tài khoản? ")}<button onClick={onGoToRegister}>{translate("Đăng ký ngay")}</button></p>
  </AuthLayout>;
}
