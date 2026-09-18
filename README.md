# Attento

Aplicação de gestão de salas, reservas e financeiro, com interface inteiramente em **React + TypeScript**.

A migração foi concluída: login, dashboard, disponibilidade, agenda pessoal, salas, profissionais, financeiro, convênios, relatórios e configurações usam componentes React. A aplicação não carrega o antigo renderizador JavaScript nem publica uma versão paralela em `/legacy/`.

## Executar

Use Node.js 24 e, na raiz do repositório:

```bash
cd react-app
npm ci
npm run dev
```

Abra **http://127.0.0.1:5173**. No PowerShell, use `npm.cmd` caso a política de execução bloqueie `npm.ps1`.

```bash
npm test
npm run lint
npm run build
npm run preview
```

O preview abre em **http://127.0.0.1:4173**. Para publicar, sirva o conteúdo de `react-app/dist/` na raiz da origem. O roteamento usa hash, como `#dashboard` e `#availability`.

## Acesso de demonstração

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | admin@demo.com | 123456 |
| Usuário | usuario@demo.com | 123456 |

O administrador acessa todos os módulos administrativos. O usuário acessa dashboard, disponibilidade, seus horários e configurações. Destinos desconhecidos ou proibidos retornam ao dashboard.

## Funcionalidades

- Dashboard por perfil, com indicadores, próximas reservas e gráficos.
- Disponibilidade semanal por unidade e sala; alocação administrativa e reserva pelo usuário.
- Agenda pessoal com contato pelo WhatsApp quando configurado.
- Consulta, cadastro, edição e exclusão de salas e profissionais.
- Financeiro com filtros por profissional, status e mês, totais e pagamentos.
- Convênios com quantidades, valores, total calculado e pagamento.
- Relatórios financeiros com exportação CSV da seleção filtrada.
- Tema claro/escuro, conta e contato da unidade.
- Navegação por hash, histórico e links diretos.
- Modais React com teclado, contenção de foco e restauração ao fechar.
- Tratamento de falhas de armazenamento sem fechar formulários nem confirmar gravações malsucedidas.

## Estrutura

```text
react-app/
  index.html              Entrada única
  src/
    App.tsx               Sessão, login e painel
    main.tsx              Inicialização React
    assets/logo.png       Identidade visual
    style.css             Estilos e temas
    components/           Layout, campos, modais, tabelas e gráficos
    pages/                Telas da aplicação
    services/             Tipos, autenticação, dados e regras
    test/                 Preparação dos testes
  vite.config.ts          Desenvolvimento e build
  vitest.config.ts        Testes
README.md
LOGICA_DO_PROJETO.md
```

A pasta `conveniencias2/` permanece como material anterior fora da aplicação e do build. Os arquivos do painel antigo e sua ponte foram retirados; o histórico Git preserva as versões anteriores.

## Dados existentes

As chaves de `localStorage` foram preservadas: `app_users`, `app_session`, `app_units`, `app_rooms`, `app_professionals`, `app_schedules`, `app_financial_accounts`, `app_insurance` e `app_settings`.

A migração não limpa cadastros. Coleções ausentes recebem dados de demonstração. Reservas antigas que usam semana/dia são convertidas uma vez para uma data fixa, tomando a semana do primeiro acesso como referência. Dados corrompidos causam erro de leitura e não são substituídos silenciosamente.

O armazenamento depende de **protocolo, host e porta**: mudar de `localhost:8080` para `127.0.0.1:5173` não transporta os dados. Para reutilizar os dados anteriores, a aplicação precisa ser servida na mesma origem. Nenhuma cópia entre origens é automática.

## Validação e limites

Os testes em `react-app/src/` cobrem componentes, integração entre telas, autenticação, datas, persistência, permissões, reservas, cadastros, pagamentos, filtros, CSV e foco dos modais. Build e lint complementam a verificação.

Na conclusão da migração: **52 testes aprovados**, build aprovado e lint sem avisos. HTML, JavaScript, CSS e logo foram conferidos via HTTP no preview; `dist/` não contém a ponte antiga.

A conferência visual em navegador real ainda está pendente: o navegador integrado não estava disponível na conclusão da migração. Os testes usam DOM simulado e não comprovam aparência ou responsividade.

O sistema continua sendo uma demonstração local, sem backend. A autenticação compara credenciais locais; a migração para React não a transforma em autenticação de produção. Fontes e ícones usam CDN.

Regras preservadas para decisão futura: status financeiro manual, contato global editável pelos dois perfis e escolha de outro profissional ativo quando a sala não tem profissional ativo associado.

A explicação das funções está em [LOGICA_DO_PROJETO.md](LOGICA_DO_PROJETO.md). Instruções da aplicação em [react-app/README.md](react-app/README.md).
