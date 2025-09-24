import pandas as pd

# Criar tabela comparativa entre DI e DUIMP
data = {
    'Aspecto': [
        'Definição',
        'Forma e Processamento',
        'Licenciamento',
        'Compartilhamento de Dados',
        'Catálogo de Produtos',
        'Pagamento de Tributos',
        'Momento de Registro',
        'Documentos Substituídos',
        'Sistema Utilizado',
        'Integração com Órgãos',
        'Flexibilidade de Atualização',
        'Transparência',
        'Recolhimento de Impostos (OEA Nível 2)'
    ],
    'DI (Declaração de Importação)': [
        'Documento principal do despacho aduaneiro focado em aspectos fiscais e aduaneiros',
        'Processada no SISCOMEX com etapas separadas para diferentes órgãos',
        'Licença de Importação (LI) emitida antes do registro da DI em processo separado',
        'Menos eficiente, com necessidade de inserir dados em sistemas distintos',
        'Não havia sistema centralizado para cadastro de produtos',
        'Realizado em etapas específicas do processo',
        'Após a chegada da carga no armazém/zona primária',
        'N/A - documento original',
        'SISCOMEX LI/DI',
        'Sequencial, com necessidade de aprovações por etapas',
        'Limitada - informações precisam ser inseridas de uma só vez',
        'Menor transparência entre órgãos',
        'Não aplicável'
    ],
    'DUIMP (Declaração Única de Importação)': [
        'Documento eletrônico que integra informações aduaneiras, administrativas, comerciais, financeiras, fiscais e logísticas',
        'Elaborada no Portal Único Siscomex com integração automática entre órgãos',
        'Integra licenciamento via módulo LPCO com análise paralela ao despacho',
        'Transparente e eficiente com compartilhamento automático entre órgãos',
        'Sistema centralizado - informações cadastradas uma vez e reutilizadas',
        'Centraliza recolhimento de tributos facilitando gestão financeira',
        'Pode ser registrada antes da chegada da carga',
        'Substitui DI, DSI e parte das LIs',
        'Portal Único Siscomex',
        'Paralelo e integrado com verificações coordenadas',
        'Alta - permite atualizações em momentos distintos',
        'Total transparência com acesso para todos os intervenientes',
        'Coleta mensal unificada para OEAs Nível 2'
    ]
}

df_comparacao = pd.DataFrame(data)

# Salvar como CSV
df_comparacao.to_csv('comparacao_di_duimp.csv', index=False, encoding='utf-8')

# Criar cronograma de implementação
cronograma_data = {
    'Fase': [
        'Fase 1',
        'Fase 2 - Etapa 1',
        'Fase 2 - Etapa 2', 
        'Fase 3 - Etapa 1',
        'Fase 3 - Etapa 2'
    ],
    'Período': [
        'Outubro - Dezembro 2024',
        'Janeiro - Março 2025',
        'Abril - Junho 2025',
        'Julho - Setembro 2025',
        'Outubro - Dezembro 2025'
    ],
    'Modal/Operação': [
        'Modal Marítimo',
        'Modal Aéreo',
        'Modal Aéreo (continuação)',
        'Modal Terrestre', 
        'Zona Franca de Manaus (ZFM)'
    ],
    'Características': [
        'Importações sem licenciamento nos regimes RECOF, REPETRO e Admissão Temporária',
        'Operações com controle administrativo, Drawback, recolhimento integral de tributos',
        'Expansão para órgãos anuentes - Etapa 2',
        'Importações via fronteiras terrestres',
        'Operações sob regime da Zona Franca de Manaus'
    ],
    'Status': [
        'IMPLEMENTADO',
        'IMPLEMENTADO',
        'EM ANDAMENTO',
        'EM ANDAMENTO', 
        'PREVISTO'
    ]
}

df_cronograma = pd.DataFrame(cronograma_data)

# Salvar cronograma como CSV
df_cronograma.to_csv('cronograma_duimp_2025.csv', index=False, encoding='utf-8')

print("Tabelas criadas e salvas com sucesso!")
print("\n=== TABELA COMPARATIVA DI x DUIMP ===")
print(df_comparacao.to_string(index=False))
print("\n=== CRONOGRAMA DE IMPLEMENTAÇÃO DUIMP 2025 ===")
print(df_cronograma.to_string(index=False))