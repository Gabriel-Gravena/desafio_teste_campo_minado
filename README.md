# Desafio de testes: Campo Minado (18 x 14, 40 bombas)

Este repositório tem **apenas os casos de teste** (Jest). O desafio é implementar `src/campoMinado.js` até que todos passem.

```bash
npm install
npm test
```

> Sem a implementação, os testes falham com `Cannot find module`, e isso é esperado.

## Regras adotadas

- Tabuleiro de **18 colunas x 14 linhas** (252 células) com **40 minas**.
- As coordenadas são `(linha, coluna)`, a partir de 0: linhas `0..13` e colunas `0..17`.
- No modo aleatório, as minas só são sorteadas no **primeiro clique**. A célula clicada e as vizinhas dela nunca têm mina, então o primeiro clique sempre abre uma área.
- Revelar uma célula com 0 minas vizinhas abre as vizinhas em **cascata**. A cascata para nos números e nas bandeiras.
- Revelar uma célula com bandeira ou já revelada não faz nada e retorna `0`.
- Revelar uma mina leva à **derrota**. Todas as minas sem bandeira passam a aparecer.
- A **vitória** acontece quando todas as células sem mina estão reveladas. Bandeiras não são necessárias.
- Depois do fim do jogo, `revelar` e `alternarBandeira` lançam erro.
- Coordenadas fora do tabuleiro lançam `RangeError`.

## API esperada (`src/campoMinado.js`, CommonJS)

`new CampoMinado({ linhas = 14, colunas = 18, bombas = 40, minas?, rng = Math.random })`

- `minas`: lista de `[linha, coluna]` com posições fixas. Quando informada, `totalMinas = minas.length`.

| Membro | Descrição |
|---|---|
| `linhas`, `colunas`, `totalMinas` | Dimensões e total de minas |
| `estado` | `'jogando'`, `'vitoria'` ou `'derrota'` |
| `celulasReveladas` | Quantidade de células seguras reveladas |
| `bandeirasRestantes` | `totalMinas - bandeiras` (pode ficar negativo) |
| `revelar(l, c)` | Número de células reveladas nessa jogada |
| `alternarBandeira(l, c)` | Novo estado da bandeira (`false` se a célula estiver revelada) |
| `obterCelula(l, c)` | `{ revelada, bandeira }` |
| `temMina(l, c)` | `boolean` |
| `contarMinasVizinhas(l, c)` | De 0 a 8, contando as diagonais |
| `obterVisao()` | Matriz de strings: `'#'` oculta, `'F'` bandeira, `'*'` mina, `'0'`..`'8'` |
