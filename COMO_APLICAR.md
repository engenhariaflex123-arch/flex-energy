# Como aplicar este pacote no seu projeto

Este zip está organizado **exatamente** como deve ficar dentro de
`C:\Users\SD2\flex-energy` (sem pasta `frontend/` por cima).

## Passo a passo

1. Extraia este zip
2. Copie **todo o conteúdo** para dentro de `C:\Users\SD2\flex-energy`,
   sobrescrevendo os arquivos que já existirem com o mesmo nome
   (`package.json`, `src/App.tsx`, `src/index.tsx`, os componentes, etc.)
3. Arquivos novos que não existiam antes (vai criar do zero):
   - `capacitor.config.ts`
   - `src/services/push.ts`
   - `src/services/liveUpdate.ts`
4. Depois de copiar tudo, rode:

```powershell
cd C:\Users\SD2\flex-energy
npm install
```

Agora sim deve aparecer instalando pacotes novos: `@capacitor/core`,
`@capacitor/android`, `@capacitor/ios`, `@capacitor/push-notifications`,
`@capacitor/preferences`, `@capgo/capacitor-updater`.

Depois disso, siga o `PROXIMOS_PASSOS.md` (do zip anterior) a partir do passo 2
(`npx cap init`, `npx cap add android`, etc.)

## ⚠️ Atenção

Este pacote **não inclui** `Sidebar.tsx`... na verdade inclui sim (esse já foi
compartilhado). Mas ainda **não temos** `ClimateCard.tsx`, `DevicesTable.tsx`,
`PRChart.tsx`, `MonthChart.tsx`, `YearChart.tsx` — então **não sobrescreva**
nada relacionado a esses arquivos, e não vai ter problema: o `Dashboard.tsx`
deste pacote já importa eles normalmente, e o React vai continuar usando as
versões que já estão no seu projeto local.
