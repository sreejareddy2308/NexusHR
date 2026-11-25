import { useState, type FormEvent } from "react";
import "./AuthPages.css";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8 || password.length > 72) {
      setMessage("Password must contain 8 to 72 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: password,
          confirm: confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "Registration failed. Please try again."
        );
      }

      setMessage(
        "Registration successful! Please check your email for the account activation link."
      );

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server. Please try again."
      );
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

        <h2>Create your account</h2>
        <p>Register to get started with NexusHR.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            autoComplete="name"
            required
          />

          <label htmlFor="registerEmail">Email address</label>
          <input
            id="registerEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            required
          />

          <label htmlFor="registerPassword">Password</label>
          <input
            id="registerPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />

          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />

          {message && <p role="status">{message}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <a href="/">Login</a>
        </p>
      </section>
    </main>
  );
}

