// Use the Vercel environment variable if available,
// otherwise fall back to your Render backend URL.
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://digital-health-backend-z1jf.onrender.com";

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }

  return data;
}

export async function registerUser({
  full_name,
  email,
  password,
  confirm_password,
}) {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      full_name,
      email,
      password,
      confirm_password,
    }),
  });

  return handleResponse(response);
}

export async function loginUser({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return handleResponse(response);
}

export async function getProfile(token) {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

export async function getHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return handleResponse(response);
}

export async function predictDisease(symptoms) {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ symptoms }),
  });

  return handleResponse(response);
}