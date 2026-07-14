// Force-update story content on live site
// Run: bun run scripts/update-story.ts

const STORY_CONTENT = {
  title: "The Sacred Bond of Raksha Bandhan",
  titleColor: "#8B1E3E",
  titleFont: "font-serif",
  image: "/images/hero-1.svg",
  image2: "/images/hero-2.svg",
  image3: "/images/hero-3.svg",
  body: "In the heart of every Indian home, there exists a bond that transcends time — the sacred relationship between a brother and sister. Raksha Bandhan celebrates this eternal connection, weaving together threads of love, protection, and devotion.\n\nThe word 'Raksha' means protection, and 'Bandhan' means bond. Together, they form a promise — a sacred vow that has echoed through millennia, from the palaces of ancient kings to the homes of today.\n\n---\n\nLegend speaks of Queen Karnawati of Chittor, who sent a Rakhi to Emperor Humayun in her hour of need. Touched by this sacred thread, the mighty emperor rode to her aid, honoring the bond that knew no boundaries of religion or kingdom.\n\nThrough the ages, this tradition has only grown stronger. Today, when a sister ties the Rakhi on her brother's wrist, she doesn't just tie a thread — she ties a piece of her heart. And when the brother promises to protect her, he doesn't just speak words — he makes a vow that echoes through lifetimes.\n\n---\n\nAt House of Neelam, we understand the weight of this sacred moment. Every Rakhi we craft is not merely an accessory — it is a vessel of love, a symbol of devotion, a thread that binds hearts across distances.\n\nFrom the sacred moli threads blessed by generations of artisans to the diamond-studded luxury pieces that catch the light of a thousand celebrations, each Rakhi tells a story. Your story.\n\nThis Raksha Bandhan, let us help you write the next chapter. Because some bonds are forever — and they deserve to be celebrated with beauty worthy of their depth."
}

const LIVE_URL = process.argv[2] || "https://rakhi-push-2qq1.vercel.app"

async function main() {
  console.log(`📝 Updating story content on: ${LIVE_URL}`)

  // First, login to get session cookie
  console.log("Logging in as admin...")
  const loginRes = await fetch(`${LIVE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      email: "admin@houseofneelam.com",
      password: "Neelam@Admin2026",
      csrfToken: "",
      callbackUrl: "/",
      json: "true",
    }),
  })
  console.log("Login response:", loginRes.status)

  // Get CSRF token
  const csrfRes = await fetch(`${LIVE_URL}/api/auth/csrf`)
  const csrfData = await csrfRes.json()
  const csrfToken = csrfData.csrfToken
  console.log("CSRF token:", csrfToken)

  // Get cookies from login
  const cookies = loginRes.headers.get("set-cookie")
  console.log("Cookies:", cookies?.slice(0, 100))

  // Login properly
  const loginRes2 = await fetch(`${LIVE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": `next-auth.csrf-token=${csrfToken}`,
    },
    body: new URLSearchParams({
      email: "admin@houseofneelam.com",
      password: "Neelam@Admin2026",
      csrfToken,
      callbackUrl: "/",
      json: "true",
    }),
    redirect: "manual",
  })

  const sessionCookie = loginRes2.headers.get("set-cookie")
  console.log("Session cookie obtained:", !!sessionCookie)

  // Extract session token
  let cookieStr = ""
  if (sessionCookie) {
    const match = sessionCookie.match(/next-auth\.session-token=([^;]+)/)
    if (match) {
      cookieStr = `next-auth.session-token=${match[1]}`
    }
  }

  if (!cookieStr) {
    console.error("❌ Could not get session token. Trying direct API call...")
  }

  // Update story content
  console.log("Updating story content...")
  const updateRes = await fetch(`${LIVE_URL}/api/admin/site-content`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieStr,
    },
    body: JSON.stringify({
      section: "story",
      data: STORY_CONTENT,
    }),
  })

  const updateData = await updateRes.json()
  console.log("Update response:", updateRes.status, JSON.stringify(updateData).slice(0, 200))

  if (updateRes.ok) {
    console.log("✅ Story content updated successfully!")
  } else {
    console.log("⚠️ Could not update via API. The story content will show on fresh installs.")
    console.log("   To update on live site: Admin → Site Content → Story → Save")
  }
}

main().catch(console.error)
