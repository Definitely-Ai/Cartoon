// Loopback-only database stand-in for gallery browser QA. No production access.
import http from 'node:http';
const rows=new Map();
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1:21369');
  res.setHeader('Content-Type','application/json');
  if(req.headers.apikey!=='gallery-qa-only'){res.writeHead(401);res.end('{}');return;}
  if(url.pathname!=='/rest/v1/gallery_visibility'){res.writeHead(503);res.end('{}');return;}
  if(req.method==='POST'){
    const chunks=[];let size=0;for await(const part of req){size+=part.length;if(size>4096){res.writeHead(413);res.end('{}');return;}chunks.push(part);}
    try{const body=JSON.parse(Buffer.concat(chunks));rows.set(body.cartoon_id,body);res.writeHead(201);res.end('{}');}catch{res.writeHead(400);res.end('{}');}
  }else res.end(JSON.stringify([...rows.values()].filter(r=>r.hidden).map(r=>({cartoon_id:r.cartoon_id}))));
}).listen(21369,'127.0.0.1',()=>console.log('Gallery QA database fixture ready on loopback port 21369; memory only.'));
