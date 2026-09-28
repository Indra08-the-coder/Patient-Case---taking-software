export type Turn = { role: string; content: string };
export const SECTIONS = ["chiefComplaint","presentIllness","pastMedicalHistory","medicationHistory","allergies","familyHistory","socialHistory","reviewOfSystems","redFlags"] as const;

const RED_FLAG_PATTERNS: { label: string; detail: string; rx: RegExp }[] = [
  { label: "Chest pain / pressure", detail: "Possible cardiac emergency - follow escalation SOP.", rx: /chest\s*(pain|pressure|tight|discomfort)/i },
  { label: "Breathing difficulty", detail: "Respiratory distress - escalate per SOP.", rx: /(breathless|short(ness)? of breath|difficulty breathing|dyspnea)/i },
  { label: "Stroke signs", detail: "Possible stroke - activate stroke pathway.", rx: /(slurred|facial droop|one side weak|sudden weakness|stroke|paralysis)/i },
  { label: "Heavy bleeding", detail: "Haemorrhage - urgent review.", rx: /(heavy bleeding|profuse bleed|vomit.*blood|blood in stool)/i },
  { label: "High fever with confusion", detail: "Possible sepsis - escalate.", rx: /high fever.*(confus|unconscious|drowsy|stiff neck)/i },
  { label: "Severe abdominal pain", detail: "Acute abdomen - urgent review.", rx: /severe (abdominal|stomach) pain/i },
  { label: "Self-harm thoughts", detail: "Self-harm risk - psychiatry SOP.", rx: /(suicid|kill myself|end my life|self.?harm)/i },
  { label: "Chest pain multi-language", detail: "Escalate per SOP.", rx: /chest-flag-placeholder/ },
];

export function detectRedFlags(text: string) {
  return RED_FLAG_PATTERNS.filter((p) => p.rx.test(text)).map(({ label, detail }) => ({ label, detail, severity: "URGENT" as const }));
}

const QUESTION_BANK: Record<string, string[]> = {
  fever: ["How many days of fever, and highest temperature measured?", "Continuous or intermittent - with chills, sweating?", "Any cough, burning urination, loose stools, rash, headache?", "Recent travel, mosquito exposure, sick contacts?", "What medicines taken for fever so far?"],
  cough: ["How long - dry or with phlegm? What colour?", "Any fever, breathlessness, wheeze, chest pain?", "Weight loss, night sweats, blood in sputum?", "Smoking or dust exposure? Asthma/TB history?", "Allergies, inhalers used?"],
  chest: ["When did pain start - pressure, sharp, or burning?", "Spread to arm/neck/jaw/back? Sweating, nausea, breathlessness?", "Worse on exertion, better with rest?", "BP, diabetes, cholesterol, heart disease, smoking history?", "Similar episodes before?"],
  abdominal: ["Where exactly - when did it start, sudden or gradual?", "Constant or colicky? What worsens/relieves?", "Vomiting, fever, diarrhoea, constipation, burning urination?", "Prior surgery, gallstones? LMP if applicable?", "Alcohol, painkillers, outside food?"],
  diabetes: ["Duration of diabetes? Latest sugar/HbA1c?", "Current medicines - names, doses, timings?", "Any low-sugar episodes?", "Burning feet, vision changes, swelling, wounds?", "Diet, exercise, alcohol, smoking?"],
  default: ["Describe the main problem - when did it start?", "Constant or intermittent? Better/worse with what?", "Fever, weight/appetite/sleep change?", "Past illnesses - BP, diabetes, asthma, TB, heart/kidney/liver?", "Current medicines or remedies? Any drug allergies?"],
};

export function complaintKey(chief: string) {
  const c = chief.toLowerCase();
  if (/fever|bukhar/.test(c)) return "fever";
  if (/cough|khansi/.test(c)) return "cough";
  if (/chest|heart|cardiac/.test(c)) return "chest";
  if (/stomach|abdomen|vomit|diarrh|loose/.test(c)) return "abdominal";
  if (/sugar|diabet/.test(c)) return "diabetes";
  return "default";
}

export function nextQuestion(chiefComplaint: string, turnCount: number, lang = "en") {
  const bank = QUESTION_BANK[complaintKey(chiefComplaint)] ?? QUESTION_BANK.default;
  if (turnCount >= bank.length - 1) return "Thank you. I have enough for a structured draft. A clinician will review it with you now.";
  const prefix: Record<string, string> = { en: "", hi: "(आप हिन्दी में उत्तर दे सकते हैं) ", te: "(మీరు తెలుగులో సమాధానం ఇవ్వవచ్చు) " };
  return `${prefix[lang] ?? ""}${bank[Math.min(turnCount, bank.length - 1)]}`;
}
export function buildSummary(chief: string, history: { section: string; question: string; answer: string }[]) {
  const get = (s: string) => history.filter((h) => h.section === s).map((h) => `Q: ${h.question}\nA: ${h.answer}`).join("\n");
  const all = history.map((h) => h.answer).join(" ");
  const allergies = /allerg/i.test(all) ? history.filter((h) => /allerg/i.test(h.question + h.answer)).map((h) => h.answer).join("; ") : "NKDA (to confirm)";
  const meds = /medicine|tablet|dose|drug/i.test(all) ? history.filter((h) => /medicine|tablet|dose|drug/i.test(h.question + h.answer)).map((h) => h.answer).join("; ") : "To be confirmed with prescriptions";
  const pmh = /BP|diabetes|sugar|asthma|TB|heart|kidney|thyroid|past/i.test(all) ? history.filter((h) => /BP|diabetes|sugar|asthma|TB|heart|kidney|thyroid|past/i.test(h.question + h.answer)).map((h) => h.answer).join("; ") : "No major past illness volunteered yet";
  const present = history.map((h) => h.answer).filter(Boolean).join(" ") || chief;
  const missing: string[] = [];
  if (!/day|week|month|hour|yesterday|today/i.test(present)) missing.push("Onset & duration");
  if (/To be confirmed/.test(meds)) missing.push("Current medications with doses");
  if (/NKDA/.test(allergies)) missing.push("Allergy confirmation");
  if (!/family/i.test(all)) missing.push("Family history");
  return {
    chiefComplaint: chief, presentIllness: present.slice(0, 2000),
    pastMedicalHistory: pmh.slice(0, 1500), medicationHistory: meds.slice(0, 1500),
    allergies, familyHistory: get("familyHistory") || "Ask: parents/siblings diabetes, BP, heart disease, TB.",
    socialHistory: get("socialHistory") || "Ask: smoking, alcohol, tobacco, occupation, diet.",
    reviewOfSystems: get("reviewOfSystems") || "Fever/weight/appetite/sleep: to confirm.",
    redFlagSummary: "", missingInfo: missing.join("; ") || "None - ready for review.",
    conciseSummary: `${chief}. ${present.slice(0, 280)}`.slice(0, 600),
  };
}

export async function llmFollowUp(chief: string, turns: { role: string; content: string }[], lang: string): Promise<string | null> {
  const key = process.env.LLM_API_KEY;
  if (!key) return null;
  try {
    const base = (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), Number(process.env.LLM_TIMEOUT_MS ?? 25000));
    const sys = `You are ClinIQ, a documentation assistant for Indian hospitals. Ask ONE short follow-up question (under 25 words) to complete clinical history. Language: ${lang}. NEVER diagnose, prescribe, or triage. If red-flag symptoms appear (chest pain, breathing difficulty, stroke signs, heavy bleeding, suicidal thoughts, severe abdominal pain, high fever+confusion), append [RED FLAG: label].`;
    const res = await fetch(`${base}/chat/completions`, { method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: process.env.LLM_MODEL ?? "gpt-4o-mini", temperature: 0.3, max_tokens: 200,
        messages: [{ role: "system", content: sys }, { role: "user", content: `Chief complaint: ${chief}` }, ...turns.slice(-10).map((t) => ({ role: t.role === "USER" ? "user" : "assistant", content: t.content }))] }),
    });
    clearTimeout(to);
    if (!res.ok) return null;
    const j = await res.json();
    const text: string = j?.choices?.[0]?.message?.content?.trim() ?? "";
    return text || null;
  } catch { return null; }
}

