# Lógica do Attento

Este arquivo explica a implementação atual em React. A lógica das versões anteriores permanece no histórico Git. As explicações ficam aqui, separadas do código.

## 1. Fluxo da aplicação

`main.tsx` importa estilos e monta `App` em `StrictMode`. `App` restaura a sessão e o tema e escolhe entre `LoginPage` e `DashboardPage`.

`DashboardPage` valida o hash conforme o perfil e monta o componente da rota dentro de `DashboardLayout`. Nenhuma rota usa o antigo renderizador de strings HTML.

| Rota | Componente |
| --- | --- |
| dashboard | DashboardHome |
| availability | AvailabilityPage |
| myschedule | MySchedulePage |
| rooms / professionals | CatalogPage |
| financial / reports | FinancialPage |
| insurance | InsurancePage |
| settings | SettingsPage |

O estado dos formulários pertence aos componentes. Os serviços leem e gravam no armazenamento. Uma operação que falha não fecha o formulário nem informa sucesso.

## 2. Sessão, login e tema

| Função/componente | O que faz |
| --- | --- |
| `createAuth(storage)` | Cria o serviço de autenticação; aceita armazenamento alternativo para testes. |
| `users()` | Lê usuários existentes ou cria as duas contas demo quando a chave está ausente. Não substitui dados corrompidos. |
| `signIn(email, password)` | Normaliza e-mail, compara credenciais, grava somente o ID da sessão e verifica a persistência. |
| `restoreSession()` | Revalida o ID contra os usuários atuais e retorna identidade/perfil sem senha, ou nulo. |
| `signOut()` | Remove a sessão e verifica a remoção. |
| `browserStorage` | Acessa localStorage no momento de cada operação, permitindo capturar falhas. |
| `App` | Mantém usuário, tema e erro de saída; conecta entrada/saída e atualização entre abas. |
| `restoreAccess` | Reaplica tema e restaura o usuário. |
| `handleStorage` / `handlePageShow` | Revalidam acesso e preferências após mudanças em outra aba ou restauração do histórico. A limpeza remove os eventos. |
| `LoginPage` | Mantém e-mail, senha, visibilidade, erro e envio. |
| `handleSubmit` | Valida campos, evita envio duplicado, executa login e apresenta erro. |
| `fillDemo` | Preenche as credenciais escolhidas sem enviar o formulário. |
| `AuthLayout` | Apresenta marca e estrutura do login. |
| `applySavedTheme` | Aplica o tema persistido; usa claro se ausente ou ilegível. |
| `saveTheme` | Preserva as demais preferências, grava e só depois aplica o tema no documento. |

A autenticação continua local e de demonstração. Não há servidor, senha protegida no banco ou autorização remota.

## 3. Navegação e leitura das páginas

| Função/componente | O que faz |
| --- | --- |
| `panel.navigation` / `titles` | Definem menu por perfil e títulos. |
| `allowed(view, role)` | Verifica se o destino faz parte do menu autorizado. |
| `DashboardPage` | Mantém rota solicitada, acompanha hash e escolhe o componente permitido. |
| `handleHash` | Acompanha links diretos e voltar/avançar; o evento é removido ao desmontar. |
| Efeito de normalização | Corrige hash desconhecido/proibido e atualiza o título. |
| `navigate` | Troca hash/rota e volta ao topo, inclusive ao clicar na aba já ativa. |
| `toggleTheme` | Persiste a escolha e atualiza o estado React após sucesso. |
| `DashboardLayout` | Exibe cabeçalho, perfil, menu, tema e saída; revela a aba ativa movendo apenas a rolagem horizontal. |
| `Page` | Carrega dados com recuperação de erro e fornece dados/atualização para a tela. |
| `Page: read, refresh, update` | Leem os registros e atualizam a tela ao solicitar, receber storage, recuperar foco ou a cada minuto. |
| Efeito/limpeza de `Page` | Foca o conteúdo e volta ao topo ao montar; remove eventos e intervalo ao sair. |

Ao mudar de módulo, os formulários e modais são desmontados. Cadastros reaparecem atualizados ao retornar. Atualizações periódicas não reposicionam foco ou rolagem.

Uma falha de atualização em segundo plano conserva os dados anteriores e os rascunhos abertos, apresentando aviso de desatualização. A recuperação limpa o aviso sem remontar o formulário. Ao mudar a identidade ou o perfil da sessão em outra aba, `App` remonta o painel para descartar estado pertencente à conta anterior.

## 4. Tipos, armazenamento e dados iniciais

`models.ts` define `Unit`, `Room`, `Professional`, `Schedule`, `Account`, `Insurance`, `Collections` e `Settings`. `HOURS` contém os horários de 08h a 20h; `INSURANCE_TYPES` contém os convênios existentes. `money` formata reais e `nameOf` resolve nomes por ID, usando travessão quando o vínculo não existe.

| Função | O que faz |
| --- | --- |
| `storage.KEYS` | Mantém as mesmas chaves da versão anterior. |
| `loadData` | Lê e interpreta JSON; propaga falhas em vez de substituir conteúdo inválido. |
| `saveData` | Grava JSON e transforma falhas de armazenamento em mensagem para o formulário. |
| `uid` | Gera identificadores com UUID. |
| `initializeData` | Cria somente coleções ausentes, com os registros de demonstração anteriores. |
| `requireUser(admin)` | Verifica sessão e, quando solicitado, perfil administrativo. |
| `readCollection` | Lê uma coleção e exige um array válido. |
| `readData` | Verifica sessão, inicializa coleções, migra datas antigas e lê o conjunto. Contas e convênios não são retornados ao usuário comum. |
| `readSettings` | Lê as preferências atuais. |
| `saveRecord` | Valida campos e referências, relê a coleção e cria/edita preservando outros registros. Em contas, ajusta a data de pagamento. |
| `deleteRecord` | Verifica vínculos de sala/profissional antes de excluir. Inclui histórico e cadastros inativos. |
| `markPaid` | Marca conta ou convênio como pago; contas recebem data local de pagamento. |
| `reserveSlot` | Relê sala e agenda na confirmação, verifica disponibilidade e grava a reserva com identidade obtida da sessão. |

Datas antigas em semana/dia são fixadas usando a semana do primeiro acesso após a migração. Uma vez datadas, não são deslocadas novamente. Coleções ausentes recebem seed; coleções vazias são preservadas.

O armazenamento é separado por origem (protocolo, host e porta). A leitura e a gravação locais não constituem uma transação entre abas; uso multiusuário real exige backend.

## 5. Datas e contato

| Função | O que faz |
| --- | --- |
| `dateKey` | Formata o calendário local como AAAA-MM-DD. |
| `scheduleDate` | Converte data/hora em Date; também entende registros antigos por semana/dia. |
| `slotDate` | Resolve uma posição na semana em data fixa. |
| `migrateSchedules` | Acrescenta data somente quando o registro ainda não a possui. |
| `inWeek` | Verifica se uma reserva pertence ao intervalo semanal. |
| `upcomingSchedules` | Filtra reservas futuras e ordena cronologicamente. |
| `weekRangeLabel` | Exibe o intervalo de segunda a sábado. |
| `slotUnavailableReason` | Bloqueia sala indisponível, passado, data inválida ou conflito de sala/data/hora. |
| `displayDate` | Formata data fixa para exibição em dia/mês/ano. |
| `normalizeWhatsApp` | Retira formatação, acrescenta 55 para números nacionais com DDD e verifica comprimento. |
| `whatsappUrl` | Gera link com mensagem codificada somente para número válido. |

## 6. Dashboard

O dashboard prioriza a agenda: data e reservas restantes de hoje, ação de reservar/alocar e tabela de próximos horários vêm antes dos indicadores. `remainingToday` conta somente reservas futuras na data local, respeitando o perfil. O resumo semanal repetido foi retirado; o gráfico é a única apresentação das contagens por dia. O contato do usuário aparece como ajuda contextual, separado dos indicadores.

`readDashboard` prepara a leitura para o perfil: usuário sem senha, reservas próprias para usuário comum e financeiro apenas para administrador. Cada leitura vem de novos objetos do armazenamento.

`buildDashboard(snapshot, now)` calcula indicadores e apresentação. Resolve nomes, seleciona próximas reservas e separa modelos por perfil. O administrador recebe contagens semanais, escala do gráfico e quantidades de contas por status. O usuário recebe somente seus horários e contato. O gráfico semanal inclui reservas passadas da semana; a lista de próximas reservas exclui horários passados.

| Componente/função | O que faz |
| --- | --- |
| `DashboardHome` | Mantém modelo, erro e nova tentativa de leitura. |
| `refresh` | Lê e transforma os dados ao montar, receber storage, recuperar foco e a cada minuto. |
| Limpeza do efeito | Cancela eventos/intervalo e ignora trabalho agendado após desmontagem. |
| Efeito de foco | Foca e volta ao topo na primeira carga; atualizações não movem a página. |
| `DashboardContent` | Apresenta cada perfil; administrador tem prévia de seis próximas reservas. |
| `StatCard` | Exibe ícone, valor, rótulo e destaque de pendência. |
| `ReservationTable` | Renderiza tabela ou estado vazio; valores são texto JSX. |
| `ReservationChart` | Desenha barras, escala e dia atual, com descrição acessível por dia. |
| `FinanceSummary` | Mostra proporções da quantidade de contas, não valores monetários; trata total zero. |

## 7. Disponibilidade e agenda pessoal

`AvailabilityPage` conecta os dados a `Availability`. Este componente mantém filtros de unidade/sala/semana e o horário escolhido. A grade usa botões de horário, com datas visíveis e bloqueios calculados. O horário selecionado tem data fixa enquanto o modal permanece aberto.

`ReserveDialog` mantém profissional, turno, valor, observação e erro. No envio chama `reserveSlot`; a validação consulta o armazenamento novamente. Falhas preservam os campos. O administrador escolhe profissional ativo. O usuário recebe profissional ativo da sala ou, pela regra já existente, o primeiro ativo disponível. Após reservar, recebe confirmação e contato quando configurado.

`MySchedulePage` mostra somente reservas futuras do usuário conectado, com sala, unidade, profissional, valor e link de contato usando a data real.

## 8. Salas e profissionais

`CatalogPage` carrega `Catalog` para a coleção escolhida. `Catalog` mantém consulta, edição e exclusão. `create` prepara valores iniciais sem gravar. A consulta abre um modal de detalhes.

`CatalogEditor` mantém o rascunho. `update` altera campos no estado React; o envio usa `saveRecord` e só fecha após sucesso. Ao escolher a unidade do profissional, as opções de sala ficam restritas àquela unidade. Sem salas, o cadastro de profissional fica desativado com orientação.

`RecordActions` apresenta consulta, edição, exclusão e pagamento conforme a tela. `DeleteDialog` exige confirmação, mostra falhas e só fecha quando a operação tiver sucesso.

## 9. Financeiro, convênios e relatórios

`FinancialPage` carrega contas ou relatórios. `Financial` mantém filtros, edição, exclusão e erro. `pay` marca pagamento; `total` soma os valores filtrados; `exportReport` exporta somente a seleção. `AccountEditor` mantém profissional, descrição, valor, vencimento e status; a persistência calcula a data de pagamento.

`InsurancePage` carrega `InsuranceList`, que filtra por convênio e controla ações. `InsuranceEditor` mantém campos e calcula quantidade × valor unitário durante a edição. Sem profissionais, as telas orientam cadastrar um antes de criar registros.

| Função | O que faz |
| --- | --- |
| `filterAccounts` | Combina profissional, status e mês de vencimento. |
| `monthOptions` | Lista os meses presentes nos dados em ordem decrescente. |
| `buildCSV` | Usa ponto e vírgula, escapa aspas/quebras e neutraliza fórmulas em campos textuais. |
| `downloadCSV` | Cria Blob e URL temporária, dispara o download e libera os recursos. |

## 10. Configurações e componentes compartilhados

`SettingsPage` carrega `Settings`. O componente mantém telefone e mensagens. `changeTheme` grava antes de avisar o cabeçalho. `saveContact` revalida sessão, normaliza o telefone e preserva outras preferências; campo vazio remove o contato. Falhas mantêm o texto digitado.

Sem edição em andamento, o telefone acompanha a leitura atual após alterações em outra aba. Ao começar a digitar, o rascunho local tem prioridade e não é substituído por atualizações de fundo. Salvar com sucesso encerra o rascunho e retoma a sincronização.

`PageData` reúne coleções e configurações numa leitura protegida por `Page`. Configurações, confirmação de reserva e agenda pessoal usam essa leitura em vez de acessar o armazenamento durante a renderização. Se uma atualização falhar, conservam a última leitura válida e mostram o aviso, inclusive quando o JSON de configurações estiver corrompido.

`Modal` usa portal React fora da raiz da aplicação. Seu efeito foca o primeiro campo, bloqueia rolagem e torna o fundo inerte. O evento de teclado mantém Tab dentro do diálogo e fecha com Escape. Clique no fundo também fecha. A limpeza restaura o estado anterior e o foco se o elemento ainda existir.

`Field` e `Select` associam rótulos aos controles. `Options` apresenta registros como opções. `FormActions` apresenta cancelar/enviar. `Status` traduz status em badges. `DataTable` apresenta cabeçalhos, linhas ou estado vazio. `PageHead` apresenta título, descrição e ação.

Os callbacks de campos alteram rascunhos; callbacks de envio chamam serviços; callbacks de map/filter/find/reduce transformam coleções. A explicação fica neste documento em vez de comentários adicionados ao código.

## 11. Estilos e build

`src/style.css` contém os estilos preservados, menu horizontal, temas e responsividade. O login usa camadas de gradiente com animação CSS; `prefers-reduced-motion` desativa o movimento. Modais possuem sobreposição própria e formulários com rolagem interna.

A revisão separou cores de texto (`accent-text`, `success-text`, `warning-text`, `danger-text`) das cores dos gráficos. Isso melhora o contraste dos badges e dos links no tema escuro sem mudar as séries dos gráficos. Filtros usam largura flexível, nomes e valores longos podem quebrar linha e modais em celular respeitam a altura dinâmica da tela. Tabelas e agendas possuem regiões focáveis para rolagem pelo teclado. Essas alterações foram revisadas no código; a conferência visual real continua pendente.

Vite usa apenas o plugin React. O logo e o CSS estão dentro da aplicação. Não há mais `LegacyModule`, plugin de publicação de arquivos antigos ou serviços em `window.Attento*`. A pasta `conveniencias2/` é material anterior fora do build.

## 12. Testes e limites

`npm test`, dentro de `react-app`, executa a suíte Vitest com DOM simulado. `test/setup.ts` limpa DOM, armazenamento, histórico e mocks entre testes.

- Autenticação e login: perfis, credenciais, sessão, tema, falhas e restauração.
- Navegação: hash, permissões, cadastro entre telas, logout e limpeza.
- Dashboard: modelos, datas, isolamento por perfil, indicadores, estados vazios e nova tentativa.
- Reservas: confirmação, conflito surgido com modal aberto, falha e agenda pessoal.
- Cadastros: criação, edição, exclusão, vínculos e seleção de unidade/sala.
- Financeiro: pagamento, filtros, total de convênio, falha e exportação.
- Configurações: telefone inválido, gravação, remoção e preservação de tema.
- Serviços: datas fixas, virada de semana/ano, corrupção, referências e permissões.
- Modal: Tab, Escape e restauração de foco.

Os testes antigos que executavam os scripts removidos foram substituídos pelos testes dos serviços e componentes atuais. Eles verificam comportamento; não são mensagens mostradas no sistema nem apenas documentação.

Build TypeScript/Vite e lint verificam a aplicação. A conferência visual real ainda está pendente porque nenhum navegador estava conectado.

Resultado final da migração: 52 testes aprovados, build aprovado e lint sem avisos. O preview respondeu corretamente para HTML e assets; o diretório de build contém somente a entrada React, JavaScript, CSS e logo.

Regras de negócio preservadas para decisão futura: vencimento não altera status financeiro automaticamente; contato é global e editável por ambos os perfis; reserva do usuário pode recorrer a profissional ativo de outra sala. React não modifica essas regras nem acrescenta backend.
