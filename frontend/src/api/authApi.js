const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

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
    const error = await response.json();

    throw new Error(
      Array.isArray(error.message)
        ? error.message.join(", ")
        : error.message
    );
  }

  return response.json();
}

export async function getMe(){
    const token = localStorage.getItem("token");
    const response = await fetch (`${BASE_URL}/auth/me`, {
        headers : {
            Authorization : `Bearer ${token}`,
        },
    });
    
    if(!response.ok){
        throw new Error ("Unauthorized");
    }

    return response.json();
}

export async function updateProfile(profile) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update profile");
  }
  return response.json();
}

export async function changePassword(data){
  const response = await fetch (`${BASE_URL}/auth/me/password`,{
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if(!response.ok) {
    throw new Error(result.message || "Password update failed.")
  }
  return result;
}