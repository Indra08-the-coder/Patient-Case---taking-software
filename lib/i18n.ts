export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "ta", label: "Tamil", native: "தமிழ்", comingSoon: true },
  { code: "mr", label: "Marathi", native: "मराठी", comingSoon: true },
  { code: "bn", label: "Bengali", native: "বাংলা", comingSoon: true },
] as const;

export const STRINGS: Record<string, Record<string, string>> = {
  en: { consent: "I consent to AI-assisted history documentation.", start: "Start AI intake", send: "Send", listening: "Listening…" },
  hi: { consent: "मैं AI-सहायता प्राप्त इतिहास दस्तावेज़ीकरण के लिए सहमति देता/देती हूँ।", start: "AI इंटेक शुरू करें", send: "भेजें", listening: "सुन रहे हैं…" },
  te: { consent: "AI-సహాయక చరిత్ర డాక్యుమెంటేషన్‌కు నేను అంగీకరిస్తున్నాను.", start: "AI ఇన్‌టేక్ ప్రారంభించండి", send: "పంపండి", listening: "వింటోంది…" },
};
export function t(lang: string, key: string) {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}
