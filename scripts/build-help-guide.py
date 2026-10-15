# Builds help/guide.html — the merchant guide uploaded as «ملف المساعدة» — from twilight.json.
# PDF: Chrome --headless=new --no-pdf-header-footer --print-to-pdf=help/almas-theme-guide.pdf file://<repo>/help/guide.html
import json, re, html, sys
ROOT = '/Users/amirahalsuliman/my-custom-salla-theme'
d = json.load(open(f'{ROOT}/twilight.json'))
ar = lambda v: (v.get('ar') or v.get('en') or '') if isinstance(v, dict) else (v or '')
esc = lambda s: html.escape(str(s))

def fields_html(fields, depth=0):
    out = []
    for f in fields:
        if f.get('type') == 'static':
            continue
        lab = ar(f.get('label')) or ar(f.get('title')) or ar(f.get('item_label')) or 'العناصر'
        desc = ar(f.get('description'))
        if f.get('type') == 'collection' or f.get('format') == 'collection':
            out.append(f'<li><b>{esc(lab)}</b> — قائمة عناصر، تضيفين منها ما تحتاجين بزر «إضافة». {esc(desc)}<ul>{fields_html(f.get("fields", []), depth+1)}</ul></li>')
        else:
            out.append(f'<li><b>{esc(lab)}</b>{(" — " + esc(desc)) if desc else ""}</li>')
    return ''.join(out)

# settings grouped by the numbered static titles
groups, cur = [], None
for s in d['settings']:
    if s.get('type') == 'static' and s.get('format') == 'title':
        t = re.sub(r'\s+', ' ', re.sub('<[^>]+>', ' ', s.get('value', ''))).strip()
        t = re.sub(r'^\d+\s*', '', t)
        cur = {'title': t, 'items': []}; groups.append(cur); continue
    if s.get('type') == 'static' or cur is None:
        continue
    cur['items'].append(s)

settings_html = ''
for i, g in enumerate(groups, 1):
    settings_html += f'<h3>{i}. {esc(g["title"])}</h3><ul>{fields_html(g["items"])}</ul>'

comp_html = ''
for c in d.get('components', []):
    comp_html += f'<h3>{esc(ar(c.get("title")))}</h3><ul>{fields_html(c.get("fields", []))}</ul>'

page = f'''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>دليل ثيم أملاس</title>
<style>
@page {{ size: A4; margin: 18mm 16mm; }}
body {{ font-family: "SF Arabic", "Geeza Pro", "Noto Naskh Arabic", sans-serif; color: #1b1b1b; font-size: 11.5pt; line-height: 1.75; }}
h1 {{ font-size: 26pt; margin: 0 0 6pt; color: #646361; }}
h2 {{ font-size: 16pt; color: #646361; border-bottom: 1px solid #edebe8; padding-bottom: 4pt; margin-top: 22pt; page-break-after: avoid; }}
h3 {{ font-size: 12.5pt; margin: 14pt 0 4pt; page-break-after: avoid; }}
ul {{ margin: 0; padding-inline-start: 18pt; }} li {{ margin: 2pt 0; }}
.cover {{ page-break-after: always; text-align: center; padding-top: 30mm; }}
.cover img {{ width: 100%; border-radius: 10pt; margin-top: 14mm; box-shadow: 0 4pt 18pt rgba(0,0,0,.12); }}
.lead {{ color: #646361; font-size: 13pt; }}
.box {{ background: #f7f6f4; border-radius: 8pt; padding: 10pt 14pt; margin: 10pt 0; }}
ol li {{ margin: 4pt 0; }}
.shot {{ width: 100%; border-radius: 8pt; margin: 8pt 0; border: 1px solid #edebe8; }}
section {{ page-break-inside: auto; }}
</style></head><body>
<div class="cover"><h1>دليل ثيم أملاس</h1><p class="lead">كل ما تحتاجه لتجهيز متجرك وتخصيصه من محرر سلة، بدون أي برمجة.</p>
<img src="file://{ROOT}/screenshots/01-home.png"></div>

<h2>البداية السريعة</h2>
<ol>
<li>بعد تثبيت الثيم افتح <b>المتجر ← تخصيص الثيم</b>.</li>
<li>افتح <b>خيارات التصميم</b> واضغط <b>«حفظ التغييرات»</b> مرة واحدة حتى لو لم تغيّر شيئًا، لتُطبَّق القيم الافتراضية للثيم.</li>
<li>من «الهوية والألوان»: اضبط <b>لون خلفية الأزرار</b> و<b>لون نصّ الأزرار</b> معًا (لون التصميم الأصلي: خلفية ‎#646361‎ ونص ‎#FDFDFD‎).</li>
<li>من <b>عناصر الصفحة</b> أضف أقسام الرئيسية ورتّبها بالسحب، وعبّئ صورها ونصوصها.</li>
<li>أضف <b>قائمة التذييل</b> من لوحة سلة ← القوائم، لتظهر «روابط مهمة».</li>
<li>من إعدادات سلة: فعّل التقييمات في صفحة المنتج، وكود الخصم في السلة، وبرنامج الولاء إن كنت تستخدمه — الثيم جاهز لها.</li>
</ol>
<div class="box">كل نصوص الثيم وصوره وألوانه وأقسامه قابلة للتعديل من المحرر. وكل حقل في المحرر يشرح نفسه بسطر تحت اسمه.</div>

<h2>أقسام الصفحة الرئيسية</h2>
<p>تضاف من <b>عناصر الصفحة ← إضافة عنصر جديد</b>، وتُرتّب بالسحب، ويمكن تكرار القسم أكثر من مرة.</p>
{comp_html}
<div class="box"><b>نقاط المنتجات على الصور (صورة تسوّق تفاعلية وتجارب عملائنا):</b> مكان النقطة يُكتب كنسبة مئوية من الصورة — الأفقية من 0 (يمين) إلى 100 (يسار)، والرأسية من 0 (أعلى) إلى 100 (أسفل) — ثم اختر المنتج. في معاينة المحرر يمكنك الضغط على الصورة لتعرف النسبة.</div>

<h2>صفحة «تجارب عملائنا» الكاملة</h2>
<ol><li>أنشئ صفحة من نوع «صفحة مخصّصة» في لوحة سلة.</li><li>ضع فيها قسم «تجارب عملائنا».</li><li>انسخ رقم الصفحة من رابطها، وضعه في خيارات التصميم ← «الطلبات والصفحات» ← «رقم صفحة تجارب عملائنا»، فتظهر شرائح التصنيفات وقائمة البراندات أعلى القسم.</li></ol>

<h2>إعدادات الثيم (خيارات التصميم)</h2>
<p>مقسّمة إلى مجموعات مرقّمة كما تظهر في المحرر:</p>
{settings_html}

<h2>صفحات الثيم</h2>
<img class="shot" src="file://{ROOT}/screenshots/02-product.png">
<p><b>صفحة المنتج:</b> معرض صور بمصغّرات، خيارات المنتج، زر إضافة يثبت أسفل الشاشة عند التمرير، أقسام الشحن والتنويه، وآخر تجارب العملاء.</p>
<img class="shot" src="file://{ROOT}/screenshots/03-category.png">
<p><b>صفحات التصنيفات والعروض والبحث:</b> شبكة منتجات بالترتيب والفلاتر (تُفعّل الفلاتر من لوحة سلة). المنتج الموجود في السلة يظهر عليه «− 1 +» لتعديل الكمية من البطاقة مباشرة.</p>
<img class="shot" src="file://{ROOT}/screenshots/05-cart.png">
<p><b>السلة:</b> المنتجات وخياراتها والكمية، وملخص الطلب وزر الإتمام من سلة. يمكنك إضافة بنر أعلاها من «صفحات القوائم والسلة والبنرات».</p>

<h2>أسئلة شائعة</h2>
<h3>غيّرت إعدادًا ولم يظهر؟</h3><p>اضغط «حفظ التغييرات» ثم حدّث صفحة المتجر تحديثًا كاملًا (Ctrl/⌘ + Shift + R).</p>
<h3>لماذا لا تظهر «روابط مهمة» في التذييل؟</h3><p>لأن قائمة التذييل فارغة في لوحة سلة ← القوائم.</p>
<h3>لماذا لا تظهر التقييمات أو المنتجات المشابهة؟</h3><p>التقييمات تُفعّل من إعدادات التقييمات في سلة، والمنتجات المشابهة تعتمد على وجود منتجات مشابهة في متجرك.</p>
<h3>هل يدعم الثيم الإنجليزية والوضع الداكن؟</h3><p>نعم: كل النصوص مترجمة للعربية والإنجليزية، والوضع الداكن من مجموعة «الوضع الداكن».</p>
</body></html>'''
open(f'{ROOT}/help/guide.html', 'w').write(page)
print('ok', len(page))
