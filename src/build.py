import base64, json, glob as _g, os as _o
s=open('game.html').read()
spr=json.load(open('sprites.json'))
b=base64.b64encode(open('fuoristrada.glb','rb').read()).decode()
import glob,os
import shutil
os.makedirs('../ridotte-inserite/voci',exist_ok=True)
voci=sorted(os.path.basename(f)[5:-4] for f in glob.glob('voci_*.mp3'))
for k in voci:
    d='../ridotte-inserite/voci/'+k+'.mp3'
    if not os.path.exists(d) or os.path.getsize(d)!=os.path.getsize('voci_'+k+'.mp3'): shutil.copy('voci_'+k+'.mp3',d)
s=s.replace("'__VOCI__'",json.dumps(voci))
open('build.html','w').write(s.replace("'__TRUCK__'","'data:model/gltf-binary;base64,"+b+"'").replace("'__LOGO__'","'data:image/webp;base64,"+base64.b64encode(open('logo.webp','rb').read()).decode()+"'").replace("'__IMGS__'",json.dumps({_o.path.basename(f)[:-5]:'data:image/webp;base64,'+base64.b64encode(open(f,'rb').read()).decode() for f in sorted(_g.glob('img/*.webp'))})).replace("'__LOGORI__'","'data:image/webp;base64,"+base64.b64encode(open('logo_ri.webp','rb').read()).decode()+"'").replace("'__HERO__'","'data:image/webp;base64,"+base64.b64encode(open('hero_emb.webp','rb').read()).decode()+"'").replace("'__LOGO4__'","'data:image/webp;base64,"+base64.b64encode(open('logo4.webp','rb').read()).decode()+"'").replace("'__TERRANO__'","'data:model/gltf-binary;base64,"+base64.b64encode(open('models/terrano_gabbah.glb','rb').read()).decode()+"'").replace("'__SIDE__'","'"+spr['side_orange']+"'"))
