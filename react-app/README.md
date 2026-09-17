# Attento em React

Aplicacao em migracao incremental com React, TypeScript e Vite.

## Executar

Na pasta `react-app`, use Node.js 24 e execute:

```bash
npm ci
npm run dev
```

Abra http://127.0.0.1:5173. Login, cabeçalho, navegação e dashboard já são React; os demais módulos aparecem dentro dessa estrutura pela integração temporária. A versão independente continua em `/legacy/index.html`, na mesma origem. Não é necessário outro servidor.

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
- [x] Estrutura do painel React: cabeçalho, menu, perfil, tema, logout e navegação.
- [x] Dashboard dos dois perfis: indicadores, reservas e gráficos em componentes React.
- [ ] Demais módulos do painel, começando pela disponibilidade e agenda.
- [ ] Validacao final e retirada da ponte temporaria.

## Organizacao

- `src/main.tsx`: entrada React e estilo compartilhado.
- `src/App.tsx`: restauração da sessão, eventos de histórico e integração do login.
- `src/components/AuthLayout.tsx`: marca e estrutura visual do login.
- `src/pages/LoginPage.tsx`: formulário, erros, senha visível e contas demo.
- `src/services/auth.ts`: adaptador tipado do `auth.js` existente, com verificação de persistência.
- `src/components/DashboardLayout.tsx`: cabeçalho e menu horizontal por perfil.
- `src/pages/DashboardPage.tsx`: carregamento dos módulos, hash, permissões e tema.
- `src/pages/DashboardHome.tsx`: leitura, atualização e apresentação do dashboard por perfil.
- `src/components/dashboard/`: indicadores, tabela de reservas, gráfico semanal e resumo financeiro.
- `src/services/dashboard.ts`: modelo tipado do dashboard e cálculos com utilitários compartilhados.
- `src/components/LegacyModule.tsx`: montagem/limpeza do conteúdo atual em uma área isolada, com recuperação de erros.
- `src/services/panel.ts`: importação sob demanda dos módulos e tipos da interface temporária.
- `src/services/navigation.ts`: restauração e salvamento do tema.
- `src/**/*.test.tsx`: testes de componentes e integração com autenticação local.
- `tooling/legacy.ts`: serve apenas os arquivos listados do painel atual em desenvolvimento e inclui esses mesmos arquivos no build.
- `vite.config.ts`: integracao React e painel atual.

O CSS e a marca continuam com uma unica fonte na raiz do repositorio. Os arquivos da raiz continuam executaveis de forma independente.

Após entrar, React mostra o painel no mesmo documento, mantendo o destino permitido do hash. Rotas desconhecidas ou proibidas voltam ao dashboard. Sair remove a sessão e desmonta os módulos; mudanças de sessão em outra aba também são observadas. `/legacy/login.html` permanece como retorno ao React para quem usa a versão de compatibilidade. O `login.html` original não é alterado.

O formulário React não usa `login.js` nem `login-page.js`. A autenticação reutiliza o `auth.js` original, sem copiar regras ou redefinir as chaves `app_users` e `app_session`. O build inclui esse serviço no bundle React e fornece o mesmo arquivo ao painel temporário.

## Validação desta etapa

- 26 testes React aprovados: autenticação, estrutura, perfis, histórico, sincronização de tema, cadastro real em módulo integrado, limpeza de modais, atualização dos indicadores, isolamento dos dados por perfil, cálculos semanais, estados vazios e recuperação de erros. Os 43 testes da versão atual também passaram.
- Build TypeScript/Vite e lint aprovados.
- Arquivos e ponte para o painel conferidos via HTTP em desenvolvimento e no preview do build na etapa anterior.
- Conferência visual e fluxo completo em navegador ainda pendentes: o navegador integrado não estava disponível.

O Vitest usa um worker para limitar o consumo de memória. O dashboard já usa componentes React. Disponibilidade, agenda pessoal, cadastros, financeiro, convênios, relatórios e configurações ainda usam os renderizadores originais; cada módulo será migrado em uma etapa própria.

Consulte [o README principal](../README.md) e [a logica do projeto](../LOGICA_DO_PROJETO.md).
