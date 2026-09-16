# Lógica do Attento

Guia da aplicação atual em HTML, CSS e JavaScript, revisada em 15/09/2026 e atualizado após a remoção dos trechos sem uso. As explicações ficam neste arquivo. Os nomes das funções permitem encontrá-las pela busca do editor.

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
| `app_schedules` | Horários: sala, semana relativa, dia, hora, status, profissional e usuário. |
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
| `saveData(key, value)` | Serializa e salva JSON; registra falhas no console. Não retorna confirmação de sucesso. |
| `initializeData()` | Preenche as coleções ausentes com dados de demonstração: unidades, salas, profissionais, duas semanas de horários, contas e convênios. Também inicializa configurações ausentes. |
| `loadAllIntoState()` | Lê as coleções e preferências salvas para `STATE`. |
| `persist(key, data)` | Repassa a chamada diretamente para `saveData`, sem regra adicional. |
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
| `applyTheme(theme)` | Atualiza o tema em `STATE`, no HTML, no ícone do cabeçalho e nas configurações salvas. |
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
| `renderDashboardAdmin()` | Produz os indicadores, próximos agendamentos, resumo semanal, gráfico de reservas e distribuição das contas por status. O gráfico conta reservas da semana relativa zero, incluindo dias já passados. |
| `renderDashboardUser()` | Produz os indicadores e próximos horários do usuário conectado, além do acesso ao WhatsApp configurado. A contagem semanal considera apenas reservas ainda futuras. |
| `statCard(icon, color, label, value)` | Retorna o HTML de um indicador. |
| `statusBadge(status)` | Converte status de reservas, contas e profissionais em rótulo com classe visual. |
| `tableOrEmpty(list, headers, rows, emptyMsg, emptyIcon)` | Retorna uma tabela ou uma mensagem de lista vazia. As células aceitam HTML; quem prepara as linhas deve escapar os textos. |

### Agenda

| Função | O que faz |
| --- | --- |
| `renderAvailability()` | Aplica filtros de unidade, sala e semana, exclui salas inativas e monta uma agenda por sala. |
| `scheduleFor(week, roomId, day, time)` | Procura o primeiro registro correspondente à combinação de semana, sala, dia e hora. |
| `renderRoomAgenda(room, week)` | Monta a grade de dias/horários. Sem registro, considera a célula disponível. |
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
| `persist()` | É usado, mas apenas chama `saveData()`. Pode ser unificado numa etapa própria, atualizando seus consumidores. Não é uma função morta. |
| `reset()` retornado por `AttentoLogin.mount()` | Removido. Nenhum consumidor utilizava esse retorno. |
| `ROOMS_CACHE` | É usado na criação da agenda, mas repete manualmente vínculos de salas e unidades. Convém obter essas informações da mesma fonte dos cadastros. Não remover sem substituir seu uso. |
| Resumo semanal e gráfico no dashboard | Apresentam as mesmas contagens por dia em dois lugares. É uma repetição de interface, não cálculo sem uso. Pode ser consolidada. |
| `react-app/` | Contém o esqueleto separado da migração, com tela de exemplo e contador. Não é carregado por `index.html` ou `login.html` da raiz. Está fora desta documentação de funções do sistema e não precisa ser apagado para limpar a aplicação atual. |

Não considero inúteis `navigate` e `rerender`: representam intenções diferentes. Também devem permanecer a verificação de sessão nas duas páginas, a restauração após histórico e os testes. Os dados de demonstração têm utilidade enquanto este projeto funcionar como demonstração.

## 9. Problemas de lógica que merecem prioridade

Estes pontos são distintos da limpeza de código. Foram identificados por leitura; não constituem uma auditoria completa nem validação visual.

1. **Datas fixas implementadas.** As reservas usam `date` no formato `AAAA-MM-DD`. `migrateSchedules()` converte registros legados uma única vez, tomando a semana do primeiro acesso após a atualização como referência; a data histórica original não pode ser recuperada do formato anterior. `dateKey()` formata o dia local, `slotDate()` converte a posição na grade em data e `inWeek()` verifica a semana da reserva. Dados já datados não são deslocados pela migração.
2. **Disponibilidade incompleta.** `renderRoomAgenda()` libera células sem registro, sem verificar se a hora passou ou se a sala está em manutenção. Os filtros de horários futuros usados em resumos não bloqueiam novas reservas na grade. Os eventos de confirmação também não revalidam a disponibilidade.
3. **Exclusões sem tratamento de vínculos.** Excluir uma sala ou profissional remove apenas seu cadastro. Reservas, contas e convênios podem continuar apontando para o ID excluído. É preciso decidir entre impedir a exclusão, inativar ou tratar os vínculos.
4. **Falha ao salvar pode parecer sucesso.** `saveData()` captura o erro e não sinaliza a falha aos formulários, que podem exibir sucesso mesmo sem persistência. O login já tem uma verificação adicional; os cadastros não.
5. **Status financeiro manual.** Uma conta pendente com vencimento passado não muda automaticamente para vencida. Indicadores e filtros seguem o campo `status` armazenado. É preciso definir a regra esperada.
6. **Contato global com rótulo de unidade.** Há um único `settings.whatsapp` para todas as unidades e o formulário está disponível nos dois perfis. Se o contato deve variar por unidade ou ser alterado só pelo administrador, a regra precisa ser implementada.
7. **Escolha automática de profissional.** A reserva do usuário pode recorrer a um profissional de outra sala quando não encontra um ativo na sala selecionada. Convém definir explicitamente se essa alternativa é permitida.

As sobras comprovadas já foram removidas. Próximas prioridades sugeridas: corrigir data/disponibilidade; tratar vínculos e falhas de persistência. A migração de interface para React não corrige essas regras por si só.

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

Os callbacks passados a `test()` representam cada cenário. Os métodos anônimos dos objetos simulados substituem recursos do navegador durante o teste. A suíte não comprova a aparência, não cobre todos os cadastros e não reproduz a rolagem real de um navegador.

## 11. Fundo do login

O efeito de luz não tem função JavaScript. `style.css` cria duas camadas decorativas com `::before` e `::after`, usa gradientes radiais e anima posição, escala e opacidade com `login-light-drift`. O formulário fica acima delas. A preferência `prefers-reduced-motion: reduce` desliga a animação; nesse caso as luzes permanecem estáticas.
