import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-guard"

// Diagnostic endpoint — tests AI providers and shows exact status
// Visit: https://your-site.vercel.app/api/ai/diagnose
export async function GET(req: Request) {
  const url = new URL(req.url)
  const isSecret = url.searchParams.get("secret") === "rakhi-diag-2026"
  const session = await requireAdmin()

  if (!session && !isSecret) {
    return NextResponse.json({ error: "Unauthorized — login as admin first" }, { status: 401 })
  }

  const geminiKey = process.env.GEMINI_API_KEY
  const grokKey = process.env.XAI_API_KEY
  const githubToken = process.env.GITHUB_TOKEN

  const result: any = {
    timestamp: new Date().toISOString(),
    providers: {
      github: {
        configured: !!githubToken,
        keyPrefix: githubToken ? `${githubToken.slice(0, 6)}...` : "(not set)",
        keyLength: githubToken?.length || 0,
      },
      gemini: {
        configured: !!geminiKey,
        keyPrefix: geminiKey ? `${geminiKey.slice(0, 8)}...` : "(not set)",
        keyLength: geminiKey?.length || 0,
        keyFormat: geminiKey?.startsWith("AIza") ? "AIza (old format)"
          : geminiKey?.startsWith("AQ.") ? "AQ. (new format)"
          : geminiKey ? "unknown format"
          : "(not set)",
      },
      grok: {
        configured: !!grokKey,
        keyPrefix: grokKey ? `${grokKey.slice(0, 8)}...` : "(not set)",
        keyLength: grokKey?.length || 0,
      },
    },
    tests: {},
  }

  // ─── Test GitHub Models with a simple text request ──────────────────────
  if (githubToken) {
    try {
      const res = await fetch("https://models.github.ai/inference/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${githubToken}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Say 'hello' in one word" }],
          max_tokens: 10,
        }),
      })

      const resBody = await res.text()
      let parsed: any = null
      try { parsed = JSON.parse(resBody) } catch {}

      result.tests.github = {
        status: res.status,
        ok: res.ok,
        response: res.ok
          ? (parsed?.choices?.[0]?.message?.content || "(empty response)")
          : (parsed?.error?.message || resBody.slice(0, 200)),
        conclusion: res.ok
          ? "✅ WORKING — GitHub Models API is functional (Free Tier)"
          : res.status === 401
          ? "❌ UNAUTHORIZED — Token is invalid or expired"
          : `❌ ERROR ${res.status} — ${parsed?.error?.message || resBody.slice(0, 150)}`,
      }
    } catch (e: any) {
      result.tests.github = { error: e.message, conclusion: "❌ NETWORK ERROR — Could not reach GitHub Models API" }
    }
  } else {
    result.tests.github = { conclusion: "⚠️ NOT CONFIGURED — GITHUB_TOKEN not set in Vercel env vars" }
  }

  // ─── Test Gemini with a simple text request ────────────────────────────
  if (geminiKey) {
    try {
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`
      const res = await fetch(testUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say 'hello' in one word" }] }],
          generationConfig: { maxOutputTokens: 100 },
        }),
      })

      const resBody = await res.text()
      let parsed: any = null
      try { parsed = JSON.parse(resBody) } catch {}

      const geminiParts = parsed?.candidates?.[0]?.content?.parts || []
      const geminiTextPart = geminiParts.find((p: any) => typeof p.text === "string")
      const geminiText = geminiTextPart?.text || "(empty response)"

      result.tests.gemini = {
        status: res.status,
        ok: res.ok,
        rawBody: resBody.slice(0, 500),
        response: res.ok
          ? geminiText
          : (parsed?.error?.message || resBody.slice(0, 200)),
        conclusion: res.ok
          ? "✅ WORKING — Gemini API is functional"
          : res.status === 429
          ? "❌ RATE LIMITED — Free tier quota exhausted. Enable billing at https://console.cloud.google.com/billing to fix this permanently"
          : res.status === 403
          ? "❌ FORBIDDEN — API not enabled or key restricted. Enable Generative Language API at https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com"
          : res.status === 401
          ? "❌ UNAUTHORIZED — Key is invalid or expired"
          : `❌ ERROR ${res.status} — ${parsed?.error?.message || resBody.slice(0, 150)}`,
      }
    } catch (e: any) {
      result.tests.gemini = { error: e.message, conclusion: "❌ NETWORK ERROR — Could not reach Gemini API" }
    }
  } else {
    result.tests.gemini = { conclusion: "⚠️ NOT CONFIGURED — GEMINI_API_KEY not set in Vercel env vars" }
  }

  // ─── Test Grok with a simple text request ──────────────────────────────
  if (grokKey) {
    try {
      const listRes = await fetch("https://api.x.ai/v1/models", {
        headers: { Authorization: `Bearer ${grokKey}` },
      })
      const listData = listRes.ok ? await listRes.json() : null
      const modelIds = listData?.data?.map((m: any) => m.id) || []

      result.tests.grok = {
        listModelsStatus: listRes.status,
        availableModels: modelIds,
        conclusion: listRes.ok
          ? `✅ KEY WORKS — ${modelIds.length} models available: ${modelIds.slice(0, 5).join(", ")}`
          : `❌ KEY INVALID — Status ${listRes.status}`,
      }

      if (listRes.ok && modelIds.length > 0) {
        const testModel = modelIds.find((m: string) => m.includes("grok-2")) || modelIds[0]
        const chatRes = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${grokKey}`,
          },
          body: JSON.stringify({
            model: testModel,
            messages: [{ role: "user", content: "Say 'hello' in one word" }],
            max_tokens: 10,
          }),
        })

        const chatBody = await chatRes.text()
        let chatParsed: any = null
        try { chatParsed = JSON.parse(chatBody) } catch {}

        result.tests.grok.chatTest = {
          model: testModel,
          status: chatRes.status,
          ok: chatRes.ok,
          response: chatRes.ok
            ? (chatParsed?.choices?.[0]?.message?.content || "(empty)")
            : (chatParsed?.error || chatBody.slice(0, 150)),
        }
      }
    } catch (e: any) {
      result.tests.grok = { error: e.message, conclusion: "❌ NETWORK ERROR" }
    }
  } else {
    result.tests.grok = { conclusion: "⚠️ NOT CONFIGURED — XAI_API_KEY not set" }
  }

  // ─── Overall conclusion ────────────────────────────────────────────────
  const githubOk = result.tests.github?.ok === true
  const geminiOk = result.tests.gemini?.ok === true
  const grokOk = result.tests.grok?.listModelsStatus === 200

  result.overallConclusion = githubOk
    ? "✅ GitHub Models is working! AI Auto-Fill is ready for free."
    : geminiOk
    ? "✅ Gemini is working! AI Auto-Fill should work. If it fails, it's a temporary rate limit."
    : grokOk
    ? "✅ Grok is working! But vision models might not be available on your tier."
    : "❌ No AI providers are working. Set GITHUB_TOKEN or GEMINI_API_KEY in Vercel env vars."

  return NextResponse.json(result, { status: 200 })
}

