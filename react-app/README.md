# Attento em React

Aplicacao em migracao incremental com React, TypeScript e Vite.

## Executar

Na pasta `react-app`, use Node.js 24 e execute:

```bash
npm ci
npm run dev
```

Abra http://127.0.0.1:5173. O painel atual fica em `/legacy/index.html`, na mesma origem. Nao e necessario outro servidor.

```bash
npm run lint
npm test
npm run build
npm run preview
```

O build gera `dist/`, incluindo o painel temporario em `dist/legacy/`. Publique o conteudo de `dist` na raiz da origem. `preview` abre em http://127.0.0.1:4173.

O armazenamento depende de protocolo, host e porta. Dados de `localhost:8080`, `127.0.0.1:5173` e `127.0.0.1:4173` sao separados. A migracao nao copia nem apaga dados entre origens.

## Etapas

- [x] Base React, identidade visual e acesso ao painel existente.
- [x] Formulário de login React, tema, sessão e contas demo.
- [ ] Estrutura do painel React.
- [ ] Modulos do painel, um por vez.
- [ ] Validacao final e retirada da ponte temporaria.

## Organizacao

- `src/main.tsx`: entrada React e estilo compartilhado.
- `src/App.tsx`: restauração da sessão, eventos de histórico e integração do login.
- `src/components/AuthLayout.tsx`: marca e estrutura visual do login.
- `src/pages/LoginPage.tsx`: formulário, erros, senha visível e contas demo.
- `src/services/auth.ts`: adaptador tipado do `auth.js` existente, com verificação de persistência.
- `src/services/navigation.ts`: abertura do painel e restauração do tema salvo.
- `src/**/*.test.tsx`: testes de componentes e integração com autenticação local.
- `tooling/legacy.ts`: serve apenas os arquivos listados do painel atual em desenvolvimento e inclui esses mesmos arquivos no build.
- `vite.config.ts`: integracao React e painel atual.

O CSS e a marca continuam com uma unica fonte na raiz do repositorio. Os arquivos da raiz continuam executaveis de forma independente.

Após entrar, o navegador abre `/legacy/index.html`, mantendo o destino do hash. As permissões de cada rota continuam sendo verificadas pelo painel. `/legacy/login.html` é uma página de retorno ao login React, usada ao sair ou quando a sessão está ausente. Essa página é gerada pela ponte; o `login.html` original não é alterado.

O formulário React não usa `login.js` nem `login-page.js`. A autenticação reutiliza o `auth.js` original, sem copiar regras ou redefinir as chaves `app_users` e `app_session`. O build inclui esse serviço no bundle React e fornece o mesmo arquivo ao painel temporário.

## Validação desta etapa

- 9 testes React e 43 testes da versão atual aprovados.
- Build TypeScript/Vite e lint aprovados.
- Arquivos e ponte para o painel conferidos via HTTP em desenvolvimento e no preview do build.
- Conferência visual e fluxo completo em navegador ainda pendentes: o navegador integrado não estava disponível.

Consulte [o README principal](../README.md) e [a logica do projeto](../LOGICA_DO_PROJETO.md).
