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
npm run build
npm run preview
```

O build gera `dist/`, incluindo o painel temporario em `dist/legacy/`. Publique o conteudo de `dist` na raiz da origem. `preview` abre em http://127.0.0.1:4173.

O armazenamento depende de protocolo, host e porta. Dados de `localhost:8080`, `127.0.0.1:5173` e `127.0.0.1:4173` sao separados. A migracao nao copia nem apaga dados entre origens.

## Etapas

- [x] Base React, identidade visual e acesso ao painel existente.
- [ ] Formulario de login React.
- [ ] Estrutura do painel React.
- [ ] Modulos do painel, um por vez.
- [ ] Validacao final e retirada da ponte temporaria.

## Organizacao

- `src/main.tsx`: entrada React e estilo compartilhado.
- `src/App.tsx`: pagina de entrada.
- `tooling/legacy.ts`: serve apenas os arquivos listados do painel atual em desenvolvimento e inclui esses mesmos arquivos no build.
- `vite.config.ts`: integracao React e painel atual.

O CSS e a marca continuam com uma unica fonte na raiz do repositorio. Os arquivos da raiz continuam executaveis de forma independente.

Consulte [o README principal](../README.md) e [a logica do projeto](../LOGICA_DO_PROJETO.md).
