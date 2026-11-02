import re, os, json, shutil, html as H
import sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIR=os.environ.get('YD_MIRROR','/tmp/yd-mirror'); OUT=os.environ.get('YD_OUT',ROOT); ZH=ROOT+'/content/zh'; EN=ROOT+'/content/en'
PAGES={'home':'','research':'research','manuscripts':'manuscripts','oral-stories':'oral-stories','films':'films','ethnofilms':'films/ethnofilms',
'ethnohistory':'ethnohistory','maps':'ethnohistory/maps','team':'team','publications':'publications','events':'events','genesis':'genesis','daoism-among-the-yao':'daoism-among-the-yao'}
ZHMENU={'Yao Dao':'瑶道','Research':'研究','Manuscripts':'手抄本','Oral Stories':'口述故事','Films':'影片','Ethnofilms':'民族志影片','Ethnohistory':'民族历史','Maps':'地图','Team':'团队','Publications':'出版物','Events':'活动'}
ZHTITLE={'home':'瑶道项目','research':'研究 | 瑶道项目','manuscripts':'手抄本 | 瑶道项目','oral-stories':'口述故事 | 瑶道项目','films':'影片 | 瑶道项目','ethnofilms':'民族志影片 | 瑶道项目','ethnohistory':'民族历史 | 瑶道项目','maps':'地图 | 瑶道项目','team':'团队 | 瑶道项目','publications':'出版物 | 瑶道项目','events':'活动 | 瑶道项目','genesis':'缘起 | 瑶道项目','daoism-among-the-yao':'瑶族中的道教 | 瑶道项目'}
DRIVE={'YAO-DAO-PROJECT-IMPACT-CASE_2025-10.mp4':'1jOCHlsjLwN_mfN3ED0-XoVa_Fce-YddZ','Lanten_LNT-Museum_with-ITV_9min_FINAL_HD-1920.mp4':'19mV_708YkUPA6OwD99TvKGmdWwSvStWb','Lanten_Short-Anthro-Film_19mins_FINAL_HD-1920.mp4':'1deVDEA207sZUmSpFKwSTj_Us0RJNskDW'}
log=[]
def div_end(s,start):
    d=0; i=start
    for m in re.finditer(r'<div\b|</div>',s[start:]):
        d+= 1 if m.group(0)=='<div' else -1
        if d==0: return start+m.end()
    raise Exception('unbalanced')
def inner_span(s,start):  # start at '<div class="et_pb_text_inner"'
    a=s.index('>',start)+1; e=div_end(s,start); return a,e-len('</div>')
def norm(t): return re.sub(r'\s+',' ',H.unescape(re.sub(r'<[^>]+>',' ',t))).strip().lower()
def reroot(s):  # add one '../' level to relative refs
    def fix(u):
        if re.match(r'^(https?:|//|#|mailto:|tel:|data:|javascript:)',u) or u=='' : return u
        return '../'+u if not u.startswith('./') else '../'+u[2:]
    s=re.sub(r'((?:href|src|data-src|poster)=")([^"]*)"',lambda m:m.group(1)+fix(m.group(2))+'"',s)
    s=re.sub(r"((?:href|src)=')([^']*)'",lambda m:m.group(1)+fix(m.group(2))+"'",s)
    s=re.sub(r'(srcset=")([^"]*)"',lambda m:m.group(1)+', '.join(' '.join([fix(p.split()[0])]+p.split()[1:]) for p in m.group(2).split(',') if p.strip())+'"',s)
    s=re.sub(r'url\(([\'"]?)(?!data:|https?:|#)([^\'")]+)\1\)',lambda m:'url('+m.group(1)+fix(m.group(2))+m.group(1)+')',s)
    return s
CTRL_CSS=open(ROOT+'/tools/yd.css').read()
CTRL_JS=open(ROOT+'/tools/yd.js').read()
HEAD_JS="<script>(function(){var t=null;try{t=localStorage.getItem('yd-theme')}catch(e){}var q=location.search.match(/[?&]theme=(light|dark)/);if(q)t=q[1];document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');})();</script>"
shutil.copytree(MIR+'/site-assets',OUT+'/site-assets',dirs_exist_ok=True)
for pid,slug in PAGES.items():
    src=open(f'{MIR}/{slug+"/" if slug else ""}index.html',encoding='utf-8').read()
    for lang in ['en','zh']:
        s=src
        # --- edits on purpose
        if pid=='home': s=s.replace('Kristopher Marinus Schipper','Kristofer Marinus Schipper')
        if pid=='research': s=s.replace('Martin Tse, who is co-leader of the Yao Dao Project','Martin Tse, a collaborator of the Yao Dao Project')
        # --- big videos -> Drive
        def vid(m):
            name=m.group(1).split('/')[-1]
            if name in DRIVE:
                return f'<div class="yd-drive" data-drive="{DRIVE[name]}"></div>'
            return m.group(0)
        s=re.sub(r'<video controls>\s*<source type="video/mp4" src="([^"]+)"\s*/>\s*</video>',vid,s)
        # overlay on drive videos: use own play class
        s=re.sub(r'(<div class="yd-drive"[^>]*></div></div>\s*<div style="[^"]*" class="et_pb_video_overlay"><div class="et_pb_video_overlay_hover"><a href="#" class=")et_pb_video_play',r'\1yd-play',s)
        # --- team: Martin to Collaborators
        if pid=='team':
            i=s.find('<div class="et_pb_row et_pb_row_4'); e=div_end(s,i); row=s[i:e]
            assert 'MARTIN TSE' in row
            s=s[:i]+s[e:]
            j=s.find('<div class="et_pb_row et_pb_row_10'); je=div_end(s,j)
            s=s[:je]+row+s[je:]
            log.append('team: Martin row moved')
        # --- zh text
        notice=''
        if lang=='zh':
            zf=f'{ZH}/{pid}.json'
            if os.path.exists(zf):
                zb=json.load(open(zf))['blocks']; eb=json.load(open(f'{EN}/{pid}.json'))['blocks']
                done=0
                for k,v in zb.items():
                    key=norm(eb[int(k)]['html'])[:60]
                    pos=[m.start() for m in re.finditer(r'<div class="et_pb_text_inner"',s)]
                    hit=None
                    for p in pos:
                        a,b=inner_span(s,p)
                        if norm(s[a:b])[:60]==key: hit=(a,b); break
                    if not hit:
                        for p in pos:
                            a,b=inner_span(s,p)
                            if key[:30] and key[:30] in norm(s[a:b]): hit=(a,b); break
                    if hit:
                        orig=s[hit[0]:hit[1]]; m=re.search(r'<p( style="[^"]*")>',orig); zh_html=v['html']
                        if m: zh_html=re.sub(r'<p>','<p'+m.group(1)+'>',zh_html)
                        s=s[:hit[0]]+zh_html+s[hit[1]:]; done+=1
                    else: log.append(f'zh MISS {pid} block {k}: {key[:40]}')
                log.append(f'zh {pid}: {done}/{len(zb)} blocks')
            else:
                notice='<div class="yd-notice" lang="zh-Hans">本页中文版尚未完成，现以英文原文显示。</div>'
            for en_l,zh_l in ZHMENU.items():
                s=re.sub(r'(<li id="menu-item-\d+"[^>]*><a href="[^"]*"[^>]*>)'+re.escape(en_l)+'</a>',r'\1'+zh_l+'</a>',s)
            s=s.replace('<html lang="en-US"','<html lang="zh-Hans"')
            s=re.sub(r'<title>[^<]*</title>','<title>'+ZHTITLE[pid]+'</title>',s)
            s=s.replace('Select Page','选择页面')
            s=reroot(s)
        # --- language + theme controls in menu
        depth=(len(slug.split('/')) if slug else 0)+(1 if lang=='zh' else 0)
        up='../'*depth
        other=(up+('zh/'+slug+'/' if slug else 'zh/')) if lang=='en' else (up+(slug+'/' if slug else ''))
        other=other or './'
        ctl=(f'<div class="yd-bar"><a class="yd-lang" href="{other}" lang="{"zh-Hans" if lang=="en" else "en"}" hreflang="{"zh-Hans" if lang=="en" else "en"}">{"中文" if lang=="en" else "EN"}</a>'
             f'<span class="yd-sep" aria-hidden="true">|</span><a class="yd-theme" href="#" role="button" data-l="{"浅色" if lang=="zh" else "Light"}" data-d="{"深色" if lang=="zh" else "Dark"}">{"浅色" if lang=="zh" else "Light"}</a></div>')
        s=re.sub(r'(<header id="main-header"[^>]*>)',lambda m:m.group(1)+ctl,s,count=1)
        # --- unlisted + head/body injection
        s=s.replace('<head>','<head>\n<meta name="robots" content="noindex, nofollow">\n'+HEAD_JS,1)
        s=s.replace('</head>','<style id="yd-css">'+CTRL_CSS+'</style>\n</head>',1)
        if notice: s=re.sub(r'(<div id="et-main-area">)',r'\1'+notice,s,count=1)
        s=s.replace('</body>','<script>'+CTRL_JS+'</script>\n</body>',1)
        d=OUT+'/'+('zh/' if lang=='zh' else '')+(slug+'/' if slug else '')
        os.makedirs(d,exist_ok=True); open(d+'index.html','w',encoding='utf-8').write(s)
print('\n'.join(log))

import subprocess
subprocess.run([sys.executable, ROOT + '/tools/polish.py', OUT], check=True)
