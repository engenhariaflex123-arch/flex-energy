# Como aplicar - responsividade mobile

Este zip contém os ajustes de responsividade pro layout funcionar bem no celular.
Está organizado exatamente como deve ficar em `C:\Users\SD2\flex-energy`.

## Como aplicar

1. Extrai este zip
2. Copia todo o conteúdo pra dentro de `C:\Users\SD2\flex-energy`, sobrescrevendo
   os arquivos com nome igual:
   - `src/index.tsx` (só ganhou 1 linha nova, a importação do CSS)
   - `src/pages/Dashboard.tsx`
   - `src/pages/VisaoGeral.tsx`
   - `src/components/StatusCards.tsx`
   - `src/components/OperacaoCards.tsx`
   - `src/components/Sidebar.tsx`
   - `src/components/Topbar.tsx`
3. Arquivo novo (não existia antes): `src/styles/responsive.css`

## Depois de copiar

```powershell
cd C:\Users\SD2\flex-energy
npm run build
npx cap sync
```

Depois, no Android Studio, roda ▶ de novo pra reinstalar no celular.

## O que mudou, resumidamente

- Os cards de status (6 colunas) agora reorganizam sozinhos: 6 → 3 → 2 colunas
  conforme a tela fica menor.
- O menu lateral (Sidebar) virou uma "gaveta": no celular, ele fica escondido
  por padrão e some por trás de um fundo escurecido quando aberto — tocar
  fora dele fecha o menu, como um app nativo de verdade.
- Os blocos lado a lado (gráfico principal + coluna de cards, InversorStatus
  + Irradiância, Strings + Inversor) empilham um embaixo do outro em telas
  estreitas, em vez de ficarem espremidos.
- A Visão Geral (lista de usinas) ganhou menos respiro/padding no celular e o
  cabeçalho (nome do grupo + botão "Nova Usina") empilha em vez de ficar
  cortado.

## ⚠️ Ainda não estão nesse pacote (não vieram no que você me mandou até agora)

Estes componentes usam `gridTemplateColumns` fixo e também vão precisar do
mesmo tipo de ajuste, mas eu ainda não tenho o conteúdo atual deles:
- `ClimateCard.tsx`
- `PRChart.tsx`
- `DevicesTable.tsx`
- `MainChart.tsx`, `PieChart.tsx`, `BalanceCard.tsx`, `MedidorCard.tsx`,
  `StringsChart.tsx`, `InversorChart.tsx`, `InversorStatus.tsx`,
  `IrradianciaCard.tsx` — a versão que eu tenho desses é mais antiga, então
  podem estar com pequenas diferenças de layout interno (não a estrutura de
  grid externa, essa já foi ajustada no Dashboard.tsx).

Se depois de testar ainda tiver algum componente cortando conteúdo (texto
saindo da caixa, número maior que o espaço, etc.), me manda o arquivo dele
que eu ajusto especificamente.
