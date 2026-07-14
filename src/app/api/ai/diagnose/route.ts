import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-guard"

// Diagnostic endpoint — tests AI providers and shows exact status
// Visit: https://your-site.vercel.app/api/ai/diagnose
export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized — login as admin first" }, { status: 401 })
  }

  const geminiKey = process.env.GEMINI_API_KEY
  const grokKey = process.env.XAI_API_KEY

  const result: any = {
    timestamp: new Date().toISOString(),
    providers: {
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

  // ─── Test Gemini with a simple text request ────────────────────────────
  if (geminiKey) {
    try {
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`
      const res = await fetch(testUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say 'hello' in one word" }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      })

      const resBody = await res.text()
      let parsed: any = null
      try { parsed = JSON.parse(resBody) } catch {}

      result.tests.gemini = {
        status: res.status,
        ok: res.ok,
        response: res.ok
          ? (parsed?.candidates?.[0]?.content?.parts?.[0]?.text || "(empty response)")
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
      // First list models
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

      // Try a simple text completion with first available model
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
  const geminiOk = result.tests.gemini?.ok === true
  const grokOk = result.tests.grok?.listModelsStatus === 200

  result.overallConclusion = geminiOk
    ? "✅ Gemini is working! AI Auto-Fill should work. If it fails, it's a temporary rate limit."
    : grokOk
    ? "✅ Grok is working! But vision models might not be available on your tier."
    : "❌ No AI providers are working. See details above for how to fix."

  return NextResponse.json(result, { status: 200 })
}
