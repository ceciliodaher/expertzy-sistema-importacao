<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Estrutura inicial de sistema web simples

A proposta segue o pedido de manter tudo extremamente básico — sem back-end, sem Docker, sem bundlers. O objetivo é criar um ponto de partida limpo e modular, fácil de ampliar depois.

## 1. Árvore de diretórios

```text
my-app/
├── index.html          ← página de entrada
├── /css
│   ├── reset.css       ← reset/opções globais
│   └── main.css        ← estilos da aplicação
├── /js
│   ├── services/       ← módulos de dados (mock) ou futuras APIs
│   │   └── data.js
│   ├── components/     ← componentes reutilizáveis
│   │   ├── table.js
│   │   └── modal.js
│   └── app.js          ← ponto de inicialização
└── /assets             ← imagens, ícones, fontes, etc.
```

Esta organização garante:

* separação clara de _layout_ (HTML), apresentação (CSS) e lógica (JS);
* caminho natural para escalar: basta adicionar novos subdiretórios em `js/` ou `css/`.


## 2. index.html

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Minha Aplicação Modular</title>
  <link rel="stylesheet" href="css/reset.css">
  <link rel="stylesheet" href="css/main.css">
</head>
<body>
  <header>
    <h1>Controle de Importação</h1>
  </header>

  <main id="app">
    <!-- conteúdo gerado pelo JS -->
  </main>

  <script type="module" src="js/app.js"></script>
</body>
</html>
```

* `<script type="module">` habilita ES Modules nativos, permitindo **import/export** entre arquivos JS sem ferramenta extra.


## 3. JS modular (exemplo)

### js/app.js

```javascript
import { loadData }      from "./services/data.js";
import { buildTable }    from "./components/table.js";

document.addEventListener("DOMContentLoaded", async () => {
  const data = await loadData();          // hoje simulação, amanhã chamada API
  const target = document.querySelector("#app");
  target.appendChild(buildTable(data));
});
```


### js/services/data.js

```javascript
// Simulação de dados; futuramente trocar por fetch() para API ou arquivo JSON
export async function loadData() {
  return [
    { item: "84099112", descricao: "Juntas motor", ncm: "84099112", qtd: 3000 },
    { item: "85119000", descricao: "Porta-escovas", ncm: "85119000", qtd: 100 }
  ];
}
```


### js/components/table.js

```javascript
export function buildTable(rows) {
  const table = document.createElement("table");

  const headers = ["Item", "Descrição", "NCM", "Quantidade"];
  table.appendChild(
    buildRow(headers, "th")
  );

  rows.forEach(r => {
    table.appendChild(
      buildRow([r.item, r.descricao, r.ncm, r.qtd])
    );
  });

  return table;
}

function buildRow(cells, cellTag = "td") {
  const tr = document.createElement("tr");
  cells.forEach(text => {
    const cell = document.createElement(cellTag);
    cell.textContent = text;
    tr.appendChild(cell);
  });
  return tr;
}
```

* Cada componente exporta apenas o que é necessário, mantendo responsabilidade única.
* Serviço de dados isolado — trocar para `fetch("/api/items")` quando existir API é trivial.


## 4. CSS minimalista

### css/reset.css

```css
/* Pequeno reset de estilo */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, sans-serif; }
```


### css/main.css

```css
header { padding: 1rem; background: #0f4c81; color:white; }
table  { width: 100%; border-collapse: collapse; margin-top: 1rem; }
th, td { border: 1px solid #ddd; padding: .5rem; text-align: left; }
th     { background:#f2f2f2; }
```


## 5. Como rodar

1. Copie a estrutura acima.
2. Abra `index.html` no navegador.
(Em arquivos locais o ES Module funciona sem servidor em Chrome/Edge; no Firefox será necessário servir via `http`).
3. Edite, recarregue, repita.

Quando chegar o momento de adicionar:

* **APIs** → trocar `loadData()` por `fetch(...)`.
* **Docker** → adicionar `Dockerfile` servindo um container Nginx ou Node.
* **Build/bundler** → incorporar Vite, Webpack ou Parcel, mantendo a mesma hierarquia.

Dessa forma o sistema começa **enxuto** e **modular**, pronto para crescer sem reescrever nada.

<div style="text-align: center">⁂</div>

[^1]: ENTRA-DI-Detalhado-v-4.1.xlsx

