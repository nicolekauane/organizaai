# Dependências e segurança — fechamento da Entrega 3

Análise em 10/11/2026, branch entrega-3. Nenhuma dependência foi alterada neste fechamento: as versões compatíveis já estão nas últimas versões publicadas consultadas. Não foi usado npm audit fix --force nem overrides de versões principais.

## Alertas e impacto real

A revisão anterior registrou 11 alertas moderados. A consulta atual de npm audit --json retorna **10 moderados, zero altos e zero críticos**, sem alteração do manifesto/lockfile nesta rodada. O relatório atual deixou de listar eslint-config-expo como item afetado; os avisos diretos de glob/minimatch e suas cadeias permanecem. Contagens do registro podem mudar sem mudança de código.

São dois problemas de origem, propagados pela árvore; não são dez falhas independentes na aplicação.

| Origem instalada | Problema | Condição e impacto | Versão corrigida |
| --- | --- | --- | --- |
| minimatch 10.2.6 | Amplificação de padrões, CVE-2026-118764 | Padrão controlado pelo atacante com optimizationLevel >= 2 pode ampliar processamento/memória e causar negação de serviço | 11.0.1 |
| glob 13.0.7 | Cancelamento AbortSignal incompleto, CVE-2026-118773 | Travessia assíncrona de diretórios pode continuar após cancelamento e consumir CPU/I/O | 14.0.2 |

Fontes: [aviso do minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249), [aviso do glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4).

Pacotes afetados no relatório atual: glob, minimatch, expo, @expo/cli, @expo/fingerprint, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, @typescript-eslint/type-utils, @typescript-eslint/typescript-estree e @typescript-eslint/utils. eslint-config-expo apareceu na contagem anterior como consumidor da cadeia.

## Compatibilidade verificada

- Expo instalado: 58.0.23; @expo/cli 58.1.19; @expo/fingerprint 0.21.9.
- CLI e fingerprint exigem glob ^13.0.0; a última versão consultada dessa linha é 13.0.7, ainda afetada.
- Fingerprint e @typescript-eslint/typescript-estree 8.72.2 exigem minimatch ^10.2.2; a última versão consultada dessa linha é 10.2.6, ainda afetada.
- As versões latest consultadas de CLI, fingerprint e typescript-estree são as já instaladas; não há atualização desses consumidores adotando os majors corrigidos.
- glob 14 e minimatch 11 ficam fora dos intervalos declarados. Não foi imposta substituição por override sem suporte dos consumidores.
- npm propõe rebaixar Expo para 52.0.49 com --force. Isso quebra a linha SDK 58 e não foi aplicado.
- Atualizações principais de ESLint/TypeScript e patches de React não relacionados aos avisos não foram incluídos.

## Avaliação e recomendação

Neste projeto, as cadeias afetadas pertencem a CLI, fingerprint e lint executados no ambiente de desenvolvimento/build. Não foi encontrado uso de glob/minimatch no código das telas ou no backend. Embora npm classifique Expo como dependência de produção, isso não demonstra que os caminhos vulneráveis sejam executados pelo aplicativo compilado.

Não há evidência, nesta inspeção, de exploração remota por login, tarefas ou acompanhamento. Isso não equivale a risco zero: o risco se concentra em ferramentas que processam padrões/árvores de arquivos não confiáveis. Não executar lint/build com padrões externos não revisados, restringir permissões do ambiente de build e não expor servidor de desenvolvimento à Internet. Monitorar os dois avisos e atualizar pela ferramenta Expo quando os consumidores publicarem versões compatíveis; repetir lint, typecheck, testes, Web e Doctor.

Backend: npm audit confirmou zero vulnerabilidades. O registro dos riscos restantes permite revisar o código para envio acadêmico ao GitHub; não representa aprovação de hospedagem pública nem auditoria de produção.

## JWT_SECRET

Inspeção local, sem revelar o valor: configurado, 96 bytes de texto hexadecimal, sem placeholder e aceito por readAuthConfig. O tamanho/formato não comprova a origem aleatória. A assinatura usa HS256, valida emissor/audiência/expiração e a validade configurada é de 15 minutos.

Como o segredo foi exposto na conversa, ele precisa ser substituído localmente. O agente não alterou .env.

Na raiz, o usuário pode gerar um novo valor diretamente para a área de transferência do Windows, sem imprimi-lo no terminal:

```powershell
node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('hex'))" | Set-Clipboard
```

Cole o novo valor apenas no campo JWT_SECRET de backend/.env, salve, limpe a área de transferência, reinicie o backend e faça novo login. Tokens antigos deixarão de ser aceitos; não há alteração de dados MySQL. Não envie o segredo ao chat, GitHub, screenshots ou variáveis EXPO_PUBLIC_*.

## Git, backups e privacidade

Foram revisados git status, diff, diff --check e arquivos novos candidatos ao Git. Busca local em 94 candidatos não encontrou o JWT atual, padrões de chave privada ou tokens AWS/GitHub; não foram impressos valores de credenciais. Essa busca é limitada e não é um pentest nem varredura integral de todo histórico remoto.

backend/.env e .env.local não são rastreados e estão ignorados. O exemplo backend/.env.example só contém campos e placeholder. Não há backups entre os candidatos atuais ao Git. Regras adicionais cobrem diretórios backup/backups, .bak, .backup, .dump e nomes comuns de dumps/arquivos compactados. SQL de estrutura e migração permanece versionável; nomes arbitrários de backup não podem ser identificados com garantia por extensão. Guarde qualquer backup fora do repositório e não use git add -f para arquivos privados.

O caminho absoluto com nome da conta Windows foi removido do relatório histórico de banco, sem apagar o relatório ou os artefatos privados. Scripts SQL candidatos contêm estrutura/triggers e não registros de teste; nenhuma instrução foi executada no MySQL.

## Verificações repetidas

Frontend: 26 testes aprovados. Backend: 33 aprovados e 1 MySQL opt-in não executado. Lint, typecheck, exportação Web, smoke com API simulada e Expo Doctor (20/20) aprovados. Typecheck mantém checkJs false; não cobre rigorosamente todo o JavaScript legado.

Sem commit, push, troca de branch, alteração de .env, banco ou funcionalidades. Os testes manuais do usuário estão em [ENTREGA_3_FRONTEND.md](ENTREGA_3_FRONTEND.md).
