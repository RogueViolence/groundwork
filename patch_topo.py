import urllib.parse
topo = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><defs><style>.c{fill:none;stroke:rgba(100,170,190,0.13);stroke-width:1.2}</style></defs><ellipse class="c" cx="300" cy="300" rx="270" ry="180"/><ellipse class="c" cx="300" cy="300" rx="210" ry="138"/><ellipse class="c" cx="300" cy="300" rx="150" ry="100"/><ellipse class="c" cx="300" cy="300" rx="90" ry="60"/><ellipse class="c" cx="80" cy="480" rx="200" ry="130"/><ellipse class="c" cx="80" cy="480" rx="140" ry="90"/><ellipse class="c" cx="520" cy="120" rx="170" ry="110"/><ellipse class="c" cx="520" cy="120" rx="110" ry="70"/><ellipse class="c" cx="480" cy="500" rx="150" ry="96"/><ellipse class="c" cx="480" cy="500" rx="95" ry="60"/></svg>'
e = urllib.parse.quote(topo)
s = f'<style>body{{background-color:#0d1117!important;background-image:url("data:image/svg+xml,{e}")!important;background-repeat:repeat!important;background-size:600px 600px!important;background-attachment:fixed!important}}#root{{background:transparent!important}}</style>'
c = open('dist/index.html').read().replace('</head>', s+'</head>')
open('dist/index.html','w').write(c)
print('Patched')
EOFnpx expo export --platform web && python3 patch_topo.py && netlify deploy --dir dist --prod

