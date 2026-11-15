# تفاهُم · Rapport

موقع ثنائي اللغة (عربي/إنجليزي) يجري فيه أعضاء الفريق ثلاثة اختبارات قصيرة، وتصل نتيجة كل اختبار إلى لوحة قائد الفريق تلقائياً. تحوّل اللوحة النتائج إلى إرشادات عملية وخطة تطوير لكل شخص، وتصدّر مجلداً كاملاً لكل عضو.

**[English below](#english)**

## ما في الموقع

| الاختبار | الأسئلة | الوقت | المصدر |
| --- | --- | --- | --- |
| أسلوب العمل (DISC) | 24 | 4 دقائق | أسئلة أصلية مبنية على نموذج مارستون |
| الأنماط الستة عشر | 32 | 5 دقائق | أسئلة وأسماء وأوصاف أصلية، مستوحاة من أنماط يونغ |
| العوامل الخمسة الكبرى (Big Five) | 20 | 3 دقائق | Mini-IPIP، وهو مصدر علمي مفتوح (ipip.ori.org) |

### للعضو

- يكتب اسمه ويوافق مرة واحدة على مشاركة نتائجه، ثم يبدأ.
- عند إنهاء كل اختبار تُرسل النتيجة تلقائياً إلى قائد الفريق مع تاريخها، ويرى العضو تأكيد الوصول.
- إذا أعاد اختباراً أو غيّر اسمه، تتحدث نسخة القائد تلقائياً.
- يستطيع سحب نتائجه في أي وقت من «ملفّي».
- الإجابات نفسها لا تغادر جهازه؛ تُرسل الدرجات فقط.

### لقائد الفريق

لوحة محمية برمز دخول، فيها:

- **جدول الفريق:** الاسم والدور، وأسلوب DISC، والنمط من 16، وأبرز سمات Big Five، وعدد الاختبارات المكتملة، وحالة خطة التطوير. مع بحث بالاسم.
- **صورة الفريق:** توزيع الأساليب ومجموعات الأنماط، وملاحظات تلقائية على الفجوات.
- **صفحة لكل عضو بأربعة أقسام:**
  - **النتائج:** النتيجة الكاملة لكل اختبار، مع وصف نمطه من الأنماط الستة عشر.
  - **كيف تعمل معه:** التواصل والتحفيز والملاحظات والتفويض والخلاف، ونصيحة للثنائي بين أسلوبك وأسلوبه.
  - **خطة التطوير:** محور الفترة، وأهداف بموعد وحالة، والدعم المطلوب، وموعد المراجعة. ومعها اقتراحات من نتائجه وأسئلة للجلسة الفردية. تُحفظ تلقائياً.
  - **المعلومات والملاحظات:** الفريق والبريد والهاتف وتاريخ الانضمام، وملاحظات الجلسات الفردية بالتاريخ.
- **التصدير:** ملف ZIP للفريق كله، أو لعضو واحد. لكل عضو مجلد فيه:
  - `profile.html`: النتائج الكاملة وكيف تعمل معه، ويُطبع PDF من المتصفح.
  - `development-plan.html`: الخطة والاقتراحات والملاحظات.
  - `notes.md`: الخطة والملاحظات كنص قابل للتعديل.
  - `data.json`: كل البيانات.
  - وفي المجلد الرئيسي: `team-overview.html` و`team.csv` (يفتح في Excel).

**عام:** وضع فاتح وداكن (يتبع إعداد الجهاز، ويمكن تغييره من الشريط العلوي). بلا اعتماديات: JavaScript عادي، بدون build وبدون `npm install`.

## النشر على Vercel (مجاناً)

> **مهم:** لتصل النتائج تلقائياً يجب ربط قاعدة البيانات (الخطوة 3). بدونها يعمل الموقع، لكن كل عضو سيرسل لك رمز نتيجته يدوياً.

1. ارفع المجلد إلى مستودع على GitHub (يمكن أن يكون خاصاً).
2. في Vercel اختر **Add New → Project**، ثم المستودع.
   - Framework Preset: **Other**.
   - اترك Build Command فارغاً؛ ملف `vercel.json` يحدد أن الموقع في مجلد `public`.
3. اربط قاعدة البيانات: من صفحة المشروع **Storage → Upstash (Redis) → Create**، واربطها بالمشروع.
   - تُضاف متغيرات البيئة `KV_REST_API_URL` و`KV_REST_API_TOKEN` تلقائياً.
   - بديل: أنشئ قاعدة في upstash.com مباشرة، وانسخ REST URL وREST TOKEN إلى `UPSTASH_REDIS_REST_URL` و`UPSTASH_REDIS_REST_TOKEN`.
4. في **Settings → Environment Variables** أضف:
   - `ADMIN_PASSCODE`: رمز دخول لوحتك. اجعله طويلاً وعشوائياً.
   - `TEAM_CODE` (اختياري ومُستحسَن): رمز يُضاف إلى رابط الفريق حتى لا يرسل أحد من خارجه نتائج.
5. أعد النشر (**Deployments → Redeploy**) لتُطبَّق المتغيرات.
6. افتح `https://موقعك/#lead` وادخل برمزك. يجب أن ترى سطراً أخضر: «تصل النتائج هنا تلقائياً». ثم انسخ «رابط فريقك» وأرسله للفريق.

### إن كنت تستخدم نسخة سابقة

البيانات المحفوظة تبقى ظاهرة؛ بادئة التخزين لم تتغير (`STORE_PREFIX`، والافتراضي `teamprint`). من شارك سابقاً يُعتبر موافقاً، وتُرسل نتائجه الجديدة تلقائياً.

### بدون قاعدة بيانات

يمكنك رفع مجلد `public` وحده على أي استضافة ثابتة مجانية: Netlify Drop أو Cloudflare Pages أو GitHub Pages. يكتشف الموقع غياب الخادم تلقائياً:

- يرسل كل عضو «رمز النتيجة» لك، وتستوردها في لوحتك.
- خطط التطوير والملاحظات تُحفظ على جهازك فقط.
- يمكنك تجربة اللوحة والتصدير بزر «جرّب بفريق تجريبي».

## التشغيل محلياً

```bash
npm run dev      # http://localhost:3000 — رمز اللوحة الافتراضي: dev
npm test         # اختبارات الحساب والتحقق والتصدير
```

يحتاج Node 18 أو أحدث. تُحفظ البيانات محلياً في `data/dev-db.json`. انسخ `.env.example` إلى `.env` لتغيير الإعدادات.

## التخصيص

| ما تريد تغييره | أين تجده |
| --- | --- |
| الاسم | `APP_NAME` في `public/src/i18n.js`، و`<title>` في `public/index.html` |
| الأسئلة | `public/src/assessments/` |
| أوصاف الأنماط الستة عشر | `public/src/types16.js` |
| اقتراحات خطط التطوير وأسئلة الجلسات الفردية | `public/src/devplan.js` |
| الإرشادات ونصائح الثنائيات | `public/src/guidance.js` |
| ملاحظات الفريق | `public/src/team.js` |
| الألوان والخطوط | أعلى `public/styles.css` |

## قبل أن ترسله للفريق

- **اشرح الهدف أولاً.** النتائج تصلك تلقائياً بعد موافقة العضو، فقل صراحة إنها لن تُستخدم في التقييم أو القرارات الوظيفية، والتزم بذلك. المشاركة اختيارية: من لا يوافق لا يبدأ.
- **ناقش النتيجة مع الشخص نفسه.** النتيجة بداية حوار لا حكم. اسأل كل عضو في جلسة فردية: «هل هذا يشبهك؟ ما الذي لا ينطبق عليك؟» واكتبا خطة التطوير معاً.
- **حدود علمية:**
  - DISC والأنماط الستة عشر مفيدة كلغة مشتركة، لكن قدرتها على التنبؤ بالأداء ضعيفة، والحروف القريبة من المنتصف قد تتغير عند إعادة الاختبار.
  - Big Five هو الأقوى بحثياً، لكن الترجمة العربية هنا غير مُختبرة علمياً.
- **الأنماط الستة عشر هنا ليست اختبار 16Personalities ولا MBTI®.** الأسئلة وأسماء الأنماط وأوصافها من تأليف هذا الموقع.
- **صياغة الإرشادات بصيغة المذكر.** العناوين تستخدم اسم الشخص، لكن جمل الإرشادات نفسها («أعطه»، «اسأله») بصيغة المذكر.
- **البيانات المحفوظة:**
  - من العضو: الاسم والدور والدرجات وتواريخ الاختبارات.
  - منك كقائد: المعلومات والخطة والملاحظات.
  - لا إجابات خام. ملفات التصدير بيانات شخصية؛ احفظها في مكان آمن.

---

<a id="english"></a>

## English

A small bilingual (Arabic/English) site where team members take three short assessments, and each result reaches the team lead's dashboard automatically. The dashboard turns results into practical guidance and a development plan per person, and exports a full folder per member.

**Assessments**

- DISC: 24 original items.
- 16 Types: 32 original items. Four preferences (E/I, S/N, T/F, J/P) combine into one of 16 types, each with an original name, portrait, strengths, watch-outs, how to lead them and growth ideas. This is not 16Personalities or the MBTI®.
- Big Five: the 20-item Mini-IPIP by Donnellan, Oswald, Baird & Lucas (2006), *Psychological Assessment, 18*(2), 192–203. Its IPIP items are in the public domain.

**Members**

- Enter a name and tick one consent line before starting.
- Each finished result is sent automatically with its date.
- A retake or a name change updates the lead's copy.
- Members can withdraw everything from My profile, which also stops automatic sending.
- Raw answers never leave the device.

**Lead dashboard**

- **Team table:** with search.
- **Team picture:** style mix, type groups and team observations.
- **Member page:** four tabs.
  - **Results:** the full result of every assessment.
  - **How to work together:** the guide, plus a tip for your pairing.
  - **Development plan:** focus, goals with due dates and status, support and the next review date. Comes with suggestions from the member's results and 1:1 questions. Autosaves.
  - **Info and notes:** team, email, phone, start date and dated 1:1 notes.
- **Exports:** a ZIP for the whole team, or for one member. Each member folder holds `profile.html`, `development-plan.html`, `notes.md` and `data.json`; the team ZIP adds `team-overview.html`, `team.csv` and a README.

**Privacy model**

- The server stores name, role, scores, completion dates and dates, plus a SHA-256 hash of each member's edit token.
- The lead's records (info, plan, notes) are readable only with the admin passcode.

**Deploy to Vercel**

1. Push this folder to GitHub.
2. Import it in Vercel with framework preset **Other** and no build command (`vercel.json` serves `public/`).
3. Add **Upstash for Redis** from the Vercel Marketplace (Storage tab). It sets `KV_REST_API_URL`/`KV_REST_API_TOKEN`; `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` also work. **Without it, results can't arrive automatically.**
4. Set `ADMIN_PASSCODE`, and optionally `TEAM_CODE`.
5. Redeploy, then open `/#lead`. A green line saying results arrive automatically confirms the database is connected.

Without a database, host `public/` on any static host. Members then send result codes, which the lead imports. Plans and notes stay on the lead's device, and a demo team lets you try the dashboard.

**API**

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/config` | Storage mode and settings |
| POST | `/api/submit` | Send or update results (`TEAM_CODE` checked) |
| POST | `/api/withdraw` | Member deletes their results |
| GET / DELETE | `/api/admin/members` | Lead only; needs the `x-admin-passcode` header |
| GET / PUT | `/api/admin/records` | Lead only: info, development plan and notes per member |

**Local:** `npm run dev` (Node 18+, passcode `dev`), `npm test`.

**Use responsibly:** for conversations and development, not for hiring, ratings, promotion or discipline.
