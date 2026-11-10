// Optional Node.js 18+ local server. No npm dependencies.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';

const root=fileURLToPath(new URL('./',import.meta.url));
const index=process.argv.indexOf('--port');
const port=Number(index>=0?process.argv[index+1]:process.env.PORT||4173);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Choose a valid port.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  try{
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,'.'+(path==='/'?'/index.html':path));
    if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    if(!(await stat(file)).isFile()){res.writeHead(404);res.end();return;}
    const content=await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Content-Length':content.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:content);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.on('error',error=>{console.error(`Could not start: ${error.message}\nTry: node server.mjs --port 4174`);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`\nTRANSIT AFFORDABILITY ATLAS\nLocal: http://127.0.0.1:${port}\nKeep this terminal open. Press Control+C to stop.\n`));
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
