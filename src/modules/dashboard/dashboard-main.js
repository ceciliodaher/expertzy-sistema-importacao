/**
 * dashboard-main.js - Dashboard Main Module (Vite Entry Point)
 * Orchesta todos os componentes do dashboard
 */

// Importar core components
import './dashboard-core.js';
import './dashboard-components.js'; 
import './dashboard-charts.js';

// Inicializar dashboard quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard Expertzy iniciado - Vite Mode');
    
    // Verificar se as classes globais estão disponíveis
    if (typeof DashboardCore !== 'undefined') {
        window.dashboardCore = new DashboardCore();
        console.log('✅ DashboardCore inicializado');
    } else {
        console.error('❌ DashboardCore não encontrado');
    }
    
    if (typeof DashboardComponents !== 'undefined') {
        window.dashboardComponents = new DashboardComponents();
        console.log('✅ DashboardComponents inicializado');
    } else {
        console.error('❌ DashboardComponents não encontrado');
    }
    
    if (typeof DashboardCharts !== 'undefined') {
        window.dashboardCharts = new DashboardCharts();
        console.log('✅ DashboardCharts inicializado');
    } else {
        console.error('❌ DashboardCharts não encontrado');
    }
});