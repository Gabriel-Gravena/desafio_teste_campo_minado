const { CampoMinado } = require('../src/campoMinado');

const LINHAS = 14;
const COLUNAS = 18;
const TOTAL_CELULAS = LINHAS * COLUNAS;
const BOMBAS = 40;

const MINAS_PAREDES = [
  ...Array.from({ length: 14 }, (_, l) => [l, 4]),
  ...Array.from({ length: 14 }, (_, l) => [l, 9]),
  ...Array.from({ length: 12 }, (_, l) => [l, 14]),
];

const novoJogo = () => new CampoMinado({ minas: MINAS_PAREDES });

function rngComSemente(semente) {
  let a = semente;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function contarMinas(jogo) {
  let n = 0;
  for (let l = 0; l < jogo.linhas; l++) for (let c = 0; c < jogo.colunas; c++) if (jogo.temMina(l, c)) n++;
  return n;
}

describe('criação do tabuleiro', () => {
  test('padrão: 14 linhas, 18 colunas e 40 bombas', () => {
    const jogo = new CampoMinado();
    expect(jogo.linhas).toBe(LINHAS);
    expect(jogo.colunas).toBe(COLUNAS);
    expect(jogo.totalMinas).toBe(BOMBAS);
  });

  test('começa em estado "jogando", sem células reveladas e com 40 bandeiras disponíveis', () => {
    const jogo = new CampoMinado();
    expect(jogo.estado).toBe('jogando');
    expect(jogo.celulasReveladas).toBe(0);
    expect(jogo.bandeirasRestantes).toBe(BOMBAS);
  });

  test('visão inicial: matriz 14 x 18 toda oculta', () => {
    const visao = new CampoMinado().obterVisao();
    expect(visao).toHaveLength(LINHAS);
    visao.forEach((linha) => {
      expect(linha).toHaveLength(COLUNAS);
      linha.forEach((x) => expect(x).toBe('#'));
    });
  });

  test('aceita posições fixas de minas', () => {
    const jogo = novoJogo();
    expect(jogo.totalMinas).toBe(40);
    expect(contarMinas(jogo)).toBe(40);
    expect(jogo.temMina(0, 4)).toBe(true);
    expect(jogo.temMina(13, 9)).toBe(true);
    expect(jogo.temMina(11, 14)).toBe(true);
    expect(jogo.temMina(12, 14)).toBe(false);
    expect(jogo.temMina(0, 0)).toBe(false);
  });

  test('rejeita minas duplicadas', () => {
    expect(() => new CampoMinado({ minas: [[0, 0], [0, 0]] })).toThrow();
  });

  test('rejeita minas fora do tabuleiro', () => {
    expect(() => new CampoMinado({ minas: [[14, 0]] })).toThrow();
    expect(() => new CampoMinado({ minas: [[0, 18]] })).toThrow();
    expect(() => new CampoMinado({ minas: [[-1, 0]] })).toThrow();
  });

  test('rejeita quantidade de bombas inválida', () => {
    expect(() => new CampoMinado({ bombas: TOTAL_CELULAS })).toThrow();
    expect(() => new CampoMinado({ bombas: 0 })).toThrow();
    expect(() => new CampoMinado({ bombas: -5 })).toThrow();
  });

  test('rejeita dimensões inválidas', () => {
    expect(() => new CampoMinado({ linhas: 0 })).toThrow();
    expect(() => new CampoMinado({ colunas: -1 })).toThrow();
    expect(() => new CampoMinado({ linhas: 2.5 })).toThrow();
  });
});

describe('sorteio das minas (modo aleatório)', () => {
  test('após o primeiro clique existem exatamente 40 minas', () => {
    const jogo = new CampoMinado();
    jogo.revelar(7, 9);
    expect(contarMinas(jogo)).toBe(40);
  });

  test('o primeiro clique nunca é mina e sempre abre uma área (0 vizinhas)', () => {
    const posicoes = [[0, 0], [0, 17], [13, 0], [13, 17], [7, 9], [0, 8], [6, 0]];
    for (let i = 0; i < 60; i++) {
      const [l, c] = posicoes[i % posicoes.length];
      const jogo = new CampoMinado();
      jogo.revelar(l, c);
      expect(jogo.estado).not.toBe('derrota');
      expect(jogo.temMina(l, c)).toBe(false);
      expect(jogo.contarMinasVizinhas(l, c)).toBe(0);
      expect(jogo.celulasReveladas).toBeGreaterThan(1);
    }
  });

  test('o mesmo rng gera o mesmo tabuleiro', () => {
    const a = new CampoMinado({ rng: rngComSemente(123) });
    const b = new CampoMinado({ rng: rngComSemente(123) });
    a.revelar(5, 5);
    b.revelar(5, 5);
    for (let l = 0; l < LINHAS; l++) {
      for (let c = 0; c < COLUNAS; c++) expect(a.temMina(l, c)).toBe(b.temMina(l, c));
    }
  });

  test('rngs diferentes geram tabuleiros diferentes', () => {
    const a = new CampoMinado({ rng: rngComSemente(1) });
    const b = new CampoMinado({ rng: rngComSemente(2) });
    a.revelar(5, 5);
    b.revelar(5, 5);
    let iguais = true;
    for (let l = 0; l < LINHAS; l++) for (let c = 0; c < COLUNAS; c++) if (a.temMina(l, c) !== b.temMina(l, c)) iguais = false;
    expect(iguais).toBe(false);
  });
});

describe('contarMinasVizinhas', () => {
  const jogo = novoJogo();

  test.each([
    [0, 0, 0],
    [0, 3, 2],
    [5, 3, 3],
    [13, 3, 2],
    [5, 5, 3],
    [5, 6, 0],
    [5, 8, 3],
    [0, 13, 2],
    [11, 13, 2],
    [12, 13, 1],
    [13, 13, 0],
    [12, 15, 1],
    [13, 17, 0],
  ])('(%i, %i) tem %i mina(s) vizinha(s)', (l, c, n) => {
    expect(jogo.contarMinasVizinhas(l, c)).toBe(n);
  });

  test('considera as 8 direções (inclusive diagonais)', () => {
    const minas = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]];
    const mini = new CampoMinado({ linhas: 3, colunas: 3, minas });
    expect(mini.contarMinasVizinhas(1, 1)).toBe(8);
  });

  test('lança RangeError fora do tabuleiro', () => {
    expect(() => jogo.contarMinasVizinhas(14, 0)).toThrow(RangeError);
  });
});

describe('revelar', () => {
  test('revelar uma célula numerada revela só ela', () => {
    const jogo = novoJogo();
    expect(jogo.revelar(0, 3)).toBe(1);
    expect(jogo.celulasReveladas).toBe(1);
    expect(jogo.obterCelula(0, 3)).toEqual({ revelada: true, bandeira: false });
    expect(jogo.obterVisao()[0][3]).toBe('2');
    expect(jogo.obterVisao()[0][2]).toBe('#');
  });

  test('revelar uma célula com 0 vizinhas abre a região em cascata até os números', () => {
    const jogo = novoJogo();
    expect(jogo.revelar(0, 0)).toBe(56);
    expect(jogo.celulasReveladas).toBe(56);
    const visao = jogo.obterVisao();
    expect(visao[0][0]).toBe('0');
    expect(visao[0][3]).toBe('2');
    expect(visao[5][3]).toBe('3');
    expect(visao[0][4]).toBe('#');
    expect(visao[0][5]).toBe('#');
    expect(jogo.estado).toBe('jogando');
  });

  test('a cascata não revela minas', () => {
    const jogo = novoJogo();
    jogo.revelar(0, 0);
    MINAS_PAREDES.forEach(([l, c]) => expect(jogo.obterCelula(l, c).revelada).toBe(false));
  });

  test('revelar célula já revelada não faz nada e retorna 0', () => {
    const jogo = novoJogo();
    jogo.revelar(0, 0);
    expect(jogo.revelar(0, 1)).toBe(0);
    expect(jogo.celulasReveladas).toBe(56);
  });

  test('revelar célula com bandeira não faz nada e retorna 0', () => {
    const jogo = novoJogo();
    jogo.alternarBandeira(0, 0);
    expect(jogo.revelar(0, 0)).toBe(0);
    expect(jogo.obterCelula(0, 0).revelada).toBe(false);
    expect(jogo.estado).toBe('jogando');
  });

  test('bandeira bloqueia a cascata naquela célula', () => {
    const jogo = novoJogo();
    jogo.alternarBandeira(5, 1);
    jogo.revelar(0, 0);
    expect(jogo.obterCelula(5, 1).revelada).toBe(false);
    expect(jogo.celulasReveladas).toBe(55);
  });

  test('a cascata atravessa bordas sem sair do tabuleiro', () => {
    const jogo = novoJogo();
    expect(() => jogo.revelar(13, 17)).not.toThrow();
    expect(jogo.celulasReveladas).toBe(100);
  });

  test('lança RangeError fora do tabuleiro', () => {
    const jogo = novoJogo();
    expect(() => jogo.revelar(14, 0)).toThrow(RangeError);
    expect(() => jogo.revelar(0, 18)).toThrow(RangeError);
    expect(() => jogo.revelar(-1, 0)).toThrow(RangeError);
    expect(() => jogo.revelar(0, -1)).toThrow(RangeError);
  });

  test('as extremidades válidas (13,17) e (0,0) funcionam', () => {
    const jogo = novoJogo();
    expect(() => jogo.revelar(0, 0)).not.toThrow();
    expect(() => jogo.revelar(13, 17)).not.toThrow();
  });
});

describe('bandeiras', () => {
  test('alternarBandeira marca e desmarca', () => {
    const jogo = novoJogo();
    expect(jogo.alternarBandeira(0, 4)).toBe(true);
    expect(jogo.obterCelula(0, 4)).toEqual({ revelada: false, bandeira: true });
    expect(jogo.obterVisao()[0][4]).toBe('F');
    expect(jogo.alternarBandeira(0, 4)).toBe(false);
    expect(jogo.obterCelula(0, 4).bandeira).toBe(false);
    expect(jogo.obterVisao()[0][4]).toBe('#');
  });

  test('bandeirasRestantes = minas - bandeiras colocadas', () => {
    const jogo = novoJogo();
    jogo.alternarBandeira(0, 4);
    jogo.alternarBandeira(1, 4);
    expect(jogo.bandeirasRestantes).toBe(38);
    jogo.alternarBandeira(0, 4);
    expect(jogo.bandeirasRestantes).toBe(39);
  });

  test('bandeirasRestantes pode ficar negativo se o jogador marcar demais', () => {
    const jogo = new CampoMinado({ linhas: 3, colunas: 3, minas: [[0, 0]] });
    jogo.alternarBandeira(1, 1);
    jogo.alternarBandeira(2, 2);
    expect(jogo.bandeirasRestantes).toBe(-1);
  });

  test('não é possível colocar bandeira em célula revelada', () => {
    const jogo = novoJogo();
    jogo.revelar(0, 3);
    expect(jogo.alternarBandeira(0, 3)).toBe(false);
    expect(jogo.obterCelula(0, 3).bandeira).toBe(false);
    expect(jogo.bandeirasRestantes).toBe(40);
  });

  test('bandeira fora do tabuleiro lança RangeError', () => {
    expect(() => novoJogo().alternarBandeira(20, 20)).toThrow(RangeError);
  });

  test('bandeira não revela a célula nem conta como célula revelada', () => {
    const jogo = novoJogo();
    jogo.alternarBandeira(0, 0);
    expect(jogo.celulasReveladas).toBe(0);
  });
});

describe('derrota', () => {
  test('revelar uma mina encerra o jogo com derrota', () => {
    const jogo = novoJogo();
    jogo.revelar(0, 4);
    expect(jogo.estado).toBe('derrota');
  });

  test('na derrota todas as minas sem bandeira são mostradas como "*"', () => {
    const jogo = novoJogo();
    jogo.alternarBandeira(13, 9);
    jogo.revelar(0, 4);
    const visao = jogo.obterVisao();
    MINAS_PAREDES.forEach(([l, c]) => {
      expect(visao[l][c]).toBe(l === 13 && c === 9 ? 'F' : '*');
    });
  });

  test('após a derrota não é possível revelar nem marcar', () => {
    const jogo = novoJogo();
    jogo.revelar(0, 4);
    expect(() => jogo.revelar(0, 0)).toThrow();
    expect(() => jogo.alternarBandeira(0, 0)).toThrow();
  });
});

describe('vitória', () => {
  test('revelar todas as células sem mina vence (bandeiras não são necessárias)', () => {
    const jogo = novoJogo();
    jogo.revelar(0, 0);
    jogo.revelar(0, 6);
    expect(jogo.estado).toBe('jogando');
    jogo.revelar(0, 11);
    expect(jogo.celulasReveladas).toBe(TOTAL_CELULAS - BOMBAS);
    expect(jogo.estado).toBe('vitoria');
  });

  test('marcar todas as minas com bandeira NÃO vence sozinho', () => {
    const jogo = novoJogo();
    MINAS_PAREDES.forEach(([l, c]) => jogo.alternarBandeira(l, c));
    expect(jogo.bandeirasRestantes).toBe(0);
    expect(jogo.estado).toBe('jogando');
  });

  test('vence revelando célula por célula', () => {
    const minas = [[0, 0]];
    const jogo = new CampoMinado({ linhas: 2, colunas: 2, minas });
    jogo.revelar(0, 1);
    jogo.revelar(1, 0);
    expect(jogo.estado).toBe('jogando');
    jogo.revelar(1, 1);
    expect(jogo.estado).toBe('vitoria');
  });

  test('após a vitória não é possível revelar nem marcar', () => {
    const jogo = novoJogo();
    jogo.revelar(0, 0);
    jogo.revelar(0, 6);
    jogo.revelar(0, 11);
    expect(() => jogo.revelar(0, 4)).toThrow();
    expect(() => jogo.alternarBandeira(0, 4)).toThrow();
  });

  test('partida aleatória: revelando todas as células seguras sempre vence', () => {
    const jogo = new CampoMinado({ rng: rngComSemente(7) });
    jogo.revelar(0, 0);
    for (let l = 0; l < LINHAS; l++) {
      for (let c = 0; c < COLUNAS; c++) {
        if (!jogo.temMina(l, c) && !jogo.obterCelula(l, c).revelada) jogo.revelar(l, c);
      }
    }
    expect(jogo.estado).toBe('vitoria');
    expect(jogo.celulasReveladas).toBe(212);
  });
});

describe('obterVisao', () => {
  test('mostra números das células reveladas como string', () => {
    const jogo = novoJogo();
    jogo.revelar(12, 13);
    expect(jogo.obterVisao()[12][13]).toBe('1');
  });

  test('retorna uma cópia (alterar não afeta o jogo)', () => {
    const jogo = novoJogo();
    const visao = jogo.obterVisao();
    visao[0][0] = 'X';
    expect(jogo.obterVisao()[0][0]).toBe('#');
  });

  test('nunca mostra minas enquanto o jogo está em andamento', () => {
    const jogo = novoJogo();
    jogo.revelar(0, 0);
    jogo.revelar(0, 6);
    jogo.obterVisao().flat().forEach((x) => expect(x).not.toBe('*'));
  });
});
