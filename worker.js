// ARJIT Boxer coach server (Cloudflare Worker). Secret: GEMINI_API_KEY. Optional var: MODEL
export default {
  async fetch(req, env) {
    const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'POST,GET,OPTIONS'};
    const out = (o, s=200) => new Response(JSON.stringify(o), {status:s, headers:{...cors,'content-type':'application/json'}});
    if (req.method === 'OPTIONS') return new Response(null, {headers: cors});
    if (req.method !== 'POST') return out({text:'ARJIT server OK ✅'});
    try {
      const {messages=[], profile={}, logs=[], sessions=0, image} = await req.json();
      const sys = `Tum "ARJIT Boxer" ho: ek desi MMA-fighter style home boxing coach. Sirf Hinglish text mein, chhote, josh wale jawab (max ~120 words).
Tone: dosti wali, thoda mazaakiya roast jab user exercise skip kare (kabhi gaali/beizzati nahi). Exercise skip ho to alternative do.
Focus: strength, mental health, self-identity, communication, focus. Beginner non-contact drills hi sikhao; sparring/takedown/submission akele practice karne ko mana karo.
Medical advice nahi. Dard/chakkar/chest pain ho to rest + doctor. Crash diet ya supplements recommend mat karo. Under-18 ho to bade ki nigrani.
Food photo: dish pehchano, portion ka andaza, approx calories/protein/carbs/fat/minerals do, aur batao ki ye sirf andaza hai.
User profile: ${JSON.stringify(profile)}
Recent logs: ${JSON.stringify(logs)}
Total sessions: ${sessions}
Agar profile adhoori hai (age, weight, height, equipment, akela/partner, routine, sleep, phone use) to ek-ek karke poochho.`;
      let contents = messages.slice(-12).map(m => ({role: m.role === 'user' ? 'user' : 'model', parts:[{text:String(m.text).slice(0,2000)}]}));
      while (contents.length && contents[0].role !== 'user') contents.shift();
      if (!contents.length) return out({text:'Kuch likho, champion!'});
      if (image) contents[contents.length-1].parts.push({inlineData:{mimeType:'image/jpeg', data:image}});
      const model = env.MODEL || 'gemini-3.5-flash';
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method:'POST', headers:{'content-type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},
        body: JSON.stringify({systemInstruction:{parts:[{text:sys}]}, contents, generationConfig:{maxOutputTokens:900}})
      });
      const j = await r.json();
      const text = j.candidates?.[0]?.content?.parts?.map(p => p.text||'').join('') || ('Server error: ' + (j.error?.message || 'no reply'));
      return out({text});
    } catch (e) { return out({text:'Server error: ' + e.message}, 500); }
  }
};
