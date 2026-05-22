/**
 * format-insights: Formats coaching insight bodies via gpt-4o-mini.
 * Personalises static knowledge_rules text using user context (training, metrics, profile).
 * Degrades gracefully: returns original bodies if OPENAI_API_KEY is not set or on error.
 *
 * Required secret: OPENAI_API_KEY (set via `supabase secrets set OPENAI_API_KEY=...`)
 */

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface InsightInput {
  id: string;
  insight_title: string;
  insight_body: string;
  category: string;
  severity: string;
}

interface TodayTraining {
  type: string;
  subtype: string | null;
  sport: string | null;
}

interface TodayMetrics {
  body_battery: number | null;
  sleep_hours: number | null;
}

interface UserContext {
  user_name: string;
  archetype: string;
  training_phase: string | null;
  today_training: TodayTraining | null;
  today_metrics: TodayMetrics | null;
  days_to_goal: number | null;
  goal_name: string | null;
}

function buildContextString(ctx: UserContext): string {
  const lines: string[] = [`Användare: ${ctx.user_name}`, `Arketyp: ${ctx.archetype}`];
  if (ctx.training_phase) lines.push(`Träningsfas: ${ctx.training_phase}`);
  if (ctx.today_training) {
    const t = ctx.today_training;
    lines.push(
      `Dagens pass: ${t.type}${t.subtype ? ' – ' + t.subtype : ''}${t.sport ? ' (' + t.sport + ')' : ''}`,
    );
  }
  if (ctx.today_metrics?.body_battery != null) {
    lines.push(`Body battery: ${ctx.today_metrics.body_battery}`);
  }
  if (ctx.today_metrics?.sleep_hours != null) {
    lines.push(`Sömn idag: ${ctx.today_metrics.sleep_hours}h`);
  }
  if (ctx.days_to_goal != null && ctx.goal_name) {
    lines.push(`${ctx.days_to_goal} dagar till ${ctx.goal_name}`);
  }
  return lines.join('\n');
}

async function formatWithLLM(
  insight: InsightInput,
  contextStr: string,
  openaiKey: string,
): Promise<string> {
  const userMessage =
    `Kontext:\n${contextStr}\n\n` +
    `Insikt:\nTitel: ${insight.insight_title}\nText: ${insight.insight_body}\n` +
    `Kategori: ${insight.category}, Allvarlighet: ${insight.severity}\n\n` +
    `Skriv om texten på svenska, 1-2 meningar, personligt och coachande. ` +
    `Var specifik utifrån kontexten. Returnera enbart den omskrivna texten.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Du är en personlig träningscoach i en atletapp. ' +
            'Din uppgift är att skriva om insikter på ett personligt, direkt och motiverande sätt på svenska. ' +
            '1-2 meningar max. Använd kontexten om användaren för att göra texten specifik. ' +
            'Returnera enbart den omskrivna texten utan citattecken eller förklaringar.',
        },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 120,
      temperature: 0.65,
    }),
  });

  if (!response.ok) return insight.insight_body;

  const data = await response.json();
  return (data.choices?.[0]?.message?.content as string | undefined)?.trim() ?? insight.insight_body;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'unauthorized' }, 401);

  let body: { insights: InsightInput[]; context: UserContext };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const { insights, context } = body ?? {};
  if (!Array.isArray(insights) || insights.length === 0) {
    return json({ ok: true, formatted: [] });
  }

  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    // Degrade gracefully: return original bodies unchanged
    return json({ ok: true, formatted: insights.map((i) => ({ id: i.id, insight_body: i.insight_body })) });
  }

  const contextStr = buildContextString(context);

  const formatted = await Promise.all(
    insights.map(async (insight) => {
      try {
        const body = await formatWithLLM(insight, contextStr, openaiKey);
        return { id: insight.id, insight_body: body };
      } catch {
        return { id: insight.id, insight_body: insight.insight_body };
      }
    }),
  );

  return json({ ok: true, formatted });
});
