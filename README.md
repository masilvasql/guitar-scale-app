# 🎸 Escala de Guitarra

Aplicação web interativa para desenhar e visualizar escalas no braço da guitarra.

## Funcionalidades

- **Braço de guitarra visual** com 6 cordas (E, B, G, D, A, E), trastes metálicos e inlays nos trastes tradicionais
- **Marcação por clique** — clique em qualquer posição (corda + casa) para marcar
- **Dedos (1–6)** — atribua o número do dedo utilizado em cada posição
- **Cifras (A–G)** — marque notas musicais com sustenidos (#) e bemóis (b)
- **Entrada por teclado** — digite números ou letras diretamente após selecionar uma posição
- **Casa inicial configurável** — defina a partir de qual casa a visualização começa
- **Quantidade de casas** ajustável (4 a 24)
- **Nome da escala** — campo de texto para identificar a escala (ex: A# Diminuta, C Maior)
- **Escalas conhecidas com autocomplete** — aplique rapidamente escalas como Maior, Menor Natural e Menor Harmônica
- **Visualização por formatos** — escolha entre `TUDO` (padrão) ou isolar um formato específico (1º ao 5º, estilo CAGED)
- **Download como imagem** — exporte a escala como PNG em alta resolução para compartilhar
- **Remover marcações** — clique numa nota já marcada para removê-la
- **Limpar tudo** — botão para resetar todas as marcações
- **Cores diferenciadas** — cada dedo e cada nota tem uma cor distinta
- **Cordas realistas** — as 3 cordas finas são prateadas e as 3 grossas são douradas

## Tecnologias

- [React](https://react.dev/) 19
- [Vite](https://vite.dev/) 7
- [html2canvas](https://html2canvas.hertzen.com/) — captura de tela para download

## Como usar

```bash
# Instalar dependências
npm install

# Rodar em modo de desenvolvimento
npm run dev

# Gerar build de produção
npm run build

# Deploy para GitHub Pages
npm run deploy
```

## Como funciona

1. Ajuste a **casa inicial** e a **quantidade de casas** nos controles
2. Digite o **nome da escala** no campo de texto
3. **Clique** em uma posição no braço da guitarra — aparece um círculo azul pulsante
4. Escolha entre **dedo (1–6)** ou **cifra (A–G, com # ou b)** pelo teclado ou pelos botões
5. Para escalas conhecidas, use o seletor de **visualização de formatos** (`TUDO`, `1º`, `2º` ... `5º`)
6. Repita para todas as posições da escala
7. Clique em **Download** para salvar a imagem da escala

## Licença

Projeto pessoal para uso próprio.
