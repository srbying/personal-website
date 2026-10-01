export const APPROVED_EVIDENCE =
  "# Professional role\n\nSteven Byington is a software engineering manager.";

export const ANSWERS = Object.freeze({
  role: "Steven Byington is a software engineering manager.",
  missing: "This chat doesn't have enough information to answer that yet.",
  strengthsFocus: "This chat focuses on Steven's strengths and experience."
});

const ROLE_QUESTION = /\b(?:role|position|job title|career|professional background|work background|engineering manager|software engineering manager|years? of (?:full[- ]stack )?software engineering experience|how much experience)\b/i;
const UNSUPPORTED_TOPIC = /\b(?:technolog(?:y|ies)|programming languages?|frameworks?|tools?|projects?|interests?|hobbies|outside work|mistakes?|setbacks?|failures?|weakness(?:es)?|red flags?|fit assessment|hire|hiring|salary|location|education|degree|certifications?)\b/i;
const FOLLOW_UP = /\b(?:what about|tell me more|more about that|can you elaborate|could you elaborate|why is that|how so|expand on that|and how|what does that mean|can you say more)\b/i;
const NEGATIVE_FIT = /\b(?:bad|poor|wrong|worst)\s+fit\b|\bnot\s+(?:a\s+)?(?:good|right)\s+fit\b|\b(?:isn't|is not)\s+(?:a\s+)?(?:good|right)\s+fit\b|\b(?:unsuitable|unfit|unqualified|disqualif\w*)\b|\bnot\b.{0,40}\b(?:qualified|suited)\b|\b(?:shouldn't|should not|wouldn't|would not)\s+hire\b|\b(?:bad|poor)\s+hire\b|\b(?:why|what)\b.{0,60}\b(?:avoid hiring|wrong with hiring|reasons? not to hire)\b|\bweakness(?:es)?\b|\bred flags?\b|\breasons? (?:he )?(?:shouldn't|should not) be hired\b/i;

export function classifyQuestion(question, earlierQuestions) {
  if (NEGATIVE_FIT.test(question)) return "negative-fit";
  if (UNSUPPORTED_TOPIC.test(question)) return "unsupported";
  if (ROLE_QUESTION.test(question)) return "role";
  if (FOLLOW_UP.test(question) && earlierQuestions.some((item) => ROLE_QUESTION.test(item))) {
    return "role";
  }
  return "unsupported";
}
