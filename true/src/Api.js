const BASE_URL = "http://127.0.0.1:8000/api";

export async function getPolls() {
  const res = await fetch(`${BASE_URL}/polls/`);
  if (!res.ok) {
    console.error("Failed to load polls:", await res.text());
    throw new Error("Poll fetch failed");
  }
  return res.json();
}

export async function createPoll(payload) {
  const res = await fetch(`${BASE_URL}/polls/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error("Failed creating poll:", await res.text());
    throw new Error("Poll creation failed");
  }

  return res.json();
}

export async function voteOption(optionId) {
  const res = await fetch(`${BASE_URL}/vote/${optionId}/`, {
    method: "POST",
  });

  if (!res.ok) {
    console.error("Vote failed:", await res.text());
    throw new Error("Vote failed");
  }

  return res.json();
}

