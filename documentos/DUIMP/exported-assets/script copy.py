# Criar tabela comparativa sobre XML/estrutura de dados
import pandas as pd

data_xml_comparison = {
    'Aspecto': [
        'Formato de Dados',
        'Estrutura de Organização',
        'Disponibilidade Oficial',
        'Método de Obtenção',
        'Campos de Tributos',
        'Informações de Itens',
        'Integração com NFe',
        'Status de Desenvolvimento',
        'Forma de Consulta',
        'Dados de Cálculos',
        'Extrato/Relatório',
        'Uso em Sistemas Externos'
    ],
    'DI (Declaração de Importação)': [
        'XML estruturado disponível oficialmente',
        'Organizada por adições (agrupamento de mercadorias)',
        'Sim - XML oficial disponível para download',
        'Download direto via SISCOMEX após registro',
        'Tributos calculados e apresentados por adição',
        'Dados básicos por item dentro de cada adição',
        'Importação direta via XML para emissão de NFe',
        'Sistema maduro e consolidado',
        'Interface tradicional SISCOMEX',
        'Memória de cálculo básica incluída',
        'Extrato em PDF e XML disponíveis',
        'Amplamente integrado com ERPs via XML'
    ],
    'DUIMP (Declaração Única de Importação)': [
        'Formato JSON via API (sem XML oficial)',
        'Organizada por itens individuais (sem agrupamento)',
        'Não - apenas via API em formato JSON',
        'Consulta via API REST do Portal Único',
        'Tributos detalhados item por item com memória completa',
        'Dados completos e detalhados para cada item',
        'Requer desenvolvimento de integração via API',
        'Em implementação - sem XML consolidado',
        'Portal Único Siscomex via web/API',
        'Memória de cálculo completa com alíquotas e fundamentos',
        'Extrato PDF simplificado (sem dados tributários completos)',
        'Integração limitada - requer adaptação dos sistemas'
    ]
}

df_xml_comparison = pd.DataFrame(data_xml_comparison)

# Criar tabela sobre principais diferenças nos campos
campos_data = {
    'Campo/Informação': [
        'Número de Adições',
        'Limite de Itens',
        'Estrutura de Dados',
        'NCM por Item',
        'Peso Líquido/Bruto',
        'Valor por Item',
        'Fundamentos Legais',
        'Atributos do Produto',
        'Catálogo de Produtos',
        'Operador Estrangeiro',
        'Método de Valoração',
        'Cobertura Cambial',
        'Taxa Siscomex',
        'Controle de Versões',
        'Histórico de Alterações'
    ],
    'DI': [
        'Múltiplas adições possíveis',
        'Sem limite específico por adição',
        'Adição > Itens (hierárquica)',
        'Por adição (agrupamento)',
        'Por adição (agregado)',
        'Valor FOB por adição',
        'Por adição',
        'Não havia sistema estruturado',
        'Não aplicável',
        'Dados básicos do exportador',
        'Por operação/adição',
        'Por operação',
        'Calculada por número de adições',
        'Retificação via nova versão DI',
        'Histórico básico de alterações'
    ],
    'DUIMP': [
        'Conceito virtual apenas para taxa Siscomex',
        'Até 99.999 itens por declaração',
        'Item direto (não hierárquica)',
        'Por item individual obrigatoriamente',
        'Por item individual (rateio automático)',
        'Valor detalhado por item individual',
        'Por item com detalhamento completo',
        'Sistema estruturado via catálogo',
        'Obrigatório - item deve estar catalogado',
        'Cadastro completo via sistema',
        'Por item (mais granular)',
        'Por item quando aplicável',
        'Calculada por agrupamento virtual de itens',
        'Sistema de versões automático',
        'Rastreabilidade total de mudanças'
    ]
}

df_campos = pd.DataFrame(campos_data)

# Salvar como CSVs
df_xml_comparison.to_csv('comparacao_xml_di_duimp.csv', index=False, encoding='utf-8')
df_campos.to_csv('comparacao_campos_di_duimp.csv', index=False, encoding='utf-8')

print("=== COMPARAÇÃO XML/ESTRUTURA DE DADOS ===")
print(df_xml_comparison.to_string(index=False))
print("\n=== COMPARAÇÃO DE CAMPOS E ESTRUTURA ===")
print(df_campos.to_string(index=False))

print("\nArquivos CSV criados com sucesso!")