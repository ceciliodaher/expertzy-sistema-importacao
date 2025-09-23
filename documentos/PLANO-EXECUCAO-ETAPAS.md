# PLANO DE EXECUÇÃO - CORREÇÃO SISTEMA DI BRASILEIRO

## METODOLOGIA

Abordagem incremental ETL-first: corrigir base de dados → APIs → interface → exports  
Cada etapa deve ser validada antes da próxima usando subagents especializados

## REGRAS APLICADAS (CLAUDE.md)

- ❌ Nunca usar fallbacks (`if (!component) { return; }`)
- ✅ Sempre lançar exceções explícitas quando dados obrigatórios ausentes  
- ✅ Evitar duplicação de lógica entre módulos
- ✅ Princípio fail-fast com mensagens claras

---

## 🏗️ ETAPA 1: CORREÇÃO ETL (EXTRACT, TRANSFORM, LOAD)

**STATUS**: 🔄 EM PROGRESSO  
**OBJETIVO**: Garantir que TODOS os dados dos XMLs DI sejam extraídos, transformados e armazenados corretamente no banco

### 1.1 EXTRACT - Extração Correta dos XMLs

**STATUS**: ✅ **CONCLUÍDO**  
**RESPONSÁVEL**: PHP Developer + Technical Researcher  
**ARQUIVOS**: `/sistema-expertzy-local/xml-import/processor.php`  
**PROBLEMA**: XMLs DI têm despesas em texto livre, não estruturadas  

**ANÁLISE REALIZADA**:

- ✅ Analisados 3 XMLs DI (2300120746, 2518173187, 2520345968)
- ✅ Identificado que TODOS têm despesas em informacaoComplementar
- ✅ Mapeada estrutura real vs estrutura esperada pelo sistema
- ✅ **CONSOLIDAÇÃO**: PHP parser definido como fonte única de verdade

**AÇÕES CONCLUÍDAS**:

- ✅ Implementado `processInformacaoComplementar()` no PHP parser
- ✅ Regex robusto para SISCOMEX (`Taxa Siscomex.....: 154,23`)
- ✅ Extração AFRMM e CAPATAZIA com múltiplas variações de padrão
- ✅ Conversão monetária brasileira (vírgula → ponto decimal)
- ✅ Persistência automática na tabela `despesas_aduaneiras`
- ✅ ImportLogger expandido com métodos `info`, `success`, `warning`, `error`

**VALIDAÇÃO 1.1**: ✅ **APROVADA**

- ✅ XML parser extrai SISCOMEX R$ 154,23 da DI 2520345968 
- ✅ Dados persistidos no banco com código_receita 7811
- ✅ **Commit**: `253e962` - feat: Implementar extração completa informacaoComplementar

### 1.2 TRANSFORM - Transformação e Estruturação

**STATUS**: ⏳ AGUARDANDO  
**RESPONSÁVEL**: Database Optimizer + PHP Developer  
**PREREQUISITO**: ETAPA 1.1 concluída

### 1.3 LOAD - Carregamento Correto no Banco

**STATUS**: ⏳ AGUARDANDO
**RESPONSÁVEL**: Database Admin + PHP Developer
**PREREQUISITO**: ETAPA 1.2 concluída

---

## 🔗 ETAPA 2: CORREÇÃO APIS E CONECTIVIDADE

**STATUS**: ⏳ AGUARDANDO
**PREREQUISITO**: ETAPA 1 validada com sucesso

### 2.1 Corrigir APIs ProductMemoryManager

**STATUS**: ⏳ AGUARDANDO

### 2.2 Corrigir API Consulta Produtos Croqui

**STATUS**: ⏳ AGUARDANDO

---

## 💻 ETAPA 3: CORREÇÃO INTERFACE E APRESENTAÇÃO

**STATUS**: ⏳ AGUARDANDO
**PREREQUISITO**: ETAPA 2 validada com sucesso

### 3.1 Corrigir DataLoader Mapeamento

**STATUS**: ⏳ AGUARDANDO

### 3.2 Corrigir Eventos Despesas Extras

**STATUS**: ⏳ AGUARDANDO

---

## 📊 ETAPA 4: CORREÇÃO EXPORTS (PDF/EXCEL)

**STATUS**: ⏳ AGUARDANDO
**PREREQUISITO**: ETAPA 3 validada com sucesso

### 4.1 Corrigir ExcelExporter

**STATUS**: ⏳ AGUARDANDO

### 4.2 Corrigir CroquiNF PDF

**STATUS**: ⏳ AGUARDANDO

---

## 📈 LOG DE PROGRESSO

### 2025-09-15 - Início do Projeto

- ✅ Plano estruturado criado
- ✅ Análise completa dos 3 XMLs DI realizada
- ✅ Problemas identificados e categorizados
- ✅ **ETAPA 1.1 CONCLUÍDA** - Extração informacaoComplementar implementada

### 2025-09-15 - ETAPA 1.1 EXTRACT Concluída

- ✅ Consolidação XML parser (PHP como fonte única)
- ✅ Implementação completa extração despesas texto livre
- ✅ Validação SISCOMEX R$ 154,23 extraído e persistido
- ✅ Commit e push realizados
- 🔄 **PRÓXIMO**: Teste E2E com Playwright + API buscar-di.php

### COMMITS RELACIONADOS

- ✅ **253e962**: feat: Implementar extração completa informacaoComplementar no XML parser
  - ETAPA 1.1 EXTRACT concluída com validação aprovada
  - PHP parser como fonte única de verdade
  - SISCOMEX R$ 154,23 extraído e persistido corretamente

### TESTES EXECUTADOS

- Pendente: Testes serão documentados conforme execução

### PROBLEMAS ENCONTRADOS

- Pendente: Problemas serão documentados conforme surgem

---

## 🎯 VALIDAÇÃO FINAL GLOBAL

Testar fluxo completo com os 3 XMLs DI:

- [ ] 2300120746.xml (complexo, 16 adições) 
- [ ] 2518173187.xml (simples, 1 adição)
- [ ] 2520345968.xml (médio, despesas em texto livre)

**RESULTADO ESPERADO**: Sistema que processa QUALQUER XML DI brasileiro real com dados completos, interface funcional e exports perfeitos.

---

**ÚLTIMA ATUALIZAÇÃO**: 2025-09-15  
**PRÓXIMA REVISÃO**: Após conclusão ETAPA 1.1



**📋 PLANO ESTRUTURADO EM ETAPAS - CORREÇÃO SISTEMA DI BRASILEIRO**

     **METODOLOGIA**

     Abordagem incremental ETL-first: corrigir base de dados → APIs → interface → exports

     Cada etapa deve ser validada antes da próxima usando subagents especializados

     ---

     **🏗️ ETAPA 1: CORREÇÃO ETL (EXTRACT, TRANSFORM, LOAD)**

     **OBJETIVO**: Garantir que TODOS os dados dos XMLs DI sejam extraídos, transformados e armazenados corretamente no banco

     **1.1 EXTRACT - Extração Correta dos XMLs**

     **Responsável**: PHP Developer + Technical Researcher

     **Arquivos**: /api/services/xml-parser.php

     **Problema**: XMLs DI têm despesas em texto livre, não estruturadas

     **Ações**:

     - Analisar estrutura real dos 3 XMLs DI (usar technical-researcher)

     - Criar extrator robusto de informacaoComplementar via regex

     - Extrair SISCOMEX, AFRMM, despesas de texto livre

     - Mapear TODOS os campos XML → estrutura banco

     **Validação 1.1**: XML parser extrai SISCOMEX R$ 154,23 da DI 2520345968

     **1.2 TRANSFORM - Transformação e Estruturação**

     **Responsável**: Database Optimizer + PHP Developer**Arquivos**: /api/services/xml-parser.php, /sql/ schemas

     **Problema**: Dados extraídos não seguem estrutura do banco

     **Ações**:

     - Converter formatos Siscomex (000000154230 → 154.23)

     - Estruturar objeto carga (peso_bruto, peso_liquido, via_transporte)

     - Estruturar despesas (siscomex, afrmm, capatazia)

     - Validar tipos de dados antes de inserir

     **Validação 1.2**: Dados transformados seguem exatamente schema do banco

     **1.3 LOAD - Carregamento Correto no Banco**

     **Responsável**: Database Admin + PHP Developer

     **Arquivos**: /api/endpoints/upload-xml.php, schemas do banco

     **Problema**: Dados não são persistidos corretamente

     **Ações**:

     - Corrigir inserção em tabelas relacionadas

     - Implementar transações atômicas (tudo ou nada)

     - Criar logs detalhados de carregamento

     - Validar integridade referencial

     **Validação ETAPA 1**: 

     - Banco contém TODOS os dados dos 3 XMLs DI

     - Despesas extraídas de informacaoComplementar persistidas

     - Dados de carga estruturados no banco

     - Zero perda de informação XML → Banco

     ---

     **🔗 ETAPA 2: CORREÇÃO APIS E CONECTIVIDADE**

     **PREREQUISITO**: ETAPA 1 validada com sucesso

     **OBJETIVO**: APIs devem retornar dados corretos do banco

     **2.1 Corrigir APIs ProductMemoryManager**

     **Responsável**: API Security Auditor + PHP Developer

     **Arquivos**: /api/endpoints/consultar-produtos-memoria.php, /api/endpoints/salvar-produtos-memoria.php

     **Problema**: APIs retornam 404

     **Ações**:

     - Verificar se endpoints existem fisicamente

     - Corrigir routing e permissões

     - Testar conectividade com banco

     - Implementar autenticação se necessária

     **Validação 2.1**: APIs retornam 200 OK com dados do banco

     **2.2 Corrigir API Consulta Produtos Croqui**

     **Responsável**: Database Admin + PHP Developer

     **Arquivos**: /api/endpoints/consultar-produtos-croqui.php

     **Problema**: ExportCroquiNF não consegue consultar produtos

     **Ações**:

     - Validar VIEW view_produtos_croqui_nf existe

     - Testar query com dados reais do banco  

     - Corrigir joins e estrutura de retorno

     - Otimizar performance de consultas

     **Validação ETAPA 2**:

     - Todas as APIs retornam dados corretos

     - ProductMemoryManager conecta com banco

     - Queries otimizadas e funcionais

     ---

     **💻 ETAPA 3: CORREÇÃO INTERFACE E APRESENTAÇÃO**

     **PREREQUISITO**: ETAPA 2 validada com sucesso**OBJETIVO**: Interface deve mostrar TODOS os dados corretamente

     **3.1 Corrigir DataLoader Mapeamento**

     **Responsável**: JavaScript Developer + UI/UX Designer

     **Arquivos**: /sistema-expertzy-local/di-processing/js/DataLoader.js

     **Problema**: Interface não mostra dados mesmo estando no banco

     **Ações**:

     - Mapear corretamente resposta API → estrutura interface

     - Criar objeto diData.carga esperado pelo sistema

     - Extrair despesas da API response para exibição

     - Sincronizar estruturas entre módulos

     **Validação 3.1**: Dados da API aparecem corretamente na interface

     **3.2 Corrigir Eventos Despesas Extras**

     **Responsável**: JavaScript Developer

     **Arquivos**: /sistema-expertzy-local/di-processing/js/di-interface.js**Problema**: Despesas extras não impactam base ICMS

     **Ações**:

     - Conectar eventos input → recálculo automático

     - Implementar updateExpensePreview() funcional

     - Sincronizar despesas extras com ComplianceCalculator

     - Atualizar interface em tempo real

     **Validação ETAPA 3**:

     - SISCOMEX R$ 154,23 aparece na interface

     - Despesas extras atualizam base ICMS em tempo real

     - Todos os campos da DI preenchidos corretamente

     ---

     **📊 ETAPA 4: CORREÇÃO EXPORTS (PDF/EXCEL)**

     **PREREQUISITO**: ETAPA 3 validada com sucesso

     **OBJETIVO**: Exports completos e corretos para QUALQUER DI

     **4.1 Corrigir ExcelExporter**

     **Responsável**: JavaScript Developer + Excel Specialist

     **Arquivos**: /sistema-expertzy-local/di-processing/js/ExcelExporter.js

     **Problema**: Erro this.diData.carga is undefined

     **Ações**:

     - Usar estrutura padronizada do DataLoader

     - Corrigir createCargoSheet() para dados reais

     - Implementar todas as abas esperadas

     - Validar estrutura antes de gerar

     **Validação 4.1**: Excel gerado sem erros para os 3 XMLs DI

     **4.2 Corrigir CroquiNF PDF**

     **Responsável**: PDF Specialist + JavaScript Developer**Arquivos**: /sistema-expertzy-local/shared/js/exportCroquiNF.js

     **Problema**: Produtos podem não estar visíveis no PDF

     **Ações**:

     - Usar dados processados ao invés de APIs que falham

     - Corrigir formatação tabela produtos

     - Implementar layout responsivo para diferentes quantidades

     - Otimizar geração de PDF

     **Validação ETAPA 4**:

     - PDF gerado com produtos claramente visíveis

     - Excel completo com todas as abas funcionais

     - Exports funcionam para QUALQUER XML DI brasileiro

     ---

     **📝 DOCUMENTAÇÃO E ACOMPANHAMENTO**

     **Arquivo de Progresso****:** **/docs/PLANO-EXECUCAO-ETAPAS.md**

     **Conteúdo**:

     - Status de cada etapa e subetapa

     - Validações realizadas e resultados

     - Problemas encontrados e soluções

     - Log de commits relacionados

     - Testes executados

     **Regras do CLAUDE.md Aplicadas****:**

     - ❌ Nunca usar fallbacks (if (!component) { return; })

     - ✅ Sempre lançar exceções explícitas quando dados obrigatórios ausentes

     - ✅ Evitar duplicação de lógica entre módulos

     - ✅ Princípio fail-fast com mensagens claras

     **Uso de Subagents por Etapa****:**

     - **ETAPA 1**: PHP Developer, Technical Researcher, Database Admin

     - **ETAPA 2**: API Security Auditor, Database Optimizer

     - **ETAPA 3**: JavaScript Developer, UI/UX Designer  

     - **ETAPA 4**: Excel Specialist, PDF Specialist

     **Validação Final Global****:**

     Testar fluxo completo com os 3 XMLs DI:

     - ✅ 2300120746.xml (complexo, 16 adições)

     - ✅ 2518173187.xml (simples, 1 adição)

     - ✅ 2520345968.xml (médio, despesas em texto livre)

     **RESULTADO FINAL**: Sistema que processa QUALQUER XML DI brasileiro real com dados completos, interface funcional e exports perfeitos.