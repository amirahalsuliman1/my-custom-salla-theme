# Builds help/site/index.html — the merchant guide as a web page (published as an
# Artifact and linked as «ملف المساعدة»). Same content source as build-help-guide.py:
# twilight.json, so the guide always says what the editor says.
import json, re, html
ROOT = '/Users/amirahalsuliman/my-custom-salla-theme'
d = json.load(open(f'{ROOT}/twilight.json'))
ar = lambda v: (v.get('ar') or v.get('en') or '') if isinstance(v, dict) else (v or '')
esc = lambda s: html.escape(str(s))

def fields_html(fields):
    out = []
    for f in fields:
        if f.get('type') == 'static':
            continue
        lab = ar(f.get('label')) or ar(f.get('title')) or 'العناصر'
        desc = ar(f.get('description'))
        if f.get('type') == 'collection' or f.get('format') == 'collection':
            out.append(f'<li><span class="k">{esc(lab)}</span><span class="v">قائمة عناصر تضيفها بزر «إضافة». {esc(desc)}</span><ul class="sub">{fields_html(f.get("fields", []))}</ul></li>')
        else:
            out.append(f'<li><span class="k">{esc(lab)}</span>{("<span class=v>" + esc(desc) + "</span>") if desc else ""}</li>')
    return ''.join(out)

groups, cur = [], None
for s in d['settings']:
    if s.get('type') == 'static' and s.get('format') == 'title':
        t = re.sub(r'^\d+\s*', '', re.sub(r'\s+', ' ', re.sub('<[^>]+>', ' ', s.get('value', ''))).strip())
        cur = {'title': t, 'items': []}; groups.append(cur); continue
    if s.get('type') == 'static' or cur is None:
        continue
    cur['items'].append(s)

settings_html = ''.join(
    f'<section class="group" id="s{i}"><h3><span class="num">{i}</span>{esc(g["title"])}</h3><ul class="fields">{fields_html(g["items"])}</ul></section>'
    for i, g in enumerate(groups, 1))
comp_html = ''.join(
    f'<section class="group"><h3>{esc(ar(c.get("title")))}</h3><ul class="fields">{fields_html(c.get("fields", []))}</ul></section>'
    for c in d.get('components', []))
toc_settings = ''.join(f'<a href="#s{i}">{esc(g["title"])}</a>' for i, g in enumerate(groups, 1))

page = '''<title>دليل ثيم أملاس</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;700&family=Noto+Kufi+Arabic:wght@500;700&display=swap">
<style>
/* Layout: one reading column with a sticky index on wide screens; the theme's own warm neutrals. */
:root {
  --page: #fdfdfd; --panel: #f7f6f4; --line: #edebe8; --ink: #1b1b1b; --muted: #646361; --accent: #646361;
  --display: "Noto Kufi Arabic", "Geeza Pro", Tahoma, sans-serif;
  --body: "IBM Plex Sans Arabic", "SF Arabic", "Geeza Pro", Tahoma, sans-serif;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --page: #141413; --panel: #1f1e1d; --line: #33312f; --ink: #f2f1ee; --muted: #b3b0aa; --accent: #d8d5cf; color-scheme: dark } }
:root[data-theme="dark"] { --page: #141413; --panel: #1f1e1d; --line: #33312f; --ink: #f2f1ee; --muted: #b3b0aa; --accent: #d8d5cf; color-scheme: dark }
body { background: var(--page); color: var(--ink); font-family: var(--body); font-size: 16px; line-height: 1.8; }
.wrap { max-width: 1120px; margin-inline: auto; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 40px 64px; }
header.intro { display: grid; gap: 28px; padding-block-end: 40px; border-bottom: 1px solid var(--line); }
.brand { font-family: var(--display); letter-spacing: .02em; color: var(--muted); font-size: 14px; }
h1 { font-family: var(--display); font-size: clamp(30px, 5vw, 48px); line-height: 1.3; margin: 0; text-wrap: balance; }
.lead { color: var(--muted); font-size: 18px; max-width: 60ch; margin: 0; }
.hero { width: 100%; max-width: 100%; border-radius: 16px; border: 1px solid var(--line); display: block; }
.layout { display: grid; gap: 40px; margin-top: 40px; }
@media (min-width: 960px) { .layout { grid-template-columns: 220px minmax(0, 1fr); } nav.toc { position: sticky; top: calc(env(safe-area-inset-top, 0px) + 24px); align-self: start; } }
nav.toc { display: flex; flex-direction: column; gap: 4px; font-size: 14px; }
nav.toc .label { font-size: 12px; color: var(--muted); letter-spacing: .04em; margin-top: 12px; }
nav.toc a { color: var(--ink); text-decoration: none; padding: 4px 10px; border-radius: 8px; }
nav.toc a:hover, nav.toc a:focus-visible { background: var(--panel); outline: none; }
main { min-width: 0; display: flex; flex-direction: column; gap: 56px; }
h2 { font-family: var(--display); font-size: 26px; margin: 0 0 16px; text-wrap: balance; }
h3 { font-size: 18px; margin: 0 0 10px; display: flex; align-items: center; gap: 10px; }
.num { display: inline-grid; place-items: center; min-width: 28px; height: 28px; border-radius: 999px; background: var(--accent); color: var(--page); font-size: 14px; font-variant-numeric: tabular-nums; }
p { margin: 0 0 12px; max-width: 70ch; }
ol.steps { margin: 0; padding-inline-start: 22px; display: grid; gap: 10px; max-width: 70ch; }
.note { background: var(--panel); border-radius: 12px; padding: 16px 20px; max-width: 70ch; }
.group { padding-block: 18px; border-top: 1px solid var(--line); }
ul.fields { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
ul.fields li { display: grid; gap: 2px; }
ul.fields .k { font-weight: 700; }
ul.fields .v { color: var(--muted); font-size: 15px; }
ul.sub { list-style: none; margin: 6px 0 0; padding-inline-start: 16px; border-inline-start: 2px solid var(--line); display: grid; gap: 8px; }
.pages { display: grid; gap: 28px; }
.pages figure { margin: 0; display: grid; gap: 10px; }
.pages img { width: 100%; max-width: 100%; border-radius: 12px; border: 1px solid var(--line); display: block; }
figcaption { color: var(--muted); max-width: 70ch; }
.faq h3 { font-size: 16px; margin-top: 18px; }
footer { margin-top: 56px; color: var(--muted); font-size: 14px; border-top: 1px solid var(--line); padding-top: 20px; }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }
html { scroll-behavior: smooth; }
</style>
<div class="wrap" dir="rtl" lang="ar">
<header class="intro">
  <div class="brand">AM1ALS · أملاس</div>
  <h1>دليل ثيم أملاس</h1>
  <p class="lead">كل ما تحتاجه لتجهيز متجرك وتخصيصه من محرر سلة، بدون أي برمجة. كل نص وصورة ولون وقسم في الثيم يتغير من المحرر.</p>
  <img class="hero" src="screenshots/01-home.jpg" alt="الصفحة الرئيسية لثيم أملاس" width="1600" height="1200">
</header>
<div class="layout">
<nav class="toc" aria-label="محتويات الدليل">
  <span class="label">المحتويات</span>
  <a href="#start">البداية السريعة</a>
  <a href="#home">أقسام الصفحة الرئيسية</a>
  <a href="#stories">صفحة تجارب عملائنا</a>
  <a href="#settings">إعدادات الثيم</a>
  TOC_SETTINGS
  <a href="#pages">صفحات الثيم</a>
  <a href="#faq">أسئلة شائعة</a>
</nav>
<main>
<section id="start">
  <h2>البداية السريعة</h2>
  <ol class="steps">
    <li>بعد تثبيت الثيم افتح <b>المتجر ← تخصيص الثيم</b>.</li>
    <li>افتح <b>خيارات التصميم</b> واضغط <b>«حفظ التغييرات»</b> مرة واحدة حتى لو لم تغيّر شيئًا، لتُطبَّق القيم الافتراضية للثيم.</li>
    <li>من «الهوية والألوان» اضبط <b>لون خلفية الأزرار</b> و<b>لون نصّ الأزرار</b> معًا. ألوان التصميم الأصلي: الخلفية ‎#646361‎ والنص ‎#FDFDFD‎.</li>
    <li>من <b>عناصر الصفحة</b> أضف أقسام الرئيسية ورتّبها بالسحب، وعبّئ صورها ونصوصها.</li>
    <li>أضف <b>قائمة التذييل</b> من لوحة سلة ← القوائم لتظهر «روابط مهمة».</li>
    <li>من إعدادات سلة فعّل التقييمات في صفحة المنتج، وكود الخصم في السلة، وبرنامج الولاء إن كنت تستخدمه. الثيم جاهز لها.</li>
  </ol>
</section>
<section id="home">
  <h2>أقسام الصفحة الرئيسية</h2>
  <p>تضاف من <b>عناصر الصفحة ← إضافة عنصر جديد</b>، وتُرتّب بالسحب، ويمكن تكرار القسم أكثر من مرة.</p>
  COMP_HTML
  <div class="note"><b>نقاط المنتجات على الصور</b> (صورة تسوّق تفاعلية وتجارب عملائنا): مكان النقطة نسبة مئوية من الصورة. الأفقية من 0 عند اليمين إلى 100 عند اليسار، والرأسية من 0 أعلى الصورة إلى 100 أسفلها. ثم اختر المنتج، وتُجلب صورته وسعره تلقائيًا.</div>
</section>
<section id="stories">
  <h2>صفحة «تجارب عملائنا» الكاملة</h2>
  <ol class="steps">
    <li>أنشئ صفحة من نوع «صفحة مخصّصة» في لوحة سلة.</li>
    <li>ضع فيها قسم «تجارب عملائنا».</li>
    <li>انسخ رقم الصفحة من رابطها، وضعه في خيارات التصميم ← «الطلبات والصفحات» ← «رقم صفحة تجارب عملائنا». تظهر عندها شرائح التصنيفات وقائمة البراندات أعلى القسم.</li>
  </ol>
</section>
<section id="settings">
  <h2>إعدادات الثيم</h2>
  <p>في <b>خيارات التصميم</b>، مقسّمة إلى مجموعات مرقّمة كما تظهر في المحرر.</p>
  SETTINGS_HTML
</section>
<section id="pages" class="pages">
  <h2>صفحات الثيم</h2>
  <figure><img src="screenshots/02-product.jpg" alt="صفحة المنتج" width="1600" height="1200" loading="lazy"><figcaption><b>صفحة المنتج:</b> معرض صور بمصغّرات، خيارات المنتج، زر إضافة يثبت أسفل الشاشة عند التمرير، أقسام الشحن والتنويه، وآخر تجارب العملاء.</figcaption></figure>
  <figure><img src="screenshots/03-category.jpg" alt="صفحة التصنيف" width="1600" height="1200" loading="lazy"><figcaption><b>التصنيفات والعروض والبحث:</b> شبكة منتجات بالترتيب والفلاتر (تُفعّل الفلاتر من لوحة سلة). المنتج الموجود في السلة يظهر عليه «− 1 +» لتعديل الكمية من البطاقة مباشرة.</figcaption></figure>
  <figure><img src="screenshots/05-cart.jpg" alt="سلة المشتريات" width="1600" height="1200" loading="lazy"><figcaption><b>السلة:</b> المنتجات وخياراتها والكمية، وملخص الطلب وزر الإتمام من سلة. يمكنك إضافة بنر أعلاها من «صفحات القوائم والسلة والبنرات».</figcaption></figure>
</section>
<section id="faq" class="faq">
  <h2>أسئلة شائعة</h2>
  <h3>غيّرت إعدادًا ولم يظهر؟</h3><p>اضغط «حفظ التغييرات» ثم حدّث صفحة المتجر تحديثًا كاملًا (Ctrl أو ⌘ + Shift + R).</p>
  <h3>لماذا لا تظهر «روابط مهمة» في التذييل؟</h3><p>قائمة التذييل فارغة. أضفها من لوحة سلة ← القوائم.</p>
  <h3>لماذا لا تظهر التقييمات أو المنتجات المشابهة؟</h3><p>التقييمات تُفعّل من إعدادات التقييمات في سلة، والمنتجات المشابهة تعتمد على وجود منتجات مشابهة في متجرك.</p>
  <h3>هل يدعم الثيم الإنجليزية والوضع الداكن؟</h3><p>نعم. كل النصوص مترجمة للعربية والإنجليزية، والوضع الداكن في مجموعة «الوضع الداكن».</p>
</section>
</main>
</div>
<footer>دليل ثيم أملاس لمتاجر سلة.</footer>
</div>'''
page = page.replace('TOC_SETTINGS', toc_settings).replace('COMP_HTML', comp_html).replace('SETTINGS_HTML', settings_html)
import os
os.makedirs(f'{ROOT}/help/site', exist_ok=True)
open(f'{ROOT}/help/site/index.html', 'w').write(page)
print('ok', len(page))
