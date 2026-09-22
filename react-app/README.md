# Attento React

Aplicação completa em React, TypeScript e Vite. Todas as telas e modais são componentes React; não há montagem de HTML legado nem plugin de compatibilidade.

## Executar e verificar

Com Node.js 24, nesta pasta:

```bash
npm ci
npm run dev
npm test
npm run lint
npm run build
npm run preview
```

Desenvolvimento: http://127.0.0.1:5173. Preview: http://127.0.0.1:4173. No PowerShell, `npm.cmd` evita restrições sobre `npm.ps1`.

Publique o conteúdo de `dist/` na raiz da origem. A navegação usa hash e a aplicação tem uma única entrada HTML. O build contém somente a aplicação React e seus assets.

## Organização

- `src/App.tsx`: sessão, login, tema e atualização entre abas.
- `src/pages/`: login, dashboard, disponibilidade, agenda pessoal, cadastros, financeiro, conveniências e configurações. Cadastro, filtros e relatórios estão na mesma tela financeira.
- `src/services/attentoReference.ts`: oito salas e grade semanal recorrente baseada nas planilhas de Horizonte/Europa. Consulte o README da raiz para regras da importação.
- `src/components/`: estrutura, modais, campos, tabelas, ações e gráficos.
- `src/services/`: autenticação local, tipos, persistência, dados iniciais, datas, contato, financeiro, dashboard e navegação.
- `src/assets/` e `src/style.css`: identidade visual, estilos e temas.
- `src/**/*.test.ts(x)`: testes de regras, componentes e integração.
- `src/test/setup.ts`: limpeza do ambiente entre cenários.

O Vitest usa um worker para limitar consumo de memória. Os testes usam DOM simulado. A revisão visual em navegador real permanece pendente.

## Persistência

As chaves e os formatos existentes de armazenamento foram mantidos. Host, porta e protocolo diferentes têm dados separados. Não há importação automática entre origens nem backend.

Consulte [o README principal](../README.md) e [a explicação da lógica](../LOGICA_DO_PROJETO.md).