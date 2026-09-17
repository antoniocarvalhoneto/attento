<p align="center">
  <img src="logo.png" alt="Attento" width="96">
</p>

<h1 align="center">Attento</h1>

<p align="center">
  Sistema de gestão de salas, agenda e financeiro para clínicas e espaços compartilhados.
</p>

---

## Sobre o projeto

**Attento** é uma aplicação web (SPA) para administrar a rotina de um espaço com múltiplas salas e profissionais: disponibilidade de horários, alocação em agenda semanal, controle de contas a pagar/receber, convênios e relatórios — tudo em uma interface única, com dois níveis de acesso (**administrador** e **usuário**).

O projeto é **100% front-end**, com dados de demonstração persistidos no `localStorage`. A versão atual na raiz não exige build. A migração incremental em `react-app/` usa React, TypeScript e Vite, preservando o painel atual durante a transição.

## Migração para React

Etapas 1 a 4 concluídas: base, login, estrutura do painel e dashboard em React. Indicadores, próximas reservas, gráfico semanal e resumo financeiro usam componentes React, respeitando os dois perfis. Os demais módulos continuam em uma área isolada, reutilizando as regras existentes. Próxima etapa: migrar a disponibilidade e a agenda.

`react-app/src/services/dashboard.ts` organiza os dados, aplica as regras compartilhadas de datas e separa as informações por perfil. `DashboardHome.tsx` apresenta o resultado e atualiza os indicadores ao entrar na página, voltar à aba, receber alterações de outra aba e a cada minuto.

```bash
cd react-app
npm ci
npm run dev
```

Abra **http://127.0.0.1:5173**. Login e painel permanecem na aplicação React, sem redirecionar após entrar. Os destinos usam hash (`#dashboard`, `#availability`, etc.), incluindo histórico e links diretos. A versão de compatibilidade continua em `/legacy/index.html`. Use `npm test`, `npm run lint`, `npm run build` e `npm run preview` para verificar e testar o build. Detalhes em [react-app/README.md](react-app/README.md).

O armazenamento é separado por origem: mudar host ou porta não transporta os dados existentes. No mesmo endereço, login e painel compartilham sessão e cadastros. Os arquivos da raiz continuam disponíveis para execução independente.

## Índice

- [Funcionalidades](#funcionalidades)
- [Stack técnica](#stack-técnica)
- [Como executar](#como-executar)
- [Acesso de demonstração](#acesso-de-demonstração)
- [Perfis de acesso](#perfis-de-acesso)
- [Estrutura de arquivos](#estrutura-de-arquivos)
- [Persistência de dados](#persistência-de-dados)
- [Responsividade](#responsividade)
- [Acessibilidade](#acessibilidade)
- [Limitações conhecidas](#limitações-conhecidas)
- [Roadmap sugerido](#roadmap-sugerido)

## Funcionalidades

- **Dashboard** com indicadores gerais, gráfico de ocupação semanal e resumo financeiro (visão diferente para admin e usuário).
- **Disponibilidade das salas** — grade semanal de horários com seleção de slot e alocação.
- **Agenda semanal** por sala/profissional, com legenda de status (disponível, reservado, ocupado, manutenção).
- **Salas** (CRUD completo) — cadastro, edição, exclusão e status (disponível, manutenção, inativa).
- **Profissionais** (CRUD completo) — vínculo com sala, status ativo/inativo.
- **Financeiro** — contas a pagar/receber, marcação de pagamento, filtros por profissional/status/período.
- **Convênios** — controle de repasses e status de pagamento.
- **Relatórios** — exportação de dados em **CSV**.
- **Meus Horários** (perfil usuário) — agenda pessoal com link direto para **WhatsApp**.
- **Configurações** — tema claro/escuro, dados da conta e WhatsApp da unidade.
- **Autenticação** com sessão persistida, controle de permissões por perfil e roteamento por hash (suporta voltar/avançar do navegador e links diretos).
- **Modo escuro** completo, com tokens de cor dedicados.
- Login e navegação local sem espera artificial, com estados vazios e mensagens de erro.

## Stack técnica

| Camada       | Tecnologia                                      |
|--------------|--------------------------------------------------|
| Estrutura    | HTML5 semântico                                   |
| Estilo       | CSS3 puro (custom properties / design tokens)     |
| Lógica       | JavaScript (Vanilla, ES6+, sem frameworks)        |
| Ícones       | [Font Awesome 6](https://fontawesome.com)         |
| Tipografia   | Google Fonts — Manrope (display) + Inter (texto)  |
| Persistência | `localStorage` do navegador                       |

A versão da raiz não tem dependências de build. A versão em `react-app/` usa npm e Vite. Ambas continuam sem backend e carregam fontes e ícones por CDN.

## Como executar

Execute a aplicação com um servidor estático local para que `login.html` e `index.html` compartilhem a sessão na mesma origem. O comportamento de `localStorage` entre arquivos abertos diretamente com duplo clique varia entre navegadores.
```bash
# Python 3
python3 -m http.server 8080

# Node (http-server)
npx http-server -p 8080
```
Depois acesse `http://localhost:8080`.

> Mantenha `index.html`, `login.html`, `style.css`, `auth.js`, `data-utils.js`, `login.js`, `login-page.js`, `script.js` e `logo.png` na mesma pasta — scripts, estilos, logo e redirecionamentos usam caminhos relativos.

`login.html` contém apenas a tela de acesso; `index.html` contém o painel. Sem sessão, o painel redireciona para o login e preserva a seção solicitada no hash da URL. Ao entrar, a aplicação retorna a essa seção, respeitando as permissões do perfil. Ao sair, a sessão é removida e o navegador retorna ao login.

## Acesso de demonstração

A tela de login tem atalhos que já preenchem essas credenciais automaticamente:

| Perfil        | E-mail             | Senha    |
|---------------|---------------------|----------|
| Administrador | `admin@demo.com`    | `123456` |
| Usuário       | `usuario@demo.com`  | `123456` |

## Perfis de acesso

**Administrador** — acesso completo: Dashboard, Disponibilidade, Salas, Profissionais, Financeiro, Convênios, Relatórios e Configurações.

**Usuário** — acesso operacional: Dashboard, Disponibilidade, Meus Horários e Configurações. Telas administrativas são bloqueadas mesmo por navegação manual de URL (verificação de permissão na camada de rotas).

## Estrutura de arquivos

```
.
├── index.html     # marcação e templates do painel
├── login.html     # página de acesso independente
├── style.css      # design tokens, layout e temas (claro/escuro)
├── script.js      # estado, roteamento, renderização e regras de negócio
├── auth.js        # validação de acesso e persistência da sessão de demonstração
├── data-utils.js  # filtros financeiros e cálculos de datas da agenda
├── contact.js     # validação do número e criação dos links de WhatsApp
├── login.js       # eventos e validação dos campos do formulário de login
├── login-page.js  # inicialização do login, tema e redirecionamento para o painel
├── logo.png       # identidade visual (fundo transparente)
└── README.md
```

O `auth.js` expõe o serviço `AttentoAuth`, responsável por entrar, restaurar a sessão e sair. Ele usa os usuários já salvos e cria as contas de demonstração no primeiro acesso quando necessário, sem depender das telas. O `login.js` gerencia o formulário e suas mensagens; o `login-page.js` conecta o formulário à autenticação e abre o painel após o acesso. O `script.js` verifica a sessão antes de inicializar o painel e controla seu estado, permissões, renderização, modais e utilitários. A autenticação permanece simulada e usa as mesmas credenciais e chaves de armazenamento já existentes.

Para verificar a autenticação, o formulário e os fluxos de entrada das páginas com Node.js:

```bash
node --test tests/*.test.cjs
```

## Persistência de dados

Todos os dados (usuários, salas, profissionais, agenda, contas, convênios) são gerados como seed na primeira execução e salvos no `localStorage` do navegador. Isso significa que:

- As alterações feitas (cadastros, exclusões, pagamentos) persistem entre sessões **no mesmo navegador**.
- Limpar o `localStorage` do site restaura os dados de demonstração originais.
- Não há sincronização entre dispositivos ou usuários — é um ambiente de demonstração/single-tenant local.

## Responsividade

Interface testada e ajustada para três faixas principais:
- **Mobile** (~375px): menu horizontal no topo com rolagem, tabelas e agenda com rolagem horizontal, formulários empilhados.
- **Tablet** (~768px): painel de login em coluna única, grade de indicadores adaptada.
- **Desktop**: layout com menu horizontal fixo no topo.

## Acessibilidade

- Navegação por teclado nos modais, com *focus trap* e fechamento via `Esc`.
- Contraste de texto ajustado para atender WCAG AA nos temas claro e escuro.
- Elementos interativos com `aria-label` e feedback visual de foco (`:focus-visible`).

## Limitações conhecidas

- Autenticação é simulada (comparação de senha em texto plano no client) — **não deve ser usada em produção** sem um backend real.
- Sem multiusuário simultâneo: dados vivem no `localStorage` do navegador local.

## Roadmap sugerido

- Integração com uma API/backend real (autenticação, banco de dados).
- Testes end-to-end no navegador.

---

<p align="center">Feito com foco em uma experiência administrativa limpa, rápida e consistente.</p>
