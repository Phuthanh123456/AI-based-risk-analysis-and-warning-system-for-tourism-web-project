import { useState } from "react";
import { apiPost } from "../api";
import AuthLayout from "../tourism/AuthLayout";

export function RegisterScreen({ onRegister, onBack, onGoToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  async function handleSubmit(event) {
    event.preventDefault(); setErr("");
    if (password !== confirmPassword) { setErr("Mật khẩu xác nhận không khớp."); return; }
    if (!email.trim() || !password.trim()) { setErr("Vui lòng điền đủ thông tin."); return; }
    setLoading(true);
    try { const data = await apiPost("/api/auth/register", { email: email.trim(), password }); onRegister({ email: data.user.email, token: data.token }); }
    catch (reason) { setErr(reason.message || "Đăng ký thất bại."); }
    finally { setLoading(false); }
  }
  return <AuthLayout title="Bắt đầu hành trình." subtitle="Tạo tài khoản để lưu những lần tra cứu và chủ động theo dõi điều kiện tại điểm đến." onBack={onBack}>
    <form className="auth-form" onSubmit={handleSubmit} aria-busy={loading}>
      <label className="auth-field" htmlFor="register-email">Email<input id="register-email" name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <label className="auth-field" htmlFor="register-password">Mật khẩu<input id="register-password" name="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      <label className="auth-field" htmlFor="register-confirm">Xác nhận mật khẩu<input id="register-confirm" name="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>
      {err && <div className="auth-error" role="alert">{err}</div>}
      <button className="tour-button tour-button-blue" type="submit" disabled={loading}>{loading ? "Đang tạo tài khoản…" : "Tạo tài khoản"}</button>
    </form><p className="auth-switch">Đã có tài khoản? <button onClick={onGoToLogin}>Đăng nhập</button></p>
  </AuthLayout>;
}
