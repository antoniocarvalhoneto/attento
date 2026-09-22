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

O dashboard dá prioridade às próximas reservas e à ação de reservar/alocar. A semana aparece em um único gráfico, e o resumo do dia considera somente horários que ainda não passaram.

A interface usa tipografia única, fundos neutros e azul nas ações. Indicadores são compactos e o financeiro aparece como uma lista de contas por situação, reduzindo cartões e ícones decorativos.

Login e cabeçalho usam `Attento Logomarca.png` no tema claro e `attento-logomarca-dark.png` no tema escuro, sem nome escrito separadamente. As imagens mantêm a proporção e o espaço da marca ao alternar o tema, com tamanho adaptado para celular.

Os textos e estados vazios indicam a próxima ação: criar um cadastro, rever filtros ou escolher um horário. Mensagens sobre reservas futuras não confundem ausência de próximos horários com ausência de histórico.

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

Na revisão posterior à migração, falhas de atualização em segundo plano passaram a preservar formulários abertos. Trocas de identidade/perfil em outra aba agora descartam o estado da conta anterior. Os dois cenários têm testes de regressão.

Também foram ajustados contraste de badges/links, quebra de textos longos, filtros flexíveis, tamanho de controles no celular e rolagem pelo teclado nas tabelas e agendas. As correções de layout ainda precisam ser conferidas em navegador real.

O contato acompanha atualizações entre abas sem substituir edições em andamento. O resultado e os limites da revisão estão em [REVISAO_INTERFACE.md](REVISAO_INTERFACE.md).

Os testes em `react-app/src/` cobrem componentes, integração entre telas, autenticação, datas, persistência, permissões, reservas, cadastros, pagamentos, filtros, CSV e foco dos modais. Build e lint complementam a verificação.

Na conclusão da migração: **52 testes aprovados**, build aprovado e lint sem avisos. HTML, JavaScript, CSS e logo foram conferidos via HTTP no preview; `dist/` não contém a ponte antiga.

A conferência visual em navegador real ainda está pendente: o navegador integrado não estava disponível na conclusão da migração. Os testes usam DOM simulado e não comprovam aparência ou responsividade.

O sistema continua sendo uma demonstração local, sem backend. A autenticação compara credenciais locais; a migração para React não a transforma em autenticação de produção. Fontes e ícones usam CDN.

Regras preservadas para decisão futura: status financeiro manual, contato global editável pelos dois perfis e escolha de outro profissional ativo quando a sala não tem profissional ativo associado.

A explicação das funções está em [LOGICA_DO_PROJETO.md](LOGICA_DO_PROJETO.md). Instruções da aplicação em [react-app/README.md](react-app/README.md).

## Referências operacionais Attento

Conveniências substitui Convênios: cadastro de consumo por profissional, catálogo com preços, quantidades e pagamento. Cappuccino: R$ 5/unidade. A referência é UNIT Attento e a planilha de conveniências fornecida. Não há backend; dados continuam no navegador.

As oito salas e os profissionais das grades de Horizonte (julho/2026) e Europa (setembro/2026) substituem o exemplo inicial nas novas instalações. Dados já salvos são preservados; salas do exemplo anterior ficam no filtro “Mostrar salas anteriores”. Metragem e preços de referência aparecem nos detalhes da sala. A grade fixa repete a partir do mês de origem e não gera contas automaticamente.

Disponibilidade permite escolher mês e semana e reservar por hora ou turno. Os turnos fixos, extras e a sala exclusiva bloqueiam reservas conflitantes. Horário adotado: segunda a sexta 08–22h, sábado 08–12h. A grade importada é uma referência recorrente de leitura; reservas avulsas continuam editadas pelo fluxo de alocação. Nomes de terceiros ficam ocultos na grade do usuário comum.

Relatórios foi incorporado a Contas / Financeiro. O botão Exportar CSV usa os mesmos filtros da tabela, ao lado de Nova conta. Links antigos continuam direcionando à tela unificada.

O financeiro inclui contas a pagar (despesas) e a receber, unidade, descrição de turnos/horas, filtros combinados e saldo realizado. Contas antigas sem tipo continuam recebimentos. Os exemplos de despesas da planilha orientam o cadastro; valores históricos/pessoais não foram importados automaticamente. Os relatórios consideram mês de vencimento. Consumos de conveniências não geram cobrança duplicada no financeiro.
