// Run after: npm exec -- expo export --platform web
// No dependencies. Uses Windows Edge headless by default; override ORGANIZA_AI_BROWSER.
// All /api network requests are blocked in CDP before loading the app. Fixture only.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),net=require('node:net'),os=require('node:os'),{spawn}=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve('dist');let browser,ws,server;let next=0;const pending=new Map();
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const fixture=String.raw`(() => {
window.__fixture={role:'responsavel',status:'pendente',calls:[]};
window.confirm=()=>true;
const nativeFetch=window.fetch;
window.fetch=async(input,options={})=>{
 const url=new URL(typeof input==='string'?input:input.url,location.href);if(!url.pathname.startsWith('/api/'))return nativeFetch(input,options);
 const s=window.__fixture,p=url.pathname;s.calls.push({path:p,method:options.method||'GET'});
 const out=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
 const student={id:1,nome:'Aluno de teste'},link={id:1,aluno_id:1,responsavel_id:2,aluno_nome:student.nome,responsavel_nome:'Responsável de teste',status:s.status,solicitado_em:'2026-11-09 10:00:00',autorizado_em:s.status==='autorizado'?'2026-11-09 11:00:00':null,encerrado_em:null};
 if(p==='/api/auth/cadastro')return out(201,{usuario:{id:2,tipo_usuario:JSON.parse(options.body).tipo_usuario}});
 if(p==='/api/auth/login')return out(200,{token:'fixture-token',expires_in:900});
 if(p==='/api/auth/me')return out(200,{usuario:{id:s.role==='aluno'?1:2,nome:'Conta de teste',tipo_usuario:s.role}});
 if(p==='/api/vinculos')return out(200,[link]);
 if(p==='/api/vinculos/solicitacoes')return out(202,{message:'Se o aluno puder receber a solicitacao, ela ficara disponivel para aprovacao.'});
 if(/^\/api\/vinculos\/1\//.test(p)) {const body=JSON.parse(options.body);if(body.solicitado_em!==link.solicitado_em)return out(400,{error:'Versao incorreta'});s.status={autorizar:'autorizado',recusar:'recusado',revogar:'revogado'}[p.split('/').pop()];return out(200,{id:1,status:s.status});}
 if(p==='/api/acompanhamento/alunos')return out(200,s.status==='autorizado'?[student]:[]);
 if(p.startsWith('/api/acompanhamento/alunos/1/')){
  if(s.status!=='autorizado')return out(404,{error:'Registro nao encontrado.'});
  if(p.endsWith('/materias'))return out(200,[{id:11,nome:'Matemática de teste',professor:'Professor',cor:'#5D1C39'}]);
  if(p.endsWith('/tarefas'))return out(200,[{id:21,titulo:'Exercício de teste',descricao:'Descrição de teste',prioridade:'alta',status:'pendente',materia_id:11,data_entrega:'2026-11-20'}]);
  return out(200,{materias:1,tarefas:{total:1,pendente:1,em_andamento:0,concluida:0},progresso:0});
 }
 if(p==='/api/materias'||p==='/api/tarefas')return out(200,[]);
 return out(404,{error:'Fixture desconhecida'});
};})();`;
new Function(fixture); function command(method,params={}){const id=++next;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error('Browser expression failed');return r.result.value;}
async function until(expression,label){for(let i=0;i<100;i++){if(await evaluate(expression))return;await pause(100);}throw new Error('Timeout: '+label);}
async function click(text){await evaluate(`(()=>{const e=[...document.querySelectorAll('[role=button],a')].filter(e=>e.getClientRects().length&&!e.closest('[aria-hidden="true"]')).find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!e)throw Error('missing button');e.click();})()`);}
async function fill(label,value){await evaluate(`(()=>{const e=document.querySelector('input[aria-label='+JSON.stringify(${JSON.stringify(label)})+']');if(!e)throw Error('missing input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);}
async function doLogin(){await fill('E-mail','teste@example.com');await fill('Senha','senha de teste');await click('Entrar');}
(async()=>{try{
 server=http.createServer((req,res)=>{let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep))p=path.join(root,'index.html');if(!fs.existsSync(p)||fs.statSync(p).isDirectory())p=path.join(root,'index.html');const ext=path.extname(p);res.setHeader('Content-Type',ext==='.js'?'application/javascript':ext==='.css'?'text/css':ext==='.html'?'text/html':'application/octet-stream');res.end(fs.readFileSync(p));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
 const reservation=net.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const debugPort=reservation.address().port;await new Promise(r=>reservation.close(r));
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'organiza-ai-edge-'));
 browser=spawn(process.env.ORGANIZA_AI_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-address=127.0.0.1','--remote-debugging-port='+debugPort,'--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let tabs;for(let i=0;i<100;i++){try{tabs=await(await fetch('http://127.0.0.1:'+debugPort+'/json/list')).json();if(tabs.some(t=>t.type==='page'))break;}catch{}await pause(100);}
 assert.ok(tabs);const tab=tabs.find(t=>t.type==='page');ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.method==='Fetch.requestPaused'){command('Fetch.failRequest',{requestId:m.params.requestId,errorReason:'BlockedByClient'});return;}if(m.id){const task=pending.get(m.id);if(task){pending.delete(m.id);m.error?task.reject(new Error('CDP failure')):task.resolve(m.result);}}});
 await command('Page.enable');await command('Runtime.enable');await command('Fetch.enable',{patterns:[{urlPattern:'*://*/api/*',requestStage:'Request'}]});await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await command('Page.addScriptToEvaluateOnNewDocument',{source:fixture});
 await command('Page.navigate',{url:'http://127.0.0.1:'+port+'/login'});
 await until(`document.body.innerText.includes('Entrar')`,'login');
 assert.equal(await evaluate('Boolean(window.__fixture)'),true);await click('Ainda não tem conta? Criar uma conta');await until(`document.querySelector('[role=radio]')!==null`,'cadastro');
 assert.equal(await evaluate(`document.querySelector('[role=radio][aria-label="Aluno"]').getAttribute('aria-checked')`),'true');
 await evaluate(`document.querySelector('[role=radio][aria-label="Responsável"]').click()`);
 await fill('Nome completo','Conta de teste');await fill('E-mail','teste@example.com');await fill('Senha','senha de teste');await fill('Confirmar senha','senha de teste');await click('Criar conta');
 await until(`document.body.innerText.includes('Conta criada!')`,'cadastro confirmado');await click('Ir para o login');await until(`document.body.innerText.includes('Entrar')`,'login depois do cadastro');await doLogin();
 await until(`location.pathname==='/acompanhamento' && document.body.innerText.includes('Solicitar acompanhamento')`,'redirecionamento responsavel');
 await evaluate("history.pushState(history.state,'','/tarefas');dispatchEvent(new PopStateEvent('popstate'))");
 await until("location.pathname==='/acompanhamento' && document.body.innerText.includes('Solicitar acompanhamento')",'bloqueio de tela de aluno para responsavel');
 assert.equal(await evaluate("window.__fixture.calls.some(c=>c.path==='/api/tarefas'||c.path==='/api/materias')"),false);
 await fill('E-mail do aluno','aluno@example.com');await click('Enviar solicitação');await until(`document.body.innerText.includes('Se o aluno puder')`,'solicitacao generica');
 await evaluate(`window.__fixture.status='autorizado'`);await click('Atualizar');await until(`document.body.innerText.includes('Ver acompanhamento')`,'aluno autorizado');await click('Ver acompanhamento');
 await until(`document.body.innerText.includes('Exercício de teste')`,'detalhes');assert.equal(await evaluate(`[...document.querySelectorAll('[role=button]')].some(e=>['Editar','Excluir','Concluir','Reabrir'].includes(e.textContent.trim()))`),false);
 assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`),true);
 await evaluate(`window.__fixture.status='revogado'`);await click('Atualizar');await until(`!document.body.innerText.includes('Exercício de teste')&&document.body.innerText.includes('Acesso indisponível')`,'limpeza apos revogacao');
 await click('Sair');await until(`document.body.innerText.includes('Entrar')`,'logout');await evaluate(`window.__fixture.role='aluno';window.__fixture.status='pendente'`);await doLogin();
 await until(`location.pathname==='/'&&document.body.innerText.includes('Ver tarefas')`,'redirecionamento aluno');await evaluate("history.pushState(history.state,'','/acompanhamento/1');dispatchEvent(new PopStateEvent('popstate'))");await until("location.pathname==='/' && document.body.innerText.includes('Ver tarefas')",'bloqueio de acompanhamento para aluno');await click('Responsáveis');await until(`document.body.innerText.includes('Autorizar')`,'solicitacoes aluno');
 await click('Autorizar');await until(`document.body.innerText.includes('Revogar acesso')`,'autorizacao');
 await evaluate(`window.confirm=()=>false`);await click('Revogar acesso');await pause(200);assert.equal(await evaluate(`window.__fixture.status`),'autorizado');
 await evaluate(`window.confirm=()=>true`);await click('Revogar acesso');await until(`document.body.innerText.includes('Acompanhamento revogado.')`,'revogacao confirmada');
 await evaluate(`window.__fixture.status='pendente'`);await click('Atualizar');await until(`document.body.innerText.includes('Autorizar')`,'nova solicitacao');await click('Recusar');await until(`document.body.innerText.includes('Solicitação recusada.')`,'recusa');
 console.log('SMOKE WEB APROVADO: cadastro com perfil, login/redirecionamento dos dois perfis, solicitacao, aprovacao/recusa, confirmacao de revogacao, detalhes somente leitura, limpeza apos 404 e largura de 390px. Backend simulado; nenhum banco acessado.');
 }catch(e){console.log('SMOKE WEB FALHOU: '+e.message);if(ws)console.log(await evaluate('JSON.stringify({path:location.pathname,text:document.body.innerText,calls:window.__fixture?.calls})'));process.exitCode=1;}
 finally{if(ws){try{await command('Browser.close');}catch{}ws.close();}if(browser)browser.kill();if(server)await new Promise(r=>server.close(r));}
})();