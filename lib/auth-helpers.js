const AUTH_ERROR_MAP = [
  {
    match: "Invalid login credentials",
    message: "Email or password is incorrect.",
  },
  {
    match: "Email not confirmed",
    message: "Please confirm your email before signing in.",
  },
  {
    match: "User already registered",
    message: "An account with this email already exists. Try signing in instead.",
  },
  {
    match: "Password should be at least 6 characters",
    message: "Password must be at least 6 characters.",
  },
  {
    match: "For security purposes, you can only request this after",
    message: "Too many attempts. Please wait a moment and try again.",
  },
  {
    match: "Failed to fetch",
    message: "Network error. Check your connection and try again.",
  },
];

export function validateAuthForm({ isSignup, name, email, password }) {
  if (isSignup && name.trim().length < 2) {
    return "Name must be at least 2 characters.";
  }

  if (!email.includes("@") || !email.includes(".")) {
    return "Please enter a valid email.";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  return "";
}

export function getAuthErrorMessage(error, fallbackMessage) {
  const rawMessage = error?.message?.trim();

  if (!rawMessage) {
    return fallbackMessage;
  }

  const friendlyMatch = AUTH_ERROR_MAP.find(({ match }) =>
    rawMessage.includes(match)
  );

  return friendlyMatch?.message || rawMessage || fallbackMessage;
}

export function getResetPasswordRedirectUrl(origin) {
  const baseUrl =
    origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  return new URL("/update-password", baseUrl).toString();
}
