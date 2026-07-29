const BASE_URL = "http://localhost:3000";

export async function login(credentials) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    console.log(error);

    throw new Error("E-mail or password is incorrect");
  }

  return response.json();
}

export async function register(user) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    throw new Error("Registration failed.");
  }

  return response.json();
}