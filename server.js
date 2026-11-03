const http = require('http');const fs = require('fs');const path = require('path');const {execFileSync} = require('child_process');
const ROOT = __dirname;
const FRONT = path.join(ROOT, 'frontend');
const BIN = path.join(ROOT, 'backend', process.platform === 'win32' ? 'library.exe' : 'library');
function compile(){execFileSync('gcc',['backend/main.c','backend/storage.c','backend/search.c','-o',BIN],{cwd:ROOT,stdio:'inherit'});}
try{compile();}catch(e){
  if(e.code !== 'ENOENT' || !fs.existsSync(BIN)){
    console.error('C compile failed and no compatible prebuilt engine is available.',e.message);
    process.exit(1);
  }
  if(process.platform !== 'win32')fs.chmodSync(BIN,0o755);
  console.warn('GCC is unavailable; using the bundled C search engine.');
}
function runC(...args){try{return JSON.parse(execFileSync(BIN,args,{cwd:ROOT,encoding:'utf8'}));}catch(e){return {ok:false,error:e.stderr?.toString()||e.message};}}
function body(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>s+=c);req.on('end',()=>{try{resolve(JSON.parse(s||'{}'));}catch(e){reject(e);}});});}
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'});res.end(JSON.stringify(data));}
http.createServer(async(req,res)=>{if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});return res.end();}
const u=new URL(req.url,'http://localhost');try{
if(u.pathname==='/api/documents'&&req.method==='GET'){const q=u.searchParams.get('q')||'',mode=u.searchParams.get('mode')||'AND',sort=u.searchParams.get('sort')||'title',dir=u.searchParams.get('dir')||'asc';return send(res,200,runC(q?'search':'list',q,mode,sort,dir));}
if(u.pathname==='/api/stats'&&req.method==='GET')return send(res,200,runC('stats'));
if(u.pathname==='/api/documents'&&req.method==='POST'){const b=await body(req);if(!b.title||!b.author||!b.category||!Number(b.year))return send(res,400,{ok:false,error:'Title, author, category and year are required.'});return send(res,200,runC('add',b.title,b.author,b.category,String(b.year),b.content||''));}
const match=u.pathname.match(/^\/api\/documents\/(\d+)$/);if(match&&req.method==='PUT'){const b=await body(req);return send(res,200,runC('edit',match[1],b.title,b.author,b.category,String(b.year),b.content||''));}if(match&&req.method==='DELETE')return send(res,200,runC('delete',match[1]));
const file=path.join(FRONT,u.pathname==='/'?'index.html':u.pathname.slice(1));if(!file.startsWith(FRONT))return send(res,403,{error:'Forbidden'});fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);return res.end('Not found');}const ext=path.extname(file);res.writeHead(200,{'Content-Type':ext==='.css'?'text/css':ext==='.js'?'text/javascript':'text/html'});res.end(data);});
}catch(e){send(res,400,{ok:false,error:e.message});}}).listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Digital Library running on port '+(process.env.PORT||3000)));
