import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime

# Data from the provided JSON
data = {
    "fases": [
        {"nome": "Fase 1", "periodo": "Out-Dez 2024", "modal": "Modal Marítimo", "status": "Implementado", "inicio": "2024-10-01", "fim": "2024-12-31"},
        {"nome": "Fase 2A", "periodo": "Jan-Mar 2025", "modal": "Modal Aéreo", "status": "Implementado", "inicio": "2025-01-01", "fim": "2025-03-31"},
        {"nome": "Fase 2B", "periodo": "Abr-Jun 2025", "modal": "Modal Aéreo (cont.)", "status": "Em Andamento", "inicio": "2025-04-01", "fim": "2025-06-30"},
        {"nome": "Fase 3A", "periodo": "Jul-Set 2025", "modal": "Modal Terrestre", "status": "Em Andamento", "inicio": "2025-07-01", "fim": "2025-09-30"},
        {"nome": "Fase 3B", "periodo": "Out-Dez 2025", "modal": "Zona Franca Manaus", "status": "Previsto", "inicio": "2025-10-01", "fim": "2025-12-31"}
    ]
}

# Convert to DataFrame
df = pd.DataFrame(data["fases"])

# Convert date strings to datetime
df['inicio'] = pd.to_datetime(df['inicio'])
df['fim'] = pd.to_datetime(df['fim'])

# Create color mapping for status
status_colors = {
    'Implementado': '#2E8B57',  # Sea green
    'Em Andamento': '#1FB8CD',  # Strong cyan
    'Previsto': '#D2BA4C'      # Moderate yellow
}

df['color'] = df['status'].map(status_colors)

# Create the timeline chart
fig = go.Figure()

for i, row in df.iterrows():
    fig.add_trace(go.Scatter(
        x=[row['inicio'], row['fim']],
        y=[row['nome'], row['nome']],
        mode='lines+markers',
        line=dict(color=row['color'], width=8),
        marker=dict(color=row['color'], size=10),
        name=row['status'],
        legendgroup=row['status'],
        showlegend=row['status'] not in [trace.name for trace in fig.data],
        hovertemplate='<b>%{y}</b><br>' +
                     f'Modal: {row["modal"]}<br>' +
                     f'Status: {row["status"]}<br>' +
                     f'Período: {row["periodo"]}<br>' +
                     '<extra></extra>'
    ))

# Update layout
fig.update_layout(
    title='Timeline DUIMP Out 2024 - Dez 2025',
    xaxis_title='Data',
    yaxis_title='Fases',
    legend=dict(
        orientation='h',
        yanchor='bottom',
        y=1.05,
        xanchor='center',
        x=0.5
    ),
    xaxis=dict(
        type='date',
        tickformat='%b %Y'
    ),
    yaxis=dict(
        categoryorder='array',
        categoryarray=df['nome'].tolist()
    )
)

# Update x-axis range to show full timeline
fig.update_xaxes(range=['2024-09-15', '2026-01-15'])

# Save the chart
fig.write_image('timeline_duimp.png')
fig.write_image('timeline_duimp.svg', format='svg')