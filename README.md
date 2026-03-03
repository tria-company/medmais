## MedMais Dashboard

O **MedMais Dashboard** é uma aplicação web em **Next.js (App Router)** para analisar, auditar e explicar a folha de pagamento de clientes MedMais.  
Ele cruza automaticamente os dados da **folha atual** (o que é pago hoje) com as regras da **CCT/contrato** e gera uma visão executiva de **custo x risco trabalhista**, além de detalhamentos por tipo de verba.

---

### O que o projeto é

- **Painel executivo de folha de pagamento**  
  - Mostra o **custo atual da empresa**, o **custo correto pela CCT** e o **impacto anual estimado** (risco/passivo).  
  - Exibe uma grade de cards comparando **Atual x Contrato x CCT** para:
    - Total Proventos  
    - Total Descontos  
    - Total Encargos  
    - Total Custos Empresa / Benefícios  
    - Líquido Funcionário  
    - Custo Total Empresa

- **Ferramenta de diagnóstico**  
  - Permite identificar:
    - Onde a empresa está **pagando abaixo do que a CCT exige** (risco trabalhista).  
    - Onde está **pagando a mais** (oportunidade de economia).  
    - Quais **verbas específicas** (salário, adicionais, descontos, encargos) explicam essas diferenças.

---

### O que está sendo feito (funcionalidades principais)

- **Visão Executiva (home)**  
  - Card com:
    - **Custo atual (o que fazem hoje)**  
    - **Custo correto (regra da CCT)**  
    - **Aumento na folha (regularização)**  
    - **Risco/passivo anual estimado**
  - Grade de cards “Onde está a diferença?” (Total Proventos, Total Descontos, Total Encargos, etc.) com comparação:
    - **Atual** → valores consolidados da operação.  
    - **Contrato** → valores simulados pelo motor de contrato/CCT.  
    - **CCT** → valores esperados pela convenção.
  - Cada card abre um **popup de detalhes**.

- **Popup de detalhes por card** (`ModalDetalhesCard`)  
  - Seção **“Totais por provento/desconto/encargo (Atual · Contrato · CCT)”**:
    - Um card para cada item (ex.: “Salário Base”, “Periculosidade”, “INSS”, “IR”, “INSS Patronal (20%)”, “FGTS (8%)”, “Terceiros”, “Acidente de Trabalho” etc.).
    - Para cada item:
      - **Atual** = soma dos valores da **folha atual** (`folha_atual`) de todos os colaboradores.  
      - **Contrato** = valores de **contrato** (`valor_contrato` das discrepâncias) ou, na falta disso, o valor da CCT ou o próprio Atual.  
      - **CCT** = valores da **CCT** (`folha_cct` / `valor_cct`).
  - **Ranking por diferença – [item selecionado]**:
    - Lista de colaboradores ordenada por **diferença absoluta** para aquele item.  
    - Mostra, para cada colaborador: Atual, Contrato, CCT e Diferença.
  - **Ranking agregado por colaborador**:
    - Para Proventos, Descontos e Encargos, exibe quem está:
      - **Pagando a mais (acima da CCT)**  
      - **Pagando abaixo/irregular (abaixo da CCT)**  
    - Baseado em `comparacao_totais` e nos totais calculados em `detalhesCardData`.

- **Comparativo por colaborador**  
  - Gráficos e tabelas que mostram, colaborador a colaborador:
    - Custo atual da empresa.  
    - Custo correto.  
    - Impacto anual estimado.  
    - Totais por tipo de verba (os mesmos 6 cards, porém na visão do colaborador).

---

### Como está sendo feito (arquitetura resumida)

#### Stack principal

- **Next.js 14+ (App Router)**  
- **TypeScript**  
- **Supabase** (PostgreSQL + client JS)  
- Estilização com **Tailwind CSS** e componentes React.

#### Fluxo de dados

1. **Leitura no Supabase**  
   - Tabela principal: `folha_de_pagamento_ia_duplicate`.  
   - Campos importantes:
     - `comparacao_totais`: totais por tipo (Total Proventos, Total Descontos, etc.).  
     - `dashboard_data`: impacto anual, gráfico de conformidade.  
     - `folha_cct_contrato`: estrutura com:
       - `folha_cct` (totais e listas por categoria: `proventos`, `descontos`, `encargos`, `custos_empresa` etc.).  
       - `discrepancias.itens` (por item, com `valor_contrato`, `valor_cct`, `diferenca`, `tipo`, `severidade`).  
     - `folha_atual`: JSON bruto com:
       - `totais` (total_proventos, total_descontos, total_encargos, etc.).  
       - `proventos`, `descontos`, `encargos`, `custos_empresa` (itens da folha paga hoje).

   - Repositórios em `lib/supabase/repositories`:
     - `visaoExecutivaColaboradoresRepository.ts`:
       - Carrega colaboradores + `comparacao_totais` + `dashboard_data` + `folha_cct_contrato` + `folha_atual`.  
       - Mescla `folha_atual` na estrutura de `folhaCctContrato` para facilitar o consumo nos detalhes.  
     - `comparacaoTotaisRepository.ts`:
       - Agrega `comparacao_totais` de todas as folhas para a visão global.  
     - `dashboardDataRepository.ts`:
       - Lê `dashboard_data` atual.

2. **Agregação para detalhes** (`lib/detalhesCardData.ts`)  
   - Função `getDetalhesCardData(colaboradores, cardKey)`:
     - Define a categoria (`proventos`, `descontos`, `encargos`, `custos_empresa`) a partir do `cardKey`.  
     - Percorre todos os colaboradores e:
       - Soma, por `item`, os valores de:
         - **Atual** (folha_atual).  
         - **Contrato** (valor_contrato / CCT / Atual, conforme o caso).  
         - **CCT** (folha_cct / valor_cct / 0).  
       - Monta `agregadoPorItem` com `{ atual, contrato, cct }` para cada item.  
       - Monta `rankingPorItem` com as diferenças por colaborador.  
     - Monta `rankingColaboradoresTotais` a partir de `comparacao_totais` (diferença total por colaborador).

3. **Renderização**  
   - `app/page.tsx`:
     - Usa os repositórios para carregar:
       - Totais globais (`getComparacaoTotais`, `getCustoTotalEmpresa`).  
       - `dashboard_data` (`getDashboardData`).  
       - Lista de colaboradores (`getVisaoExecutivaPorColaborador`).  
     - Monta a tela principal com:
       - `VisaoExecutivaResumo`.  
       - `ColaboradoresBarsChart` (comparativo por colaborador).
   - `components/dashboard/VisaoExecutivaResumo.tsx`:
     - Constrói os cards da grade “Onde está a diferença?”.  
     - Abre `ModalDetalhesCard` ao clicar em “Detalhes”.  
   - `components/dashboard/ModalDetalhesCard.tsx`:
     - Mostra os cards de itens (barras Atual/Contrato/CCT).  
     - Mostra o ranking por item e os rankings agregados.

---

### Como rodar localmente

```bash
cd medmais-dashboard
npm install
npm run dev
```

- Acesse `http://localhost:3000` no navegador.
- Configure as variáveis de ambiente do Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY` etc.) para que os repositórios consigam ler:
  - `folha_de_pagamento_ia_duplicate`  
  - seus campos JSON (`comparacao_totais`, `dashboard_data`, `folha_cct_contrato`, `folha_atual`).

---

### Em resumo

O **MedMais Dashboard** pega a folha atual e a comparação com CCT/contrato, consolida esses dados por colaborador e por tipo de verba, e entrega:

- Uma **visão executiva** rápida de custo e risco.  
- Um **detalhamento por item** (proventos, descontos, encargos, custos).  
- Rankings que mostram **onde está a diferença** em termos de valores e de colaboradores.

Tudo isso sobre uma base de dados única no Supabase, com agregação e regras de negócio centralizadas em `lib/detalhesCardData.ts` e nos repositórios de `lib/supabase`.
