import re, os, json, hashlib, urllib.request, urllib.parse, posixpath, sys
SRC=os.environ.get('YD_HTML','/tmp/yd-html'); OUT=os.environ.get('YD_MIRROR','/tmp/yd-mirror')
BASE='https://yaodao.hku.hk'
PAGES={'home.html':'','research_.html':'research','manuscripts_.html':'manuscripts','oral-stories_.html':'oral-stories',
'films_.html':'films','films_ethnofilms_.html':'films/ethnofilms','ethnohistory_.html':'ethnohistory','ethnohistory_maps_.html':'ethnohistory/maps',
'team_.html':'team','publications_.html':'publications','events_.html':'events','genesis_.html':'genesis','daoism-among-the-yao_.html':'daoism-among-the-yao'}
done={}
def fetch(url):
    p=urllib.parse.urlsplit(url); path=urllib.parse.unquote(p.path).lstrip('/')
    if path.endswith('/') or not path: return None
    local='site-assets/'+path
    if url in done: return done[url]
    dst=os.path.join(OUT,local)
    if not os.path.exists(dst):
        if path.lower().endswith('.mp4') and 'filmfestival' not in path: done[url]=None; return None
        os.makedirs(os.path.dirname(dst),exist_ok=True)
        try:
            req=urllib.request.Request(BASE+urllib.parse.quote(p.path),headers={'User-Agent':'Mozilla/5.0'})
            data=urllib.request.urlopen(req,timeout=60).read()
        except Exception as e:
            print('FAIL',url,e,file=sys.stderr); done[url]=None; return None
        if local.endswith('.css'):
            data=fix_css(data.decode('utf-8','replace'), posixpath.dirname(local), BASE+posixpath.dirname(p.path)+'/').encode()
        open(dst,'wb').write(data)
    done[url]=local; return local
def fix_css(css, localdir, baseurl):
    def r(m):
        u=m.group(1).strip('\'"')
        if u.startswith('data:') or u.startswith('#'): return m.group(0)
        full=urllib.parse.urljoin(baseurl,u)
        if 'yaodao.hku.hk' not in full: return m.group(0)
        loc=fetch(full.split('#')[0])
        if not loc: return m.group(0)
        frag=('#'+u.split('#')[1]) if '#' in u else ''
        return 'url("'+posixpath.relpath(loc,localdir)+frag+'")'
    return re.sub(r'url\(([^)]+)\)',r,css)
def rel(target, depth):  # target relative to site root
    return ('../'*depth)+target if depth else (target or './')
for fn,slug in PAGES.items():
    s=open(os.path.join(SRC,fn),encoding='utf-8').read()
    depth=len(slug.split('/')) if slug else 0
    # drop junk
    s=re.sub(r'<script type="speculationrules">.*?</script>','',s,flags=re.S)
    s=re.sub(r'<link rel=["\'](pingback|alternate|EditURI|https://api.w.org/|shortlink|canonical|dns-prefetch)["\'][^>]*>\n?','',s)
    s=re.sub(r'<link[^>]*(oembed|wp-json|xmlrpc|feed)[^>]*>\n?','',s)
    s=re.sub(r'<meta name="generator"[^>]*>\n?','',s)
    # preload->stylesheet
    s=re.sub(r"rel=['\"]preload['\"]([^>]*?)as=['\"]style['\"]([^>]*?)onload=\"[^\"]*\"",r"rel='stylesheet'\1\2",s)
    s=re.sub(r"rel=\"preload\" as=\"style\"([^>]*?)onload=\"[^\"]*\"",r'rel="stylesheet"\1',s)
    # inline css urls
    s=re.sub(r'(<style[^>]*>)(.*?)(</style>)',lambda m:m.group(1)+fix_css(m.group(2),slug or '.',BASE+'/'+(slug+'/' if slug else ''))+m.group(3),s,flags=re.S)
    s=re.sub(r'style="([^"]*url\([^"]*)"',lambda m:'style="'+fix_css(m.group(1).replace('&quot;','"'),slug or '.',BASE+'/').replace('"',"'")+'"',s)
    # asset urls
    def asset(m):
        u=m.group(0).replace('&#038;','&').replace('&amp;','&')
        loc=fetch(u)
        return rel(loc,depth) if loc else m.group(0)
    s=re.sub(r'https?://yaodao\.hku\.hk/(?:wp-content|wp-includes)/[^"\'\s)<>,]+',asset,s)
    s=re.sub(r'https?:\\/\\/yaodao\.hku\.hk\\/','../'*depth if depth else './',s)  # json-escaped
    # page links
    def pl(m):
        path=m.group(1).strip('/')
        return '"'+(rel(path+'/' if path else '',depth) or './')+'"'
    s=re.sub(r'"https?://yaodao\.hku\.hk/([a-z0-9\-/]*)"',pl,s)
    os.makedirs(os.path.join(OUT,slug),exist_ok=True)
    open(os.path.join(OUT,slug,'index.html'),'w',encoding='utf-8').write(s)
    print('ok',slug or 'home',file=sys.stderr)

