/**
 * dashboard-charts.js - Charts with Chart.js
 * 
 * Gráficos integrados com cores Expertzy
 * Visualizações dos dados IndexedDB
 */

class DashboardCharts {
    constructor(dashboardCore) {
        this.core = dashboardCore;
        this.charts = {};
        this.chartColors = {
            primary: '#FF002D',      // expertzy-red
            secondary: '#091A30',    // expertzy-navy
            success: '#28a745',
            info: '#17a2b8',
            warning: '#ffc107',
            light: '#f8f9fa',
            gradients: {
                red: ['#FF002D', '#ff3d5c'],
                navy: ['#091A30', '#1a2d4a'],
                multi: ['#FF002D', '#091A30', '#17a2b8', '#28a745', '#ffc107', '#6c757d']
            }
        };
    }
    
    /**
     * Renderizar todos os gráficos
     */
    async renderAllCharts() {
        try {
            console.log('📈 Carregando dados para gráficos...');
            
            const chartsData = await this.core.getChartsData();
            
            // Renderizar cada gráfico
            await Promise.all([
                this.renderNCMChart(chartsData.ncmStats),
                this.renderUFChart(chartsData.ufsStats),
                this.renderMonthlyChart(chartsData.monthlyStats),
                this.renderStatusChart(chartsData.processingStates)
            ]);
            
            console.log('✅ Todos os gráficos renderizados');
            
        } catch (error) {
            console.error('❌ Erro ao renderizar gráficos:', error);
        }
    }
    
    /**
     * Gráfico de NCMs mais importados (Bar Chart)
     */
    async renderNCMChart(ncmStats) {
        const canvas = document.getElementById('ncmChart');
        if (!canvas || ncmStats.length === 0) return;
        
        // Destruir gráfico existente
        if (this.charts.ncm) {
            this.charts.ncm.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        this.charts.ncm = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ncmStats.map(item => item.ncm),
                datasets: [{
                    label: 'Quantidade de Adições',
                    data: ncmStats.map(item => item.count),
                    backgroundColor: this.createGradient(ctx, this.chartColors.gradients.red),
                    borderColor: this.chartColors.primary,
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Top 10 NCMs Mais Importados',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: this.chartColors.secondary
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: this.chartColors.secondary,
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.chartColors.primary,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y} adição(ões)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: this.chartColors.secondary,
                            maxRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e9ecef',
                            borderDash: [2, 2]
                        },
                        ticks: {
                            color: this.chartColors.secondary,
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Gráfico de UFs dos importadores (Pie Chart)
     */
    async renderUFChart(ufsStats) {
        const canvas = document.getElementById('ufChart');
        if (!canvas || ufsStats.length === 0) return;
        
        // Destruir gráfico existente
        if (this.charts.uf) {
            this.charts.uf.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        this.charts.uf = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ufsStats.map(item => item.uf),
                datasets: [{
                    data: ufsStats.map(item => item.count),
                    backgroundColor: this.generateMultiColors(ufsStats.length),
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribuição por Estado (UF)',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: this.chartColors.secondary
                    },
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 12
                            },
                            color: this.chartColors.secondary
                        }
                    },
                    tooltip: {
                        backgroundColor: this.chartColors.secondary,
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.chartColors.primary,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed * 100) / total).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }
    
    /**
     * Gráfico de evolução mensal (Line Chart)
     */
    async renderMonthlyChart(monthlyStats) {
        const canvas = document.getElementById('monthlyChart');
        if (!canvas || monthlyStats.length === 0) return;
        
        // Destruir gráfico existente
        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        this.charts.monthly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyStats.map(item => {
                    const date = new Date(item.month + '-01');
                    return date.toLocaleDateString('pt-BR', { 
                        month: 'short', 
                        year: 'numeric' 
                    });
                }),
                datasets: [{
                    label: 'DIs Processadas',
                    data: monthlyStats.map(item => item.count),
                    borderColor: this.chartColors.primary,
                    backgroundColor: this.createGradient(ctx, this.chartColors.gradients.red, true),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.chartColors.primary,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Evolução Mensal de DIs',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: this.chartColors.secondary
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: this.chartColors.secondary,
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.chartColors.primary,
                        borderWidth: 1,
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: this.chartColors.secondary
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e9ecef',
                            borderDash: [2, 2]
                        },
                        ticks: {
                            color: this.chartColors.secondary,
                            stepSize: 1
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
    
    /**
     * Gráfico de status de processamento (Polar Area)
     */
    async renderStatusChart(processingStates) {
        const canvas = document.getElementById('statusChart');
        if (!canvas || processingStates.length === 0) return;
        
        // Destruir gráfico existente
        if (this.charts.status) {
            this.charts.status.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        this.charts.status = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: processingStates.map(item => item.display),
                datasets: [{
                    data: processingStates.map(item => item.count),
                    backgroundColor: this.generateStatusColors(processingStates),
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Status de Processamento',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: this.chartColors.secondary
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 12
                            },
                            color: this.chartColors.secondary
                        }
                    },
                    tooltip: {
                        backgroundColor: this.chartColors.secondary,
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.chartColors.primary,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed * 100) / total).toFixed(1);
                                return `${context.label}: ${context.parsed} DIs (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        grid: {
                            color: '#e9ecef'
                        },
                        ticks: {
                            color: this.chartColors.secondary,
                            stepSize: 1,
                            backdropColor: 'transparent'
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Renderizar mini-gráfico de estatísticas rápidas
     */
    renderQuickStatsChart(containerId, data, type = 'line') {
        const canvas = document.getElementById(containerId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        new Chart(ctx, {
            type: type,
            data: {
                labels: data.labels || [],
                datasets: [{
                    data: data.values || [],
                    borderColor: this.chartColors.primary,
                    backgroundColor: 'rgba(255, 0, 45, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        display: false,
                        beginAtZero: true
                    }
                },
                elements: {
                    line: {
                        borderWidth: 2
                    }
                }
            }
        });
    }
    
    /**
     * Criar gradiente
     */
    createGradient(ctx, colors, isArea = false) {
        const gradient = ctx.createLinearGradient(0, 0, 0, isArea ? 300 : 400);
        gradient.addColorStop(0, colors[0] + (isArea ? '80' : ''));
        gradient.addColorStop(1, colors[1] + (isArea ? '20' : ''));
        return gradient;
    }
    
    /**
     * Gerar cores múltiplas para gráficos
     */
    generateMultiColors(count) {
        const baseColors = this.chartColors.gradients.multi;
        const colors = [];
        
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length] + '90');
        }
        
        return colors;
    }
    
    /**
     * Gerar cores específicas para status
     */
    generateStatusColors(processingStates) {
        return processingStates.map(item => {
            switch (item.state) {
                case 'DI_COMPLETE_FROM_XML':
                    return this.chartColors.success + '90';
                case 'ICMS_CALCULATED':
                    return this.chartColors.info + '90';
                case 'FINAL_COMPLETE':
                    return this.chartColors.primary + '90';
                default:
                    return this.chartColors.warning + '90';
            }
        });
    }
    
    /**
     * Destruir todos os gráficos
     */
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
    
    /**
     * Atualizar gráficos
     */
    async updateCharts() {
        await this.renderAllCharts();
    }
    
    /**
     * Redimensionar gráficos (útil para mudanças de layout)
     */
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }
}

// Configuração global do Chart.js
if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'gadeg thin', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    Chart.defaults.color = '#091A30';
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.displayColors = true;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.interaction.intersect = false;
    Chart.defaults.animation.duration = 750;
    Chart.defaults.animation.easing = 'easeOutQuart';
}

// Exportar para uso global
// ES6 Module Export
export { DashboardCharts };

// Exportar para uso global (backward compatibility)
if (typeof window !== 'undefined') {
    window.DashboardCharts = DashboardCharts;
}