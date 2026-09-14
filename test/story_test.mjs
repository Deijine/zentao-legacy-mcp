import { spawn } from 'node:child_process';
import { loadTestEnv } from './testenv.mjs';
const T = loadTestEnv();
if (!process.env.ZENTAO_BASE_URL) { console.error('set env'); process.exit(1); }
const child = spawn('node', ['src/index.js'], { cwd: process.cwd(), env: process.env });
const pending = new Map(); let outBuf='';
child.stdout.on('data', d=>{ outBuf+=d.toString(); let i; while((i=outBuf.indexOf('\n'))!==-1){ const l=outBuf.slice(0,i).trim(); outBuf=outBuf.slice(i+1); if(!l)continue; try{ const m=JSON.parse(l); if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);} }catch{} } });
let nid=1;
function rpc(method,params){ return new Promise(res=>{ const id=nid++; pending.set(id,res); child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n'); setTimeout(()=>{if(pending.has(id)){pending.delete(id);res({timeout:true});}},90000); }); }
const notify=(m,p)=>child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:m,params:p})+'\n');
await rpc('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'t',version:'1'}});
notify('notifications/initialized');

// story list for product 20
const sl = await rpc('tools/call', { name: 'zentao_story_list', arguments: { productID: T.productID } });
console.log('STORY isError:', sl.result.isError);
const data = JSON.parse(sl.result.content[0].text);
console.log('STORY total (product 20):', data.data.total, 'note:', data.data.note);
console.log('STORY[0]:', JSON.stringify(data.data.stories[0]).slice(0,200));
console.log('STORY[1]:', JSON.stringify(data.data.stories[1]||{}).slice(0,150));

// story get for one of them
if (data.data.stories[0]) {
  const sid = Number(data.data.stories[0].id);
  const sg = await rpc('tools/call', { name: 'zentao_story_get', arguments: { storyID: sid } });
  const gd = JSON.parse(sg.result.content[0].text);
  console.log('STORY_GET', sid, '->', gd.data.title, 'status:', gd.data.status, 'estimate:', gd.data.estimate);
}
child.kill();
