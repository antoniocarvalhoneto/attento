# Lógica do Attento

Guia da aplicação e da migração para React, atualizado em 17/09/2026. Inclui as correções de reservas, vínculos e persistência e a estrutura React do painel. As explicações ficam neste arquivo. Os nomes das funções permitem encontrá-las pela busca do editor.

## 1. Como as partes se conectam

| Arquivo | Responsabilidade |
| --- | --- |
| `login.html` | Estrutura do formulário de acesso. |
| `auth.js` | Credenciais de demonstração e sessão local, compartilhadas pelas duas páginas. |
| `login.js` | Eventos e mensagens do formulário de acesso. |
| `login-page.js` | Inicialização do login e redirecionamento para o painel. |
| `index.html` | Estrutura do painel: cabeçalho, navegação, conteúdo, modais e notificações. |
| `script.js` | Estado, dados de demonstração, navegação, telas e ações do painel. |
| `data-utils.js` | Regras compartilhadas de datas e filtros. |
| `contact.js` | Normalização de telefone e montagem de links de WhatsApp. |
| `style.css` | Aparência, responsividade e animação de luz do login. Não autentica nem salva dados. |
| `tests/*.test.cjs` | Testes automatizados executados pelo Node; não são carregados pelo site. |

Os arquivos JavaScript de produção usam uma função anônima executada imediatamente, chamada IIFE. Ela mantém variáveis internas fora do escopo global. Os módulos menores disponibilizam apenas suas interfaces em `window.AttentoAuth`, `window.AttentoLogin`, `window.AttentoData` e `window.AttentoContact`.

### Fluxo de entrada

1. `login-page.js → init()` verifica se existe uma sessão válida.
2. Sem sessão, aplica o tema salvo e conecta o formulário usando `AttentoLogin.mount()`.
3. O envio chama `onSubmit()`, que usa `signIn()` e verifica se a sessão foi persistida.
4. Com sucesso, abre `index.html`, preservando o destino depois de `#` na URL.
5. `script.js → init()` verifica a sessão novamente, inicializa os dados ausentes, carrega o estado e abre a tela permitida.

### Fluxo de uma alteração

Exemplo: salvar uma sala chama o evento configurado por `openRoomModal()`. O evento valida o nome, altera `STATE.rooms`, chama `persist()` para salvar e usa `rerender()` para atualizar a tela. `STATE` é a cópia em memória; `localStorage` é a cópia que permanece após recarregar a página.

### Navegação e atualização

`navigate()` chama `setRoute()`, que valida o perfil, sincroniza o hash, renderiza e volta ao topo. `rerender()` apenas refaz a tela atual, sem ordenar uma volta ao topo. Essa diferença é necessária para que filtros não se comportem como troca de página.

## 2. Dados e estado

| Chave em `localStorage` | Conteúdo |
| --- | --- |
| `app_users` | Usuários de demonstração, incluindo credenciais locais. |
| `app_session` | Identificador do usuário conectado: `{ userId }`. |
| `app_units` | Unidades. |
| `app_rooms` | Salas e seus vínculos com unidades. |
| `app_professionals` | Profissionais, sala, unidade, turno e valor. |
| `app_schedules` | Horários: sala, data fixa, dia, hora, status, profissional e usuário. Registros antigos conservam campos legados, mas a data fixa tem precedência. |
| `app_financial_accounts` | Contas, vencimentos, pagamentos e valores. |
| `app_insurance` | Atendimentos por convênio, quantidade e valor unitário. |
| `app_settings` | Tema e WhatsApp configurado. |

`KEYS` centraliza os nomes das chaves do painel. `STATE` guarda o usuário atual, a rota, as preferências, as listas e os filtros. Os filtros ficam em memória e não são persistidos. `DAYS` representa segunda a sábado; `HOURS` contém horários de 08:00 a 20:00. `NAV_ITEMS` descreve o menu por perfil; `VIEW_TITLES` define os títulos; `RENDERERS` associa cada rota à função que produz seu HTML.

## 3. Autenticação — `auth.js`

| Função | O que faz |
| --- | --- |
| `loadDemoUsers(storage)` | Lê usuários salvos. Se não encontrar uma lista válida, cria as duas contas de demonstração e tenta salvá-las. |
| `create({ getUsers, storage })` | Cria o serviço de autenticação. Permite fornecer uma fonte de usuários, usada também nos testes, e retorna `signIn`, `restoreSession` e `signOut`. |
| `resolveUsers()` | Função interna definida em `create`: usa `getUsers` quando fornecido; caso contrário, chama `loadDemoUsers`. |
| `signIn(email, password)` | Normaliza o e-mail, compara as credenciais e tenta salvar somente o ID na sessão. Retorna o usuário ou `null`. Uma falha de gravação é registrada, mas não impede esse retorno. |
| `restoreSession()` | Lê o ID da sessão e procura o usuário na fonte de usuários. Retorna `null` se não encontrar ou se a leitura falhar. |
| `signOut()` | Remove `app_session`. Não apaga os cadastros. |

O login é uma simulação local. A validação de perfil organiza a interface, mas não equivale a uma autorização realizada por um servidor.

## 4. Formulário — `login.js` e `login-page.js`

| Função ou evento | O que faz |
| --- | --- |
| `login.js: mount({ root, onSubmit })` | Conecta os eventos do formulário dentro de `root`. Recebe a operação de autenticação de fora, sem conhecer o dashboard. |
| `login.js: $()` / `$$()` | Buscam um elemento ou uma lista de elementos dentro do formulário. |
| Evento `submit` | Impede o envio HTML padrão, limpa erros, exige e-mail e senha, desabilita o botão, chama `onSubmit` e restaura o botão em `finally`. Credenciais recusadas e falhas de execução produzem mensagens diferentes. |
| Clique em `password-toggle` | Alterna a senha entre texto e conteúdo oculto, atualizando ícone e descrição acessível. |
| Clique em `.demo-chip` | Preenche e-mail e senha da conta de demonstração escolhida; não envia o formulário. |
| `login-page.js: init()` | Verifica sessão, define o destino, restaura o tema e conecta o formulário. |
| `login-page.js: onSubmit(email, password)` | Chama `signIn`, retorna `false` para credenciais recusadas e confirma a persistência com `restoreSession`. Só então redireciona. |
| Evento `DOMContentLoaded` | Executa `init` quando o HTML está pronto. |
| Evento `pageshow` | Se a página voltou do cache de navegação, recarrega para verificar novamente a sessão. Existe também no painel. |

O contrato atual de `onSubmit` é síncrono. Uma futura autenticação por API exigirá adaptar o tratamento para esperar a resposta assíncrona.

## 5. Datas e filtros — `data-utils.js`

| Função | O que faz |
| --- | --- |
| `monthKey(isoDate)` | Extrai `AAAA-MM` de uma string iniciada nesse formato. Retorna vazio se não reconhecer o prefixo; não faz validação completa de uma data. |
| `monthOptions(accounts)` | Extrai meses de vencimento sem repetição, ordena do mais recente para o mais antigo e cria opções com rótulos em português. |
| `filterAccounts(accounts, filtros)` | Combina profissional, status e mês de vencimento. O valor `all` desativa o respectivo filtro. Retorna uma nova lista. |
| `startOfCurrentWeek(now)` | Calcula a segunda-feira da semana de referência, à meia-noite local, sem alterar `now`. |
| `scheduleDate(schedule, now)` | Usa a data fixa e a hora do registro. Aceita `week` e `day` como alternativa para converter dados legados e posições na grade. |
| `upcomingSchedules(schedules, now)` | Mantém apenas registros `reservado` cujo horário ainda não passou e ordena pela data calculada. |
| `weekRangeLabel(week, now)` | Produz o intervalo de segunda a sábado da semana relativa, como `14/09 a 19/09`. |
| `short(date)` | Função local de `weekRangeLabel`: formata dia e mês. |

## 6. Contato — `contact.js`

| Função | O que faz |
| --- | --- |
| `normalizeWhatsApp(value)` | Remove caracteres que não são dígitos, acrescenta `55` para números de 10 ou 11 dígitos e aceita o resultado com 12 a 15 dígitos. Retorna vazio fora desses limites. Não verifica se o número existe. |
| `whatsappUrl(number, message)` | Usa a normalização e monta um link `wa.me` com a mensagem codificada. Retorna vazio quando o número não passa pela normalização. |

## 7. Funções do painel — `script.js`

### Utilidades e armazenamento

| Função | O que faz |
| --- | --- |
| `$(sel, ctx)` | Busca o primeiro elemento no contêiner informado ou no documento. |
| `$$(sel, ctx)` | Busca todos os elementos e converte o resultado em array. |
| `uid(p)` | Gera um identificador com prefixo e trecho aleatório. Não oferece garantia absoluta de unicidade. |
| `esc(str)` | Converte caracteres especiais em entidades HTML para inserir texto em templates. Precisa ser chamada nos pontos de interpolação; não protege automaticamente todos os templates. |
| `fmtCurrency(n)` | Formata um número como moeda brasileira. Valores convertidos para zero ou inválidos resultam em zero. |
| `fmtDate(iso)` | Reorganiza `AAAA-MM-DD` para `DD/MM/AAAA`; exibe travessão quando o valor está vazio. |
| `fmtLongDate(date)` | Formata a data por extenso em português, usando hoje como padrão. |
| `todayISO()` | Retorna o dia atual no calendário local como `AAAA-MM-DD`. |
| `parseCurrencyInput(str)` | Converte texto monetário brasileiro em número, retirando pontos de milhar e trocando a vírgula decimal. |
| `maskCurrencyInput(el)` | Conecta um evento de digitação que trata os dígitos como centavos e reapresenta o valor com duas casas decimais. |
| `downloadCSV(filename, rows)` | Monta CSV separado por ponto e vírgula, escapa aspas e separadores, cria um arquivo temporário no navegador e dispara o download. |
| `loadData(key)` | Lê e interpreta JSON do armazenamento; retorna `null` em ausência ou erro. |
| `saveData(key, value)` | Serializa e salva JSON. Propaga a falha para o chamador, que trata o erro na inicialização ou em `persist`. |
| `initializeData()` | Preenche as coleções ausentes com dados de demonstração: unidades, salas, profissionais, duas semanas de horários, contas e convênios. Também inicializa configurações ausentes. |
| `loadAllIntoState()` | Lê as coleções e preferências salvas para `STATE`. |
| `persist(key, data)` | Tenta gravar e retorna verdadeiro somente em caso de sucesso. Atualiza a coleção correspondente em `STATE` após salvar; em falha, mostra erro e mantém o estado anterior. `STATE_FIELDS` relaciona chaves de armazenamento com coleções em memória. |
| `saveRecord(key, existing, data, prefix)` | Prepara uma nova lista para criação/edição, sem modificar objetos existentes, e a entrega a `persist`. |
| `unitName(id)` | Procura o nome da unidade em `STATE.units`; usa travessão se não encontrar. |
| `roomName(id)` | Procura o nome da sala em `STATE.rooms`; usa travessão se não encontrar. |
| `profName(id)` | Procura o nome do profissional; usa travessão se não encontrar. |
| `whatsappLink(message)` | Monta um link usando o WhatsApp de `STATE` e `contact.whatsappUrl`. |

### Notificações, modais e tema

| Função | O que faz |
| --- | --- |
| `showToast(message, type)` | Exibe uma notificação temporária de sucesso, aviso, erro ou informação e a remove após a transição. |
| `openModal(options)` | Solicita o fechamento do modal anterior, cria o diálogo e seus botões, conecta teclado/clique, executa `onMount` e direciona o foco ao primeiro campo ou botão primário. |
| `onKey(e)` | Função interna do modal: fecha com Escape e mantém a circulação por Tab dentro do diálogo. |
| `onOverlayClick(e)` | Fecha o modal quando o clique ocorre no fundo externo ao diálogo. |
| `activeModalCleanup()` | Callback que remove o evento de teclado do modal ao fechá-lo. |
| `closeModal()` | Inicia a saída visual, atualiza o atributo de acessibilidade, remove o evento de teclado e agenda a remoção do elemento após 160 ms. |
| `confirmModal(message, onConfirm)` | Cria um diálogo de confirmação de exclusão. Executa `onConfirm` quando o usuário confirma. |
| `applyTheme(theme, save)` | Quando `save` é verdadeiro (padrão), grava antes de atualizar tema e ícone. Na inicialização usa `save: false` para apenas aplicar a preferência já carregada. |
| `toggleTheme()` | Alterna entre claro e escuro usando `applyTheme`. |
| `logout()` | Limpa o usuário em memória, encerra a sessão e redireciona para o login. |

`onMount`, usado pelos modais, é um callback: uma função passada para ser executada depois que o diálogo existe no HTML. Seus eventos de salvar e cancelar pertencem às funções de cadastro descritas abaixo.

### Navegação e inicialização

| Função | O que faz |
| --- | --- |
| `showApp()` | Revela o painel, insere a marca, preenche o usuário, constrói o menu e escolhe o destino inicial permitido. |
| `renderMainNav(role)` | Cria os botões de navegação do perfil e conecta seus cliques a `navigate`. |
| `viewAllowedForRole(view, role)` | Verifica as listas de rotas exclusivas de administrador/usuário e a existência do renderizador. |
| `renderCurrentView()` | Atualiza título e aba ativa, revela horizontalmente a aba, substitui o contêiner de conteúdo e conecta os novos eventos. Foca o conteúdo com `preventScroll`. |
| `setRoute(view, opts)` | Valida o destino, usa dashboard como alternativa, sincroniza o hash, renderiza e volta ao topo. `silent` suprime a notificação de permissão negada. |
| `handleHashChange()` | Trata alterações do hash, incluindo histórico. Usa `SUPPRESS_HASHCHANGE` para evitar a renderização duplicada da mudança provocada por `setRoute`. |
| `navigate(view)` | Atalho para uma navegação completa por `setRoute`. |
| `rerender()` | Atualiza a página atual por `renderCurrentView`, sem mudar o hash nem mandar a janela ao topo. |
| `bindGlobalEvents()` | Conecta sair, alternar tema e mudanças do hash. |
| `init()` | Verifica a sessão antes de acessar as telas. Se autenticado, inicializa dados, estado, tema, eventos globais e painel. |

### Dashboard e peças de interface

| Função | O que faz |
| --- | --- |
| `computeDashboardStats()` | Conta salas com status disponível, profissionais ativos, reservas futuras e contas pendentes. Disponibilidade aqui é o status cadastral da sala, não um cálculo por horário. |
| `renderDashboardAdmin()` | Produz os indicadores, próximos agendamentos, resumo semanal, gráfico de reservas e distribuição das contas por status. O gráfico compara datas fixas com os dias da semana atual, incluindo dias já passados. |
| `renderDashboardUser()` | Produz os indicadores e próximos horários do usuário conectado, além do acesso ao WhatsApp configurado. A contagem semanal considera apenas reservas ainda futuras. |
| `statCard(icon, color, label, value)` | Retorna o HTML de um indicador. |
| `statusBadge(status)` | Converte status de reservas, contas e profissionais em rótulo com classe visual. |
| `tableOrEmpty(list, headers, rows, emptyMsg, emptyIcon)` | Retorna uma tabela ou uma mensagem de lista vazia. As células aceitam HTML; quem prepara as linhas deve escapar os textos. |

### Agenda

| Função | O que faz |
| --- | --- |
| `renderAvailability()` | Aplica filtros de unidade, sala e semana, exclui salas inativas e monta uma agenda por sala. |
| `scheduleFor(week, roomId, day, time)` | Converte semana/dia em data fixa e procura o primeiro registro de sala/data/hora correspondente. |
| `renderRoomAgenda(room, week)` | Monta a grade de dias/horários. Usa `slotUnavailableReason` para bloquear passado, conflitos e salas indisponíveis. |
| `statusLabelPlain(status)` | Retorna o texto do status da célula; disponível recebe texto vazio. |
| `openAllocateModal(roomId, day, time, week)` | Abre a alocação do administrador. Exige um profissional, monta a reserva com valor, turno e observação, salva e atualiza a tela. |
| `openSelectSlotModal(roomId, day, time, week)` | Abre a reserva do usuário. Escolhe o primeiro profissional ativo da sala ou, como alternativa, o primeiro ativo geral. Salva o horário vinculado ao usuário e abre a confirmação com contato opcional. |

### Cadastros, financeiro e relatórios

| Função | O que faz |
| --- | --- |
| `renderRooms()` | Monta a tabela de salas e botões de visualizar, editar e excluir. |
| `roomStatusBadge(status)` | Formata os status cadastrais de sala, incluindo `inativa`. |
| `roomFormHTML(room)` | Gera o formulário de sala com dados existentes ou valores iniciais. |
| `openRoomModal(existing)` | Conecta o formulário, exige nome, cria ou altera a sala, persiste e atualiza a tela. |
| `viewRoomModal(room)` | Mostra os detalhes de uma sala em diálogo de consulta. |
| `renderProfessionals()` | Monta a tabela de profissionais, seus vínculos e ações. |
| `profFormHTML(p)` | Gera os campos do profissional, inclusive unidade, sala, turno e valor. |
| `openProfModal(existing)` | Aplica máscara de moeda, exige nome e salva a criação ou edição do profissional. |
| `viewProfModal(p)` | Exibe os detalhes cadastrais do profissional. |
| `renderFinancial()` | Filtra contas por profissional, status e mês de vencimento; monta totais, tabela e ações. |
| `finFormHTML(a)` | Gera o formulário da conta. Para uma nova conta, usa o primeiro profissional, data atual e status pendente. |
| `openFinModal(existing)` | Exige descrição, lê os campos e salva a conta. Para status pago, mantém a data de pagamento existente ou usa hoje; nos demais casos, limpa essa data. |
| `markPaid(account)` | Marca a conta como paga, registra a data atual, salva, notifica e atualiza. |
| `renderInsurance()` | Filtra registros por tipo de convênio e apresenta quantidade, valor unitário e total calculado. |
| `insFormHTML(i)` | Gera o formulário de convênio a partir de `INSURANCE_TYPES`, profissionais e valores do registro. |
| `openInsModal(existing)` | Conecta o formulário de convênio, cálculo do total, salvamento e cancelamento. |
| `recalc()` | Função interna de `openInsModal`: atualiza o total exibido multiplicando quantidade por valor unitário durante a digitação. |
| `renderMySchedule()` | Lista reservas futuras vinculadas ao usuário conectado, com link de contato quando configurado. |
| `renderReports()` | Usa os filtros financeiros para apresentar totais e linhas do relatório, com botão de exportação. |
| `renderSettings()` | Monta escolha de tema, dados da conta e formulário de WhatsApp. |

### Eventos de cada tela — `bindViewEvents(view)`

Essa função conecta os controles depois que o HTML da tela é criado. Parte das ações usa delegação: um evento no contêiner identifica qual botão foi clicado por `data-action`. Outros controles recebem eventos diretamente.

| Tela | Ações conectadas |
| --- | --- |
| Disponibilidade | Altera/limpa filtros e abre reserva ou alocação conforme o perfil. |
| Salas | Abre criação, visualização e edição; confirma e executa exclusão. |
| Profissionais | Exige existência de sala antes de criar; abre consultas/edições e confirma exclusões. |
| Financeiro | Altera/limpa filtros, exige profissional para criar, edita, marca pagamento e exclui. |
| Convênios | Filtra por tipo, exige profissional para criar, edita, marca pagamento e exclui. |
| Relatórios | Altera/limpa filtros e exporta somente a lista filtrada em CSV. |
| Configurações | Aplica tema e valida/salva/remove o contato de WhatsApp. |

As funções anônimas usadas em `map`, `filter`, `find`, `reduce` e `sort` transformam, selecionam, procuram, somam ou ordenam as coleções dentro das funções descritas. Os callbacks de cliques executam as ações da tabela acima. Os temporizadores controlam notificações e transições de modais; não simulam uma resposta de servidor.

## 8. O que está sem uso ou redundante

Constatações da leitura do código e busca de referências. Os itens marcados como removidos já foram limpos; as simplificações de código que ainda é utilizado permanecem como sugestões.

| Item | Evidência e avaliação |
| --- | --- |
| `statuses`, dentro de `initializeData` | Removido. A lista não era lida; os status continuam sendo escolhidos pelas condições sobre `seed`. |
| `STATE.filters.agendaWeek` | Removido. A agenda utiliza `availWeek`. |
| `label`, dentro de `renderRoomAgenda` | Removido. O HTML já chama `statusLabelPlain` diretamente. |
| Parâmetro `isAdmin` de `renderRoomAgenda` | Removido junto com o argumento na chamada. O `isAdmin` de `renderAvailability` continua necessário para o texto da página. |
| `persist()` | Mantido e ampliado: agora trata falhas de gravação e sincroniza o estado somente após sucesso. Não é mais um simples repasse. |
| `reset()` retornado por `AttentoLogin.mount()` | Removido. Nenhum consumidor utilizava esse retorno. |
| `ROOMS_CACHE` | É usado na criação da agenda, mas repete manualmente vínculos de salas e unidades. Convém obter essas informações da mesma fonte dos cadastros. Não remover sem substituir seu uso. |
| Resumo semanal e gráfico no dashboard | Apresentam as mesmas contagens por dia em dois lugares. É uma repetição de interface, não cálculo sem uso. Pode ser consolidada. |
| `react-app/` | Base da migração ativa. Não é carregada pelas páginas da raiz; possui entrada própria e disponibiliza o painel existente sob `/legacy/`. |

Não considero inúteis `navigate` e `rerender`: representam intenções diferentes. Também devem permanecer a verificação de sessão nas duas páginas, a restauração após histórico e os testes. Os dados de demonstração têm utilidade enquanto este projeto funcionar como demonstração.

## 9. Problemas de lógica que merecem prioridade

Estes pontos são distintos da limpeza de código. Foram identificados por leitura; não constituem uma auditoria completa nem validação visual.

1. **Datas fixas implementadas.** As reservas usam `date` no formato `AAAA-MM-DD`. `migrateSchedules()` converte registros legados uma única vez, tomando a semana do primeiro acesso após a atualização como referência; a data histórica original não pode ser recuperada do formato anterior. `dateKey()` formata o dia local, `slotDate()` converte a posição na grade em data e `inWeek()` verifica a semana da reserva. Dados já datados não são deslocados pela migração.
2. **Disponibilidade validada.** `slotUnavailableReason()` bloqueia horários passados, salas não disponíveis e conflitos de sala/data/hora. A grade desativa esses horários. `checkSlot()` relê salas e agenda do armazenamento ao abrir e ao confirmar uma reserva, recusando a ação se não conseguir verificar os dados. A data selecionada permanece fixa enquanto o modal está aberto. Isso não substitui controle transacional no servidor para uso multiusuário.
3. **Exclusões protegidas.** `deletionBlocked()` verifica vínculos de salas com profissionais/agenda e de profissionais com agenda/contas/convênios, incluindo histórico. `canDelete()` relê os registros ao confirmar a exclusão e bloqueia a remoção se houver vínculos ou se não for possível verificá-los. A mensagem orienta usar a inativação. Vínculos quebrados antes desta atualização não são reparados automaticamente.
4. **Falhas de gravação tratadas.** Cadastros, reservas, pagamentos, exclusões, tema e contato só confirmam sucesso após salvar. As alterações de coleções são preparadas sem modificar os registros atuais. Em falha, o formulário permanece aberto para nova tentativa. A inicialização interrompe a carga e mostra uma opção de tentar novamente quando não consegue gravar dados iniciais ou a migração.
5. **Status financeiro manual.** Uma conta pendente com vencimento passado não muda automaticamente para vencida. Indicadores e filtros seguem o campo `status` armazenado. É preciso definir a regra esperada.
6. **Contato global com rótulo de unidade.** Há um único `settings.whatsapp` para todas as unidades e o formulário está disponível nos dois perfis. Se o contato deve variar por unidade ou ser alterado só pelo administrador, a regra precisa ser implementada.
7. **Escolha automática de profissional.** A reserva do usuário pode recorrer a um profissional de outra sala quando não encontra um ativo na sala selecionada. Convém definir explicitamente se essa alternativa é permitida.

As sobras comprovadas foram removidas e os itens 1 a 4 foram implementados em commits separados. Os itens 5 a 7 continuam como decisões de regra de negócio para uma etapa posterior. A migração de interface para React não corrige essas regras por si só.

## 10. Testes e funções de apoio

Os arquivos `.test.cjs` executam cenários e verificam resultados. Eles não mostram erros diretamente ao usuário e não são simples comentários de documentação. O comando da suíte atual é `node --test tests/*.test.cjs`.

| Arquivo / função | Responsabilidade |
| --- | --- |
| `auth.test.cjs: setup()` | Cria armazenamento e contexto simulados para executar o serviço de autenticação. Os cenários cobrem credenciais, sessão, logout e falhas locais. |
| `login.test.cjs: mountLogin(onSubmit)` | Monta elementos e eventos simulados para testar o formulário. |
| `login.test.cjs: assertReady(element)` | Verifica que o botão voltou ao estado pronto, com rótulo visível e indicador de espera oculto. |
| `contact.test.cjs` | Testa normalização e criação de links de WhatsApp. |
| `data-utils.test.cjs` | Testa meses, combinação de filtros, datas semanais e seleção de reservas futuras. |
| `pages.test.cjs: startPage(filename, options)` | Executa uma página em contexto simulado, capturando armazenamento, formulário, eventos e redirecionamentos. |
| `navigation.test.cjs: startNavigation()` | Executa o trecho real de roteamento com DOM simulado para verificar foco, volta ao topo e deslocamento horizontal da aba. |
| `persistence.test.cjs: setup()` | Carrega o código real em contexto isolado e simula formulários/armazenamento. Testa falhas e novas tentativas nos cadastros, pagamento, preferências, reservas e migração, além da consulta de vínculos. As funções locais `element` e os callbacks de captura simulam os elementos e registram mensagens, fechamento e renderização. |

Os callbacks passados a `test()` representam cada cenário. Os métodos anônimos dos objetos simulados substituem recursos do navegador durante o teste. A suíte não comprova a aparência, não cobre todos os cadastros e não reproduz a rolagem real de um navegador.

## 11. Fundo do login

O efeito de luz não tem função JavaScript. `style.css` cria duas camadas decorativas com `::before` e `::after`, usa gradientes radiais e anima posição, escala e opacidade com `login-light-drift`. O formulário fica acima delas. A preferência `prefers-reduced-motion: reduce` desliga a animação; nesse caso as luzes permanecem estáticas.

## 12. Migração React — base, login e estrutura do painel

`react-app/src/main.tsx` monta a árvore React em `#root`, ativa `StrictMode` e importa o CSS da raiz. `App()` integra o login React com a autenticação existente. Não executa os eventos DOM de `login.js` dentro de React.

`legacyPanel()` em `tooling/legacy.ts` é uma integração temporária de desenvolvimento/build. `readLegacyFile(name)` lê o arquivo da raiz. O hook `configureServer` atende somente os nomes presentes na lista de arquivos sob `/legacy/`; caminhos desconhecidos retornam 404. O hook `generateBundle` inclui a mesma lista em `dist/legacy/`.

O painel mantém sua navegação relativa, autenticação e persistência. Login e painel ficam na mesma origem; dados de outra porta/host não são importados. O build deve ser servido na raiz da origem. Ao migrar os módulos, essa ponte será retirada.

Na etapa 2, `readLegacyFile('login.html')` passou a gerar uma página mínima que volta ao login React preservando o hash. Isso atende tanto ao logout quanto ao acesso ao painel sem sessão. `login.js` e `login-page.js` não fazem parte dessa ponte; continuam disponíveis na versão independente da raiz.

### Funções e componentes React

| Arquivo / função | Responsabilidade |
| --- | --- |
| `App()` | Mantém usuário e tema no estado React; mostra login ou painel no mesmo documento. |
| `App: restoreAccess()` | Reaplica o tema salvo e atualiza o usuário a partir da sessão. Executada ao montar e em eventos pertinentes. Se a sessão desaparecer, desmonta o painel. |
| `App: handlePageShow(event)` | Revalida o acesso quando o navegador restaura a página do cache do histórico. |
| `App: handleStorage(event)` | Revalida sessão/tema quando outra aba altera usuários, sessão ou configurações, ou limpa o armazenamento. |
| Callback de limpeza do efeito de `App` | Remove os dois eventos ao desmontar, inclusive no ciclo adicional de verificação de `StrictMode`. |
| `App: signIn(email, password)` | Chama o adaptador; se aceitar as credenciais e persistir a sessão, abre o painel. |
| `App: signOut()` | Tenta remover a sessão, desmonta o painel após sucesso e apresenta erro se a operação falhar. |
| `AuthLayout({ children })` | Apresenta marca, fundo e cartão reutilizando o CSS atual; recebe o conteúdo como filhos React. |
| `LoginPage({ onSignIn })` | Controla campos, mensagens, visibilidade de senha e estado de envio com estado React. |
| `LoginPage: handleSubmit(event)` | Valida campos obrigatórios, foca o primeiro inválido, impede envios duplicados, aguarda `onSignIn`, apresenta falhas e libera o formulário. Não usa atraso artificial. |
| `LoginPage: fillDemo(role)` | Preenche a conta escolhida e limpa erros sem enviar o formulário. |
| Callbacks de campos e senha | Atualizam os respectivos estados; o botão de senha alterna tipo, ícone e descrição acessível. |
| `services/auth: createAuth(storage)` | Cria um adaptador tipado para `window.AttentoAuth`, carregado por importação do `auth.js` original. Aceita armazenamento alternativo para testes. |
| `services/auth: restoreSession()` | Delega ao serviço existente. |
| `services/auth: signIn(email, password)` | Delega a validação e confirma o ID persistido antes de aceitar o acesso. |
| `services/auth: signOut()` | Delega a remoção e verifica se a sessão realmente deixou de existir. |
| `browserStorage.getItem/setItem/removeItem` | Acessam o armazenamento somente ao executar a operação, permitindo tratar falhas sem interromper a importação do módulo. |
| `applySavedTheme()` | Aplica o tema de `app_settings`; usa claro se ausente ou ilegível. |
| `saveTheme(theme)` | Preserva as demais configurações, grava o tema e só depois o aplica ao documento. Propaga falhas ao componente. |

O formulário recebe uma função de autenticação e aceita resultado síncrono ou uma Promise. Isso permite testar a interface sem acoplá-la ao armazenamento. Senhas permanecem no estado do formulário, sem criar uma nova chave de persistência. A autenticação continua de demonstração.

Os testes React em `LoginPage.test.tsx` cobrem campos obrigatórios, foco, contas demo, exibição de senha, duplicidade de envio e falha assíncrona. `App.test.tsx` cobre os dois perfis, sessão existente/corrompida, tema, falha ao gravar, eventos de outra aba e histórico. `test/setup.ts` limpa o DOM, o armazenamento e os mocks entre cenários. Rodar `npm test` dentro de `react-app`; a suíte anterior permanece em `node --test tests/*.test.cjs` na raiz.

Estrutura, navegação e dashboard já migrados. Próximas etapas: disponibilidade, agenda e demais módulos, um por vez. A versão `/legacy/` permanece disponível durante a transição, mas o login React não redireciona mais para ela.

Referências técnicas: [API de plugins do Vite](https://vite.dev/guide/api-plugin.html) e [StrictMode do React](https://react.dev/reference/react/StrictMode).

### Preparação da estrutura React

`loadPanel()` em `react-app/src/services/panel.ts` importa `script.js` sob demanda, após ativar a opção `AttentoReactHost`. Os utilitários de dados e contato são importados estaticamente pelo adaptador, pois também são usados pelo dashboard React. Essa opção desativa apenas a inicialização automática da página antiga. A versão independente continua usando `DOMContentLoaded` normalmente.

`window.AttentoPanel` expõe `navigation`, `titles`, `allowed`, `mount` e `readDashboard`. A navegação e as permissões continuam com uma única definição no código atual.

| Função | Responsabilidade |
| --- | --- |
| `mountPanel(root, onThemeChange)` | Verifica sessão, prepara dados e cria conteúdo, modais e notificações dentro do contêiner fornecido. Não cria cabeçalho nem eventos globais de navegação. |
| Controlador `show(view)` | Valida perfil, renderiza o módulo e volta ao topo quando muda a rota. |
| Controlador `setTheme(theme)` | Sincroniza o tema sem gravá-lo novamente; atualiza a tela de configurações quando aberta. |
| Controlador `destroy()` | Remove conteúdo, eventos do modal e temporizadores da instância. Permite montar novamente sem duplicação. |
| `scheduleTask(callback, delay)` | Registra os temporizadores de notificações e modais para permitir seu cancelamento. |
| `clearPanelTransient()` | Cancela esses temporizadores e limpa modais/notificações ao sair ou trocar de módulo. |

Durante a montagem, `$` e `$$` limitam as buscas ao contêiner do módulo. O cabeçalho React fica fora dessa área. O teste `panel.test.ts` verifica montagem, permissões, limpeza e rejeição de sessão ausente.

### Estrutura React em funcionamento — etapa 3

Na etapa 3, o fluxo passou a ser `App → DashboardPage → DashboardLayout + LegacyModule`. Na etapa 4, a rota dashboard passou a usar `DashboardHome` no lugar de `LegacyModule`. React controla cabeçalho, identificação do usuário, menu horizontal, tema, logout e hash. Os módulos ainda não migrados usam o renderizador existente; não há iframe nem dois cabeçalhos. As permissões usam a mesma definição tanto no React quanto na montagem do módulo.

| Componente ou função | Responsabilidade |
| --- | --- |
| `DashboardPage()` | Carrega a interface dos módulos sob demanda, escolhe a rota permitida e conecta tema, saída e conteúdo. Mostra erro com nova tentativa se o carregamento falhar. |
| Efeito de carregamento e sua limpeza | Usa `loadPanel()` e ignora respostas quando a página foi desmontada. O estado `attempt` permite tentar novamente. |
| `handleHash()` | Atualiza a rota solicitada em alterações do hash, inclusive links internos e histórico. O evento é removido ao desmontar. |
| Efeito de normalização da rota | Corrige destinos desconhecidos/proibidos para `#dashboard` sem acrescentar outra entrada ao histórico e atualiza o título da página. |
| `DashboardPage: navigate(next)` | Atualiza hash e estado da rota e volta ao topo, inclusive quando o usuário clica na aba já ativa. |
| `DashboardPage: toggleTheme()` | Usa `saveTheme`, atualiza o estado React após sucesso e mostra erro em caso de falha. |
| `DashboardLayout()` | Renderiza marca, título, perfil, botões e navegação permitida. Seu efeito revela a aba ativa deslocando apenas a rolagem horizontal. |
| `LegacyModule()` | Envolve o módulo numa barreira de erro vinculada à identidade e ao perfil do usuário. |
| `ModuleBoundary.getDerivedStateFromError()` | Marca uma falha de montagem/renderização do módulo sem derrubar o cabeçalho React. |
| `ModuleBoundary.render()` | Mostra o conteúdo ou mensagem de erro com botão para limpar a falha e montar novamente. |
| `MountedModule()` | Reserva um contêiner sem filhos React, monta o controlador por efeito e chama `destroy` na limpeza. Outro efeito sincroniza página e tema. |

O contêiner de `MountedModule` é intencionalmente vazio do ponto de vista do React: somente o controlador legado altera seus filhos. Isso evita disputas de DOM e permite preservar os eventos e formulários atuais até a migração individual.

Mudanças de tema na tela de configurações notificam React por `onThemeChange`. Mudanças no cabeçalho fluem para o controlador por `setTheme`, sem uma segunda gravação. Ao sair ou perder a sessão em outra aba, a limpeza remove modais, temporizadores e eventos de teclado.

`DashboardPage.test.tsx` executa os módulos reais em DOM simulado: verifica perfil, hash, navegação, sincronização de tema, criação de sala, logout, falha de montagem com recuperação e fechamento de modais ao trocar de módulo. Usa `StrictMode` para exercitar montagem e limpeza repetidas. A configuração do Vitest limita os workers a um para reduzir consumo de memória. Esses testes não substituem a conferência visual em navegador.

### Dados do dashboard React — preparação da etapa 4

`readDashboard()` na interface `AttentoPanel` verifica a sessão, inicializa/migra dados pelo caminho já existente e devolve cópias das coleções. Retorna somente as reservas do próprio usuário e nenhuma conta financeira para o perfil comum. O objeto de usuário retornado não contém senha. A leitura não monta HTML nem eventos do painel.

`buildDashboard(snapshot, now)` em `services/dashboard.ts` transforma essas coleções num modelo de apresentação. Reutiliza `upcomingSchedules`, `inWeek`, `slotDate` e `whatsappUrl` dos módulos existentes. Para administrador, calcula indicadores, contagens semanais e distribuição de contas por status; para usuário, prepara apenas seus próximos horários e contato. O gráfico semanal inclui reservas passadas dentro da semana, enquanto a agenda lista somente horários futuros.

`displayDate(date)` apresenta datas fixas como dia/mês/ano. `nameOf(items, id)`, função local de `buildDashboard`, resolve nomes ou retorna travessão para vínculos ausentes. `WEEK_DAYS` contém os rótulos de segunda a sábado. `DashboardSnapshot` descreve os dados recebidos e `DashboardModel` distingue os resultados de administrador e usuário por `role`.

`dashboard.test.ts` verifica o cálculo semanal, a virada de semana, a separação de perfis, a ordem dos horários, listas vazias e vínculos ausentes.

### Componentes do dashboard — etapa 4 concluída

A rota `#dashboard` monta `DashboardHome` com identidade e perfil do usuário. Ao entrar nessa rota, o módulo legado anterior é desmontado, incluindo seus modais e eventos. As demais rotas continuam usando `LegacyModule`. Os renderizadores de dashboard da raiz permanecem necessários para a versão independente.

| Componente ou função | Responsabilidade |
| --- | --- |
| `DashboardHome({ api })` | Mantém modelo, erro e tentativa de carga. Apresenta carregamento, conteúdo ou mensagem com botão de nova tentativa. |
| `DashboardHome: refresh()` | Lê `api.readDashboard()` e aplica `buildDashboard` em uma Promise para capturar falhas. Atualiza ao montar, receber `storage`, recuperar foco da janela e a cada minuto. |
| Limpeza do efeito de atualização | Remove eventos e intervalo; impede que trabalho agendado atualize uma instância desmontada. |
| Efeito de foco | Foca o conteúdo sem rolagem automática e volta ao topo na primeira carga bem-sucedida. Atualizações periódicas não deslocam foco nem rolagem. |
| Botão de nova tentativa | Incrementa `attempt`, reiniciando o efeito de leitura depois de uma falha. |
| `DashboardContent({ model })` | Escolhe a apresentação por perfil. O administrador vê indicadores gerais, até seis próximas reservas, semana e financeiro. O usuário vê seus horários e contato configurado. |
| `StatCard()` | Apresenta ícone, valor e rótulo do indicador; destaca pendências quando solicitado. |
| `ReservationTable()` | Apresenta reservas ou mensagem vazia. Exibe status na visão administrativa. Nomes são texto JSX, sem interpretar HTML salvo. |
| `ReservationChart()` | Desenha barras e escala da semana, destaca o dia atual e fornece descrição acessível com as contagens de cada dia. |
| `FinanceSummary()` | Calcula proporções das quantidades de contas pagas, pendentes e vencidas. Evita divisão por zero e mostra estado vazio; não representa valores monetários. |

Ao voltar de um cadastro, o dashboard é montado novamente e lê os registros persistidos. As atualizações também recalculam datas para que reservas passadas deixem a lista futura. A separação de dados por perfil é aplicada na leitura e no modelo; continua sendo uma aplicação local de demonstração.

`DashboardHome.test.tsx` cobre os dois perfis, limite de seis reservas, texto salvo sem interpretação de HTML, contato, estados vazios, atualização por eventos, manutenção de foco/rolagem e recuperação de erro. `DashboardPage.test.tsx` verifica que uma sala criada no módulo existente aparece nos indicadores ao voltar ao dashboard e que essa rota não monta o renderizador legado. `panel.test.ts` verifica que a leitura do usuário não retorna senha, contas ou reservas de terceiros e que suas cópias não alteram os registros persistidos.

Validação desta etapa: 26 testes React, build e lint aprovados. A conferência visual em navegador permanece pendente.

## 13. Serviços independentes para os módulos React

### Financeiro, convênios e relatórios

`FinancialPage` carrega a tela de contas ou relatórios. `Financial` mantém filtros, edição e exclusão; `pay` marca pagamento; `total` soma os valores filtrados; `exportReport` exporta somente as linhas visíveis. `AccountEditor` mantém o rascunho e salva descrição, profissional, valor, vencimento e status. A data de pagamento é gerida pelo repositório.

`InsurancePage` carrega `InsuranceList`, que filtra por convênio e controla as ações. `InsuranceEditor` recalcula quantidade × valor unitário enquanto os campos mudam. `finance.filterAccounts` combina os três filtros; `monthOptions` lista meses presentes; `buildCSV` escapa separadores, aspas e fórmulas; `downloadCSV` cria e libera o arquivo temporário. Os testes cobrem cadastro/pagamento, filtros, falha com nova tentativa, totais e conteúdo exportado.

### Cadastros de salas e profissionais

`CatalogPage` carrega a coleção para `Catalog`, que controla consulta, edição e exclusão. `create` prepara valores iniciais sem salvar. `CatalogEditor` mantém o rascunho, atualiza campos com `update` e só fecha após `saveRecord` ter sucesso. A seleção de unidade restringe as salas do profissional. `RecordActions` apresenta botões acessíveis por linha. `DeleteDialog` exige confirmação e mantém erros no próprio diálogo. Os testes exercitam criação, edição, remoção, vínculos e seleção de unidade/sala.

### Disponibilidade, agenda e componentes compartilhados

`Page` carrega dados com recuperação de erro, atualiza por foco/armazenamento/intervalo e posiciona o conteúdo no topo somente ao entrar na rota. Sua limpeza remove os eventos e temporizador. `Modal` usa portal React, contém o foco, fecha com Escape ou clique externo, bloqueia o fundo e restaura foco/rolagem ao desmontar. `Fields` reúne campos com rótulos, seletores, opções, ações de formulário, badges, tabelas e cabeçalhos.

`AvailabilityPage` conecta os dados à tela. `Availability` mantém filtros e horário selecionado, monta a grade e abre a confirmação. `ReserveDialog` mantém os campos, chama `reserveSlot` e preserva o formulário se houver falha. A data escolhida fica fixa enquanto o modal está aberto. `MySchedulePage` lista somente reservas futuras do usuário e gera contato com a data da reserva. `contact.normalizeWhatsApp` normaliza o telefone e `whatsappUrl` monta o link quando válido.

`models.ts` define os registros, horários, convênios, formatação monetária (`money`) e resolução de nomes (`nameOf`). `storage.ts` mantém as chaves existentes: `loadData` lê JSON sem substituir dados corrompidos; `saveData` propaga falhas de gravação; `uid` cria identificadores. `seed.initializeData` preenche somente coleções ausentes, preservando os dados de demonstração anteriores.

`dates.ts` contém as regras de datas em TypeScript: `dateKey` formata o dia local; `scheduleDate` calcula o instante; `slotDate` resolve a posição semanal; `migrateSchedules` fixa datas antigas; `inWeek` verifica a semana; `upcomingSchedules` filtra e ordena reservas futuras; `weekRangeLabel` apresenta o intervalo; `slotUnavailableReason` verifica sala, passado e conflitos.

`repository.ts` concentra operações: `requireUser` verifica sessão e perfil; `readCollection` exige uma coleção válida; `readData` inicializa, migra e lê os registros; `readSettings` lê preferências; `saveRecord` valida e cria/edita usando os dados atuais; `deleteRecord` verifica vínculos antes da remoção; `markPaid` atualiza status e data; `reserveSlot` relê disponibilidade na confirmação e associa o usuário autenticado. As operações só retornam sucesso após persistir. Os testes cobrem migração, conflitos, vínculos, falhas e permissões.
