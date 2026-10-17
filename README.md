<div align="center">

<img src="./docs/assets/hero.svg" alt="SahajForm — turn your spoken dialect into a respectful official letter" width="100%" />

<br/>

<a href="https://sahajform.onrender.com"><img src="https://img.shields.io/badge/▶%20LIVE%20DEMO-sahajform.onrender.com-F5A623?style=for-the-badge&labelColor=0b0f17" alt="Live demo" /></a>
&nbsp;
<a href="https://github.com/shivamdwivedicse/SahajForm/issues"><img src="https://img.shields.io/badge/REPORT-a%20bug-ef4444?style=for-the-badge&labelColor=0b0f17" alt="Report a bug" /></a>
&nbsp;
<a href="#-quick-start"><img src="https://img.shields.io/badge/RUN-locally-22c55e?style=for-the-badge&labelColor=0b0f17" alt="Run locally" /></a>

<br/><br/>

**AI-powered bilingual translator that turns informal citizen grievances into formal government applications, in English and Hindi.**

<sub>🏆 Built for **TechCommons Hacks V2 — Hacks to Inspire** · Theme: AI for Social Good</sub>

<br/>

<img src="./docs/assets/demo.gif" alt="SahajForm full demo: opening screen, category, dialect input, generated letters, placeholder fill" width="92%" />

<sub>Full run in 20 seconds: category → speak or type in your dialect → bilingual letters → fill the gaps → download.</sub>

<br/><br/>

<table>
  <tr>
    <td align="center" width="25%"><h1>7</h1><sub>GRIEVANCE<br/>CATEGORIES</sub></td>
    <td align="center" width="25%"><h1>2</h1><sub>LANGUAGES,<br/>ONE CLICK</sub></td>
    <td align="center" width="25%"><h1>3</h1><sub>STEPS FROM<br/>PROBLEM TO PDF</sub></td>
    <td align="center" width="25%"><h1>0</h1><sub>INVENTED<br/>FACTS</sub></td>
  </tr>
</table>

<p>
  <a href="#-the-problem"><b>Problem</b></a> &nbsp;·&nbsp;
  <a href="#-features"><b>Features</b></a> &nbsp;·&nbsp;
  <a href="#-how-it-works"><b>How it works</b></a> &nbsp;·&nbsp;
  <a href="#-architecture"><b>Architecture</b></a> &nbsp;·&nbsp;
  <a href="#-tech-stack"><b>Stack</b></a> &nbsp;·&nbsp;
  <a href="#-quick-start"><b>Quick start</b></a> &nbsp;·&nbsp;
  <a href="#-roadmap"><b>Roadmap</b></a>
</p>

</div>

<br/>

## 😶 The Problem

Millions of citizens in rural and semi-urban India know *exactly* what is wrong: the transformer burnt out, the ration dealer refuses grain, the pipeline has been leaking for a week. What they don't have is the **formal bureaucratic language** an office expects. So genuine complaints go unfiled, or get rejected for being informal or incomplete.

**SahajForm removes the language barrier.**

<table>
  <tr>
    <th align="center" width="50%">🗣️ What the citizen says</th>
    <th align="center" width="50%">📄 What SahajForm writes</th>
  </tr>
  <tr>
    <td valign="top"><i>"Bhaiya hamare mohalle me 3 din se light gayab hai. Transformer se bahut zor se aawaz aayi thi, dhuan nikla tha. Bacchon ki pariksha chal rahi hai, inverter bhi dead ho gaya. Line man ko bola to bolta hai mere paas saman nahi hai…"</i></td>
    <td valign="top"><i>"Respected Sir/Madam, I most respectfully submit that there has been no electricity supply in our locality for the past three days. A loud noise followed by smoke was observed from the local transformer… I humbly request you to arrange its replacement at the earliest."</i><br/><br/><sub>+ the same letter in formal हिंदी, side by side.</sub></td>
  </tr>
</table>

<br/>

## ✨ Features

<table>
  <tr>
    <td width="33%" valign="top">
      <h3>🗣️ Speak your dialect</h3>
      Hindi, Hinglish, Bhojpuri, Haryanvi… type it, or tap the mic and just talk.
    </td>
    <td width="33%" valign="top">
      <h3>🏛️ 7 official formats</h3>
      Electricity, Ration Card, Water Supply, Police/GD, RTI, School/EWS, General (DM/SDM).
    </td>
    <td width="33%" valign="top">
      <h3>🌐 Two letters at once</h3>
      Formal English <b>and</b> शुद्ध हिंदी, generated together and shown side by side.
    </td>
  </tr>
  <tr>
    <td valign="top">
      <h3>🛡️ Zero-hallucination</h3>
      Never invents names, numbers or dates. Gaps become clear <code>[placeholders]</code>.
    </td>
    <td valign="top">
      <h3>⚡ Live placeholder fill</h3>
      Fill a detail once in the checklist and <b>both</b> letters update instantly.
    </td>
    <td valign="top">
      <h3>📄 PDF, print, copy</h3>
      English-only, Hindi-only or combined A4 PDF. Print-ready, sign and submit.
    </td>
  </tr>
</table>

<br/>

## 🧭 How it works

<div align="center">
<img src="./docs/assets/flow.svg" alt="User journey: select, describe, translate, review, submit" width="100%" />
</div>

<br/>

## 📐 Architecture

<div align="center">
<img src="./docs/assets/architecture.svg" alt="System architecture: browser, Express backend, Gemini API" width="100%" />
</div>

<br/>

<details>
<summary><b>🔎 See the request/response sequence</b></summary>

```mermaid
sequenceDiagram
    autonumber
    actor C as Citizen
    participant F as Frontend (Vite + JS)
    participant B as Express API
    participant G as Gemini API
    C->>F: Pick category + describe problem (typed or voice)
    F->>B: POST /api/generate { formType, description }
    B->>B: Build schema-constrained, zero-hallucination prompt
    B->>G: generateContent (JSON schema, temp 0.2)
    G-->>B: { detected_language, summary, formal_english, formal_hindi, missing_info[] }
    B-->>F: Validated JSON
    F-->>C: Two letters + missing-info checklist
    C->>F: Fill placeholders
    F-->>C: Both letters update live → PDF / Print
```

</details>

<br/>

## 🧰 Tech Stack

<div align="center">

<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
<br/>
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
<img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini" />
<img src="https://img.shields.io/badge/jsPDF-E34F26?style=for-the-badge&logo=adobeacrobatreader&logoColor=white" alt="jsPDF" />
<img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black" alt="Render" />

</div>

| Layer | What we use |
|---|---|
| **Frontend** | Vite · vanilla JavaScript · Tailwind CSS v4 · Web Speech API (voice) · html2canvas + jsPDF |
| **Backend** | Node.js · Express · TypeScript (`tsx` for dev, `esbuild` for prod) |
| **AI** | Google Gemini via `@google/genai`, strict JSON-schema output, low temperature |
| **Hosting** | Render |

<br/>

## 🔒 Zero-Hallucination Design Principle

> [!IMPORTANT]
> A government application with an invented consumer number is worse than no application. SahajForm's prompt is locked to a strict JSON schema and instructed to **never fabricate** names, IDs, dates or allegations the citizen didn't state.

Whatever the AI can't infer becomes an **editable placeholder** (for example `[Consumer ID]`) and a line in the *Missing Information Checklist*. Fill it once; both letters update. Nothing goes out unreviewed.

<br/>

## 🚀 Quick Start

```bash
git clone https://github.com/shivamdwivedicse/SahajForm.git
cd SahajForm
npm install --legacy-peer-deps
```

Create `.env.local` in the project root ([get a free Gemini key](https://aistudio.google.com/app/apikey)):

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

```bash
npm run dev          # http://localhost:3000
```

<details>
<summary><b>📦 Production build &amp; ☁️ deploy on Render</b></summary>

<br/>

```bash
npm run build
npm run start
```

| Render setting | Value |
|---|---|
| Build command | `npm install && npm run build` |
| Start command | `npm run start` |
| Environment variable | `GEMINI_API_KEY` |

</details>

> [!NOTE]
> Requires **Node.js 18+**. Voice input uses the browser's speech service, so it works best in Google Chrome.

<br/>

## 📍 Roadmap

- [x] Bilingual letters (English + Hindi) with zero-hallucination placeholders
- [x] Live placeholder editing, PDF export (EN / HI / combined), print layout
- [x] Voice input (Hindi / Hinglish) via the Web Speech API
- [ ] More categories: pension, land records, health schemes
- [ ] "Track your application": follow-up reminders after submission
- [ ] Better dialect detection (Bhojpuri, Haryanvi, Maithili…)
- [ ] Offline-friendly PWA for low-connectivity areas

<br/>

## 🤝 Contributing

Issues and pull requests are welcome.

```bash
git checkout -b feature/AmazingFeature
git commit -m "Add some AmazingFeature"
git push origin feature/AmazingFeature   # then open a Pull Request
```

<br/>

## 👤 Author

<div align="center">

**Shivam Dwivedi**

[![GitHub](https://img.shields.io/badge/GitHub-shivamdwivedicse-181717?style=for-the-badge&logo=github)](https://www.github.com/shivamdwivedicse)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Shivam%20Dwivedi-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/shivam-dwivedi-27661a395/)
[![Email](https://img.shields.io/badge/Email-Get%20in%20touch-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:Shivamdwivedicse20919@gmail.com)
[![Discord](https://img.shields.io/badge/Discord-shivamdwivedi0919-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/users/shivamdwivedi0919)

<br/>

<sub>Distributed under the MIT License.</sub>

<br/>

**सहज फॉर्म** · *Every citizen deserves to be heard in the language the office understands.*

</div>