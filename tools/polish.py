# Editorial polish applied to the built English pages (and English fallback text on /zh/ pages).
# Layout untouched: only text strings and three hrefs change. Run after build.py.
import os, re, sys, glob
OUT = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('YD_OUT', '.')
ENT = {'’':'&#8217;','‘':'&#8216;','“':'&#8220;','”':'&#8221;','–':'&#8211;','—':'&#8212;','…':'&#8230;'}
def ent(s):
    for k,v in ENT.items(): s = s.replace(k,v)
    return s

ALL = [  # (old, new) applied on every page where found
 ('href="asiar.hk"', 'href="https://asiar.hku.hk/"'),
 ('href="//www.lantenstories.com"', 'href="https://www.lantenstories.com"'),
 ('Asian Religions Connections', 'Asian Religious Connections'),
 ('Copyright © 2021', 'Copyright © 2026'),
 ('National Cheng Chi University', 'National Chengchi University'),
 ('Hong Kong University, <a', 'The University of Hong Kong, <a'),
]
PAGE = {
 'index.html': [
  ('and compares their modern-day culture', 'and to compare their modern-day culture'),
 ],
 'daoism-among-the-yao/index.html': [
  ('Shiradori 1975', 'Shiratori 1975'),
  ('Johnsson 2000', 'Jonsson 2000'), ('Johnsson 2005, 2014', 'Jonsson 2005, 2014'),
  ('who in turn constitutes one of', 'who in turn constitute one of'),
  ('瑤族</span><em>người Dao', '瑤族</span>, <em>người Dao'),
  ('Qing Dynasty (1644 to 1912)', 'Qing dynasty (1644–1912)'),
  ('until the 1890s, henceforth, they constituted', 'until the 1890s and thus constituted'),
  ('Kim Mun language (Mienic-Hmong family)', 'Kim Mun language (Mienic branch of the Hmong-Mien family)'),
 ],
 'events/index.html': [
  ('Yao Dao Projects Events', 'Yao Dao Project Events'),
  ('Institute for the Study of the Yao Culture, Kanagawa Universty', 'Institute for the Study of Yao Culture, Kanagawa University'),
 ],
 'films/index.html': [
  ('the Lao Department of Foreign Affairs and Trade (DFAT)', 'the Australian Department of Foreign Affairs and Trade (DFAT)'),
  ('and the Lao Department of Foreign Affairs and Trade.', 'and the Australian Department of Foreign Affairs and Trade.'),
  ('the Lao government (MoES, MoICT, and DFAT) approved', 'the Lao government (MoES and MoICT) and DFAT approved'),
  ('met Peter Livermore in Luang Namtha. A prolific English filmmaker with more than twenty years of experience working in Laos (at that time). Peter was, indeed, filming another documentary for BEQUAL-Laos.',
   'met Peter Livermore in Luang Namtha, a prolific English filmmaker who had by then worked in Laos for more than twenty years and was filming another documentary for BEQUAL-Laos.'),
  ('Nam Dee and Namlue were', 'Nam Dee and Nam Lue were'),
  ('The film’s twenty-nine minutes provide', 'Its twenty-nine minutes provide'),
 ],
 'films/ethnofilms/index.html': [
  ('A 18-minute version', 'An 18-minute version'),
 ],
 'genesis/index.html': [
  ('Joseba Estevez, who is the Senior Research Assistant for this project', 'Joseba Estevez, then the Senior Research Assistant for this project'),
  ('during which Mr. Estevez learned', 'during which Estevez learned'),
  ('During this research, Mr Estevez acquired', 'During this research, Estevez acquired'),
  ('acquiring a comprehensive local view', 'gaining a comprehensive local view'),
  ('This holistic ethnological study is the subject of Mr. Estevez’s doctoral dissertation, to be submitted to the University of Münster in April 2020.',
   'This holistic ethnological study became Estevez’s doctoral dissertation, completed at the University of Münster in 2023 and recognised with the 2024 Frobenius Research Award.'),
  ('outside of Mr. Estevez’s field', 'outside of Estevez’s field'),
 ],
 'manuscripts/index.html': [
  ('started in 2012 with the digitalisation of', 'started in 2012 with the digitisation of'),
  ('the urgent task of digitalising all', 'the urgent task of digitising all'),
  ('the Institute of Humanities and Social Sciences of the University of Hong Kong', 'the Hong Kong Institute for the Humanities and Social Sciences of the University of Hong Kong'),
  ('in the digitalisation of Buddhist palm-leaf', 'in the digitisation of Buddhist palm-leaf'),
  ('The digitalisation of the Lanten corpus', 'The digitisation of the Lanten corpus'),
  ('the Lanten community  achieved', 'the Lanten community achieved'),
  ('digitised and, therefore, preserved, more than', 'digitised, and thereby preserved, more than'),
  ('texts and, thus,  make them', 'texts and thus make them'),
  ('(first, seven, ten)', '(the first, seventh and tenth)'),
  ('The Lanten manuscripts are comprised of living texts', 'The Lanten manuscripts consist of living texts'),
  ('additional interpretations or precisions', 'additional interpretations or clarifications'),
  ('The Yao Dao combines a multidisciplinary approach to the Lanten manuscripts as living corpus', 'The Yao Dao Project takes a multidisciplinary approach to the Lanten manuscripts as a living corpus'),
  ('Each ceremony constitutes a case of study', 'Each ceremony constitutes a case study'),
  ('was completed for good, enabling', 'was completed, enabling'),
 ],
 'oral-stories/index.html': [
  ('Ms. Khanthamaly Yangnouvong,  Director-General', 'Ms. Khanthamaly Yangnouvong, Director-General'),
  ('Hence, the team invited different artists, each with their own techniques and approaches in their repertoire, who were invited to provide the potential readers with as many styles and motifs as possible.',
   'Hence, the team invited different artists, each with their own techniques and approaches, to offer readers as many styles and motifs as possible.'),
  ('in order to upkeep the Lanten culture', 'in order to keep the Lanten culture'),
  ('Souliya Phoumivong,  animator', 'Souliya Phoumivong, animator'),
  ('a stop- motion short film', 'a stop-motion short film'),
  ('is in our wish-list agenda ~', 'is on our wish list.'),
  ('Co-Is Joseba estevez', 'Co-Is Joseba Estevez'),
  ('the creation of new contents', 'the creation of new content'),
  ('collected  115 stories', 'collected 115 stories'),
 ],
 'research/index.html': [
  ('at Hong Kong University and the Chinese University', 'at the University of Hong Kong and the Chinese University'),
  ('various research proposals and clearer road map', 'various research proposals and a clearer road map'),
  ('Joseba  Estevez has been adopted', 'Joseba Estevez has been adopted'),
  ('the University Hong Kong, and the National Library', 'the University of Hong Kong, and the National Library'),
  ('His  research has focused on the Lanten mortuary death rituals', 'His research has focused on the Lanten mortuary rituals'),
  ('which are the focus of his PhD thesis.', 'the subject of his PhD thesis (HKU, 2025).'),
  ('Guo Huiwen  produced', 'Guo Huiwen produced'),
  ('have been carrying the essential task of transcribing and studying the selection of living ritual manuscripts in use employed in the ceremonies',
   'have been carrying out the essential task of transcribing and studying selected living ritual manuscripts employed in the ceremonies'),
  ('those of especial significance', 'those of special significance'),
  ('The irruption of the COVID-19 pandemic and the ongoing international lockdowns resulted in the postponing of',
   'The outbreak of the COVID-19 pandemic and the international lockdowns that followed led to the postponement of'),
  ('presented its fruits as it allowed us', 'bore fruit, as it allowed us'),
 ],
 'team/index.html': [
  ('May-October 2020 [now virtual)', 'May–October 2020 (now virtual)'),
  ('</a> is an awarded as HKU Presidential PhD Scholar at', '</a> completed his PhD in 2025 as an HKU Presidential PhD Scholar at'),
  ('His latest publication is ', 'His publications include '),
  ('by her expertise in Chinese-text editing', 'with her expertise in Chinese-text editing'),
  ('graduate in 2022', 'graduated in 2022'), ('graduate in 2023', 'graduated in 2023'), ('graduate in 2024', 'graduated in 2024'),
  ('a keen interest on cultures', 'a keen interest in cultures'),
  ('is currently  a Student', 'is currently a Student'),
  ('is an Archi beginner, manga fan, and cinephile', 'is a budding architect, manga fan, and cinephile'),
 ],
}
PUB = '''<p style="text-align: justify;"><span style="color: #333333;">Estevez, Joseba. 2016a. “Learning ‘Shamanistic Healing’ among the Lanten (Yao Mun) of Laos.” Photo essay in <em>Global Modernities and the (Re-)Emergence of Ghosts</em>, edited by Oliver Tappe et al. Special online issue. Cologne: Global South Studies Center, University of Cologne.</span></p>
<p style="text-align: justify;"><span style="color: #333333;">———. 2016b. “Healing and Cursing among the Lanten (Yao Mun) of Laos.” In <em>Parts and Wholes: Essays on Social Morphology, Cosmology, and Exchange in Honour of J. D. M. Platenkamp</em>, edited by Laila Prager, Michael Prager, and Guido Sprenger. Münster: Lit Verlag.</span></p>
<p style="text-align: justify;"><span style="color: #333333;">———. 2019. “On Becoming a Ritual Master among the Lanten—Yao Mun—of Laos.” In <em>Integrating Strangers in Society: Perspectives from Elsewhere</em>, edited by Jos D. M. Platenkamp and Almut Schneider, 111–30. Cham: Palgrave Macmillan. <a href="https://doi.org/10.1007/978-3-030-16703-5_7" target="_blank" rel="noopener">https://doi.org/10.1007/978-3-030-16703-5_7</a>.</span></p>
<p style="text-align: justify;"><span style="color: #333333;">———. 2022. “Landianyao shouchaoben: Yishi zhishi chuancheng zhong de faqi” 藍靛瑤手抄本：儀式知識傳承中的法器 [Lanten manuscripts: Ritual objects in the transmission of ritual knowledge]. <em>Huaren zongjiao yanjiu</em> 華人宗教研究 [Studies in Chinese Religions] 19: 65–112.</span></p>
<p style="text-align: justify;"><span style="color: #333333;">———. 2023. “Conquering Demons, Taming the Forest: The Ritual Roles of the Lanten Priests and Masters.” PhD diss., University of Münster. Frobenius Research Award 2024.</span></p>
<p style="text-align: justify;"><span style="color: #333333;">———. 2024. “On the Lanten Methods to Fetch the Hon or Living Force of the Original Rice.” In <em>Vernacular Chinese-Character Manuscripts from East and Southeast Asia</em>, edited by David Holm, 191–242. Studies in Manuscript Cultures 40. Berlin: De Gruyter. <a href="https://doi.org/10.1515/9783111382746-008" target="_blank" rel="noopener">https://doi.org/10.1515/9783111382746-008</a>.</span></p>
<p style="text-align: justify;"><span style="color: #333333;">Estevez, Joseba, and David A. Palmer. 2024. “Ritual, War, and Opium: Infrastructural Sedimentations in the Ethnohistory of the Mun (Lanten Yao) of Laos.” <em>Modern Asian Studies</em> 58 (5): 1299–1341. <a href="https://doi.org/10.1017/S0026749X24000222" target="_blank" rel="noopener">https://doi.org/10.1017/S0026749X24000222</a>.</span></p>
<p style="text-align: justify;"><span style="color: #333333;">Estevez, Joseba, and Khanthamaly Yangnouvong, eds. 2020. <em>The Lanten Stories</em>. 13 vols. Vientiane: National Library of Laos; Phankam Jampa.</span></p>
<p style="text-align: justify;"><span style="color: #333333;">Guo Huiwen 郭慧雯, Joseba Estévez 周思博, An Wei 安蔚, Sun Jiayue 孫嘉玥, and David A. Palmer 宗樹人. 2022. “<em>Laowo Landianyao wenku</em>: Tantao wenben shouji, bianmu, fenlei he pinggu de fangfa yu xiangguan wenti” 《老撾藍靛瑤文庫》：探討文本收集、編目、分類和評估的方法與相關問題 [The textual corpus of the Lanten Yao of Laos: Methodological issues in the collection, cataloguing, classification and evaluation of manuscripts]. <em>Huaren zongjiao yanjiu</em> 華人宗教研究 [Studies in Chinese Religions] 19: 25–64.</span></p>
<p style="text-align: justify;"><span style="color: #333333;">Palmer, David A. 2019. “Cosmology, Gender, Structure, and Rhythm: Marcel Granet and Chinese Religion in the History of Social Theory.” <em>Review of Religion and Chinese Society</em> 6 (2): 160–87. <a href="https://doi.org/10.1163/22143955-00602002" target="_blank" rel="noopener">https://doi.org/10.1163/22143955-00602002</a>.</span></p>
<p style="text-align: justify;"><span style="color: #333333;">Tse, Martin M. H. 謝孟謙. 2022. “Landianyao dui Daojiao yishi kuangjia de yingyong: Fenxi Poyu yishi de wenben” 藍靛瑤對道教儀式框架的應用——分析破獄儀式的文本 [The Daoist Lingbao ritual framework among the Lanten Yao of Luang Namtha, Laos: The texts of the Attack on Hell ritual]. <em>Huaren zongjiao yanjiu</em> 華人宗教研究 [Studies in Chinese Religions] 19: 113–46. <a href="https://doi.org/10.6720/SCR.202201_(19).0005" target="_blank" rel="noopener">https://doi.org/10.6720/SCR.202201_(19).0005</a>.</span></p>'''
FORTH = '''<p style="text-align: justify;"><span style="color: #333333; font-size: 19px;">Estevez, Joseba. Forthcoming. “The Manuscripts of the Lanten Yao: Ritual Objects in the Production and Transmission of Ritual Knowledge.” <em>Manuscript Cultures</em>. Hamburg: Centre for the Study of Manuscript Cultures, Universität Hamburg.</span></p>
<p style="text-align: justify;"><span style="color: #333333; font-size: 19px;">Guo, Huiwen. Forthcoming. “The Dujie Ordination Ritual of the Lanten Yao of Laos: A Study of the Anlong and Nanling Rites.” MPhil thesis, Chinese University of Hong Kong. Supervised by Tam Wai-lun.</span></p>'''

def inner_replace(s, start_marker, new):
    i = s.find(start_marker)
    if i < 0: return s, False
    j = s.rfind('<div class="et_pb_text_inner">', 0, i)
    k = s.find('</div>', i)
    return s[:j] + '<div class="et_pb_text_inner">' + ent(new) + s[k:], True

miss = []
for p in glob.glob(os.path.join(OUT, '**/index.html'), recursive=True):
    rel = os.path.relpath(p, OUT); zh = rel.startswith('zh/'); key = rel[3:] if zh else rel
    if rel.startswith('site-assets'): continue
    s = open(p, encoding='utf-8').read(); o = s
    for a, b in ALL:
        s = s.replace(a, b).replace(ent(a), ent(b))
    for a, b in PAGE.get(key, []):
        if a in s: s = s.replace(a, b)
        elif ent(a) in s: s = s.replace(ent(a), ent(b))
        else:
            rx = re.compile(r'(?:\s|\xa0|&nbsp;)+'.join(re.escape(w) for w in a.split()))
            s2, n = rx.subn(lambda m: b, s)
            if n == 0:
                rx = re.compile(r'(?:\s|\xa0|&nbsp;)+'.join(re.escape(w) for w in ent(a).split()))
                s2, n = rx.subn(lambda m: ent(b), s)
            if n: s = s2
            elif not zh: miss.append((rel, a[:60]))
    if key == 'publications/index.html' and ('Forthcoming a.' in s or 'On the Lanten Methods' in s):
        s, ok1 = inner_replace(s, 'On the Lanten Methods to Fetch the Hon', PUB)
        s, ok2 = inner_replace(s, 'Forthcoming a.', FORTH)
        if not zh and not (ok1 and ok2): miss.append((rel, 'PUB/FORTH'))
    if s != o: open(p, 'w', encoding='utf-8').write(s)
for m in miss: print('MISS', m)
print('polish done')
