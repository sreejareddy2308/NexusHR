import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import "./AuthPages.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to process request.");
        return;
      }

      setMessage(data.message);
    } catch (error) {
      console.error("Forgot password error:", error);
      setMessage("Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1><span>Nexus</span>HR</h1>

        <p className="auth-subtitle">
          AI-Enabled Enterprise HR & Workforce Intelligence
        </p>

        <h2>Forgot password?</h2>

        <p>
          Enter your registered email address to recover your account.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="recoveryEmail">Email address</label>

          <input
            id="recoveryEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email"
            autoComplete="email"
            required
          />

          {message && <p role="status">{message}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="auth-footer">
          Remember your password? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}