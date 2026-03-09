import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";


dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

let accessToken = null;
let refreshToken = process.env.STRAVA_REFRESH_TOKEN;

if (fs.existsSync(".refresh_token")) {
  refreshToken = fs.readFileSync(".refresh_token", "utf8");
}

app.get("/exchange_token", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Missing ?code= parameter");
  }

  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: "authorization_code"
    })
  });

  const data = await tokenRes.json();
  console.log("Initial token exchange:", data);

  // Save refresh token
  fs.writeFileSync(".refresh_token", data.refresh_token);

  res.send("Authorization complete. You can close this window.");
});


// Refresh access token using refresh token
async function refreshAccessToken() {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken
    })
  });

  const data = await res.json();
  console.log("Refresh response:", data);

  if (data.errors) {
    console.error("Refresh failed:", data.errors);
    return false;
  }

  accessToken = data.access_token;
  refreshToken = data.refresh_token;

  fs.writeFileSync(".refresh_token", refreshToken);

  return true;
}

// Get activities from Strava
async function getActivities() {
  if (!accessToken) {
    const ok = await refreshAccessToken();
    if (!ok) throw new Error("Failed to refresh access token");
  }

  const res = await fetch(
    "https://www.strava.com/api/v3/athlete/activities?per_page=50",
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  // If token expired, try ONE refresh, not infinite
  if (res.status === 401) {
    console.log("Access token expired, refreshing...");
    const ok = await refreshAccessToken();
    if (!ok) throw new Error("Refresh token invalid");
    return getActivities(); // retry once
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    console.error("Strava error:", data);
    return data;
  }

  return data;
}


app.get("/Hello_World", async (req, res) => {
  console.log("Hello World")
  res.json("Hello World");
});


// Calculate weekly miles
app.get("/weekly_miles", async (req, res) => {
  try {
    const activities = await getActivities();

    if (!Array.isArray(activities)) {
      console.error("Strava returned an error:", activities);
      return res.status(500).json({ error: "Strava API error", details: activities });
    }
    
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    console.log("Activities response:", activities);

    let totalMiles = 0;

    activities.forEach((act) => {
      const start = new Date(act.start_date).getTime();
      if (start >= weekAgo && act.type === "Run") {
        totalMiles += act.distance / 1609.34; // meters → miles
      }
    });

    res.json({ weekly_miles: Number(totalMiles.toFixed(2)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

function getDayWindow(dayIndex) {
  // dayIndex: 1 = oldest day, 7 = most recent day
  const now = Date.now();
  const halfDay = 12 * 60 * 60 * 1000;

  const start = now - dayIndex * 24 * 60 * 60 * 1000 - halfDay;
  const end = now - (dayIndex - 1) * 24 * 60 * 60 * 1000 - halfDay;

  return { start, end };
}

async function getMilesForDay(dayIndex) {
  const activities = await getActivities();

  if (!Array.isArray(activities)) {
    throw new Error("Strava API error");
  }

  const { start, end } = getDayWindow(dayIndex);
  let miles = 0;

  activities.forEach((act) => {
    if (act.type !== "Run") return;

    const t = new Date(act.start_date).getTime();
    if (t >= start && t < end) {
      miles += act.distance / 1609.34;
    }
  });

  return Number(miles.toFixed(2));
}

app.get("/day1_miles", async (req, res) => {
  try {
    res.json({ day1_miles: await getMilesForDay(7) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/day2_miles", async (req, res) => {
  try {
    res.json({ day2_miles: await getMilesForDay(6) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/day3_miles", async (req, res) => {
  try {
    res.json({ day3_miles: await getMilesForDay(5) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/day4_miles", async (req, res) => {
  try {
    res.json({ day4_miles: await getMilesForDay(4) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/day5_miles", async (req, res) => {
  try {
    res.json({ day5_miles: await getMilesForDay(3) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/day6_miles", async (req, res) => {
  try {
    res.json({ day6_miles: await getMilesForDay(2) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/day7_miles", async (req, res) => {
  try {
    res.json({ day7_miles: await getMilesForDay(1) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
