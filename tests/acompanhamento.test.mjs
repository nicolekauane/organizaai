import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { authSession } from '../src/auth/session.js';
import { canAccessProfile, homeForProfile } from '../src/auth/profiles.js';
import { createPrivateResource } from '../src/auth/privateResource.js';
import { login, cadastro, logout } from '../src/services/authService.js';
import { validateAuthForm } from '../src/utils/authValidation.js';
import { consultarVinculos, consultarAlunos, solicitarAcompanhamento, decidirVinculo, carregarAluno, carregarAreaResponsavel, invalidatePrivateData } from '../src/services/acompanhamentoService.js';
const originalFetch = globalThis.fetch;
const resources = [];
afterEach(() => { resources.splice(0).forEach(resource => resource.deactivate()); logout(); globalThis.fetch = originalFetch; });
const response = (status, data) => ({ status, ok: status >= 200 && status < 300, text: async () => JSON.stringify(data) });
function signedIn(role = 'responsavel', id = 2) {
  const version = authSession.begin(); authSession.acceptToken(version, 'token-' + id, Date.now() + 900000);
  authSession.complete(version, { id, nome: 'Conta ' + id, tipo_usuario: role });
}
function resource(load, role = 'responsavel') { const r = createPrivateResource(load, role); resources.push(r); r.activate(); return r; }
const link = { id: 7, solicitado_em: '2026-11-09 10:00:00', status: 'pendente', responsavel_nome: 'Responsável' };
const aluno = { id: 1, nome: 'Aluno' };
const materias = [{ id: 11, nome: 'Matematica', cor: '#5D1C39', professor: null }];
const tarefas = [{ id: 21, titulo: 'Exercicio', status: 'concluida', prioridade: 'alta', materia_id: 11, data_entrega: null }];
const resumo = { materias: 1, tarefas: { total: 1, pendente: 0, em_andamento: 0, concluida: 1 }, progresso: 100 };
function detailResponses(url) {
  if (url.endsWith('/alunos')) return response(200, [aluno]);
  if (url.endsWith('/materias')) return response(200, materias);
  if (url.endsWith('/tarefas')) return response(200, tarefas);
  if (url.endsWith('/resumo')) return response(200, resumo);
  throw new Error('Unexpected endpoint');
}
test('cadastro aceita ambos os perfis, aluno padrao, rejeita perfil invalido sem request', async () => {
  const sent=[];
  globalThis.fetch=async (url,options)=> { assert.ok(url.endsWith('/api/auth/cadastro'));assert.equal(options.headers.Authorization,undefined);sent.push(JSON.parse(options.body));return response(201,{usuario:{tipo_usuario:sent.at(-1).tipo_usuario}}); };
  const form={nome:'Conta',email:' CONTA@example.com ',senha:'senha longa',confirmar:'senha longa'};
  for(const tipo_usuario of ['aluno','responsavel']) { assert.equal(validateAuthForm({...form,tipo_usuario},true),'');assert.equal((await cadastro({...form,tipo_usuario})).usuario.tipo_usuario,tipo_usuario); }
  await cadastro(form);assert.equal(sent[2].tipo_usuario,'aluno');assert.equal(sent[2].email,'conta@example.com');
  assert.ok(validateAuthForm({...form,tipo_usuario:'admin'},true));await assert.rejects(cadastro({...form,tipo_usuario:'admin'}),e=>e.status===400);assert.equal(sent.length,3);
});
test('login unico usa perfil do me, nunca o perfil informado pelo login; destinos exclusivos', async () => {
  for(const role of ['aluno','responsavel']) {
    globalThis.fetch=async url=>url.endsWith('/login')?response(200,{token:'login-token',expires_in:900,usuario:{tipo_usuario:'admin'}}):response(200,{usuario:{id:1,nome:'Conta',tipo_usuario:role}});
    await login('conta@example.com','senha longa');const user=authSession.getSnapshot().user;
    assert.equal(user.tipo_usuario,role);assert.equal(homeForProfile(user),role==='aluno'?'/':'/acompanhamento');assert.equal(canAccessProfile(user,role),true);assert.equal(canAccessProfile(user,role==='aluno'?'responsavel':'aluno'),false);logout();
  }
  assert.equal(homeForProfile(null),'/login');assert.equal(homeForProfile({tipo_usuario:'admin'}),'/login');
});
test('perfil desconhecido ou ausente no me fecha a sessao', async () => {
  globalThis.fetch=async url=>url.endsWith('/login')?response(200,{token:'token',expires_in:900}):response(200,{usuario:{id:1,tipo_usuario:'admin'}});
  await assert.rejects(login('conta@example.com','senha longa'),e=>e.status===403);assert.equal(authSession.getSnapshot().token,null);assert.equal(authSession.getSnapshot().user,null);
});
test('solicitacao envia somente email normalizado e preserva confirmacao generica', async () => {
  signedIn();const message='Se o aluno puder receber a solicitacao, ela ficara disponivel para aprovacao.';
  globalThis.fetch=async(url,options)=>{assert.ok(url.endsWith('/api/vinculos/solicitacoes'));assert.equal(options.method,'POST');assert.equal(options.headers.Authorization,'Bearer token-2');assert.equal(options.cache,'no-store');assert.deepEqual(JSON.parse(options.body),{email:'aluno@example.com'});return response(202,{message});};
  assert.deepEqual(await solicitarAcompanhamento(' ALUNO@example.com '),{message});
  await assert.rejects(solicitarAcompanhamento('invalido'),e=>e.status===400);
});
test('decisoes enviam id e solicitado_em sem transformar a versao ou enviar proprietario', async () => {
  signedIn('aluno',1);
  for(const action of ['autorizar','recusar','revogar']) {
    globalThis.fetch=async(url,options)=>{assert.ok(url.endsWith('/api/vinculos/7/'+action));assert.equal(options.method,'POST');assert.deepEqual(JSON.parse(options.body),{solicitado_em:link.solicitado_em});return response(200,{id:7,status:action});};
    assert.equal((await decidirVinculo(link,action)).id,7);
  }
  await assert.rejects(decidirVinculo(link,'excluir'),e=>e.status===400);
});
test('409 nao repete automaticamente a decisao e conserva a sessao para atualizar a lista', async () => {
  signedIn('aluno',1);let calls=0;globalThis.fetch=async()=>{calls++;return response(409,{error:'Vinculo alterado. Atualize a lista.'});};
  await assert.rejects(decidirVinculo(link,'autorizar'),e=>e.status===409);assert.equal(calls,1);assert.ok(authSession.getSnapshot().token);
});
test('carregamento de detalhe usa apenas GETs autorizados e resumo real', async () => {
  signedIn();const urls=[];
  globalThis.fetch=async(url,options)=>{assert.equal(options.method,undefined);assert.equal(options.cache,'no-store');urls.push(url);return detailResponses(url);};
  assert.deepEqual(await carregarAluno('1'),{aluno,materias,tarefas,resumo});assert.equal(urls.length,4);assert.ok(urls.every(url=>!url.includes('usuario_id')));
});
test('area do responsavel lista alunos autorizados e vinculos sem endpoints inventados', async () => {
  signedIn();globalThis.fetch=async url=>url.endsWith('/api/vinculos')?response(200,[link]):response(200,[aluno]);
  assert.deepEqual(await carregarAreaResponsavel(),{alunos:[aluno],vinculos:[link]});
});
test('404 apos revogacao apaga detalhe e outras listas e descarta respostas irmas atrasadas', async () => {
  signedIn();globalThis.fetch=async url=>detailResponses(url);
  const detail=resource(()=>carregarAluno('1'));await detail.reload();assert.ok(detail.getSnapshot().data);
  const list=resource(async()=>[aluno]);await list.reload();
  globalThis.fetch=async url=>url.endsWith('/tarefas')?response(404,{error:'Registro nao encontrado.'}):detailResponses(url);
  await detail.reload();assert.equal(detail.getSnapshot().data,null);assert.equal(list.getSnapshot().data,null);assert.ok(detail.getSnapshot().error);assert.ok(authSession.getSnapshot().user);
});
test('403 limpa dados e sessao; 401 invalida inclusive com corpo malformado', async () => {
  for(const status of [403,401]) {
    signedIn();const r=resource(async()=>[aluno]);await r.reload();
    globalThis.fetch=async()=>({status,ok:false,text:async()=>{if(status===401)throw new Error('malformed');return JSON.stringify({error:'Acesso negado'});}});
    await assert.rejects(consultarAlunos(),e=>e.status===status);assert.equal(r.getSnapshot().data,null);assert.equal(authSession.getSnapshot().token,null);
  }
});
test('403 ou 404 antigos nunca limpam nova conta', async () => {
  for(const status of [403,404]) {
    signedIn();let resolve;globalThis.fetch=()=>new Promise(done=>{resolve=done;});const pending=consultarVinculos();
    logout();signedIn('responsavel',4);const newer=resource(async()=>['nova conta']);await newer.reload();resolve(response(status,{error:'negado'}));
    await assert.rejects(pending);assert.equal(authSession.getSnapshot().user.id,4);assert.deepEqual(newer.getSnapshot().data,['nova conta']);newer.deactivate();
  }
});
test('logout, expiracao e perda de foco apagam informacoes de acompanhamento', async () => {
  for(const clear of [()=>logout(),()=>authSession.expire(authSession.getSnapshot().token),r=>r.deactivate()]) {
    signedIn();const r=resource(async()=>[aluno]);await r.reload();assert.ok(r.getSnapshot().data);clear(r);assert.equal(r.getSnapshot().data,null);
  }
});
test('resposta atrasada nao restaura dados apos blur ou logout', async () => {
  for(const clear of [r=>r.deactivate(),()=>logout()]) {
    signedIn();let resolve;const r=resource(()=>new Promise(done=>{resolve=done;}));const pending=r.reload();clear(r);resolve([aluno]);await pending;assert.equal(r.getSnapshot().data,null);
  }
});
test('recurso rejeita perfil errado e apenas resultado da ultima atualizacao e exibido', async () => {
  signedIn('aluno',1);let calls=0;const wrong=resource(async()=>{calls++;return [aluno];});await wrong.reload();assert.equal(calls,0);assert.equal(wrong.getSnapshot().data,null);
  signedIn();const resolvers=[];const r=resource(()=>new Promise(resolve=>resolvers.push(resolve)));const first=r.reload();const second=r.reload();resolvers[1](['atual']);await second;resolvers[0](['antigo']);await first;assert.deepEqual(r.getSnapshot().data,['atual']);
});
test('aluno fora da lista autorizada ou ID invalido nunca apresenta detalhes', async () => {
  signedIn();globalThis.fetch=async url=>url.endsWith('/alunos')?response(200,[]):detailResponses(url);
  const r=resource(()=>carregarAluno('1'));await r.reload();assert.equal(r.getSnapshot().data,null);assert.ok(r.getSnapshot().error);
  for(const id of ['0','-1','1e2','2147483648',['1','2']]) await assert.rejects(carregarAluno(id),e=>e.status===404);
});
test('falhas de rede e invalidacao explicita deixam a tela sem dados antigos', async () => {
  signedIn();let fail=false;const r=resource(async()=>{if(fail)throw new Error('Offline');return [aluno];});await r.reload();fail=true;await r.reload();assert.equal(r.getSnapshot().data,null);assert.equal(r.getSnapshot().error,'Offline');
  invalidatePrivateData();assert.equal(r.getSnapshot().data,null);
});
