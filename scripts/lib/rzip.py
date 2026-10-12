import sys, io, zipfile, urllib.request
class HF(io.RawIOBase):
    def __init__(s,url):
        s.url=url; s.pos=0
        r=urllib.request.urlopen(urllib.request.Request(url,method='HEAD')); s.size=int(r.headers['Content-Length'])
    def seekable(s): return True
    def readable(s): return True
    def tell(s): return s.pos
    def seek(s,o,w=0):
        s.pos = o if w==0 else (s.pos+o if w==1 else s.size+o); return s.pos
    def read(s,n=-1):
        if n<0: n=s.size-s.pos
        if n==0 or s.pos>=s.size: return b''
        end=min(s.pos+n,s.size)-1
        import time
        for k in range(6):
            try:
                r=urllib.request.urlopen(urllib.request.Request(s.url,headers={'Range':f'bytes={s.pos}-{end}'}),timeout=60).read(); break
            except Exception:
                if k==5: raise
                time.sleep(3*(k+1))
        s.pos+=len(r); return r
    def readinto(s,b):
        d=s.read(len(b)); b[:len(d)]=d; return len(d)
url=sys.argv[1]; z=zipfile.ZipFile(io.BufferedReader(HF(url),buffer_size=1<<16))
if len(sys.argv)==2:
    for i in z.infolist()[:40]: print(i.filename,i.file_size)
    print(len(z.infolist()),'entries')
else:
    for name in sys.argv[3:]:
        open(sys.argv[2]+'/'+name.replace('/','_'),'wb').write(z.read(name))
