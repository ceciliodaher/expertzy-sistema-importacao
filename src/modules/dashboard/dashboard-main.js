/**
 * dashboard-main.js - Dashboard Main Module (Vite Entry Point)
 * Orchesta todos os componentes do dashboard
 */

// Importar core components como ES6 modules
import { DashboardCore } from './dashboard-core.js';
import { DashboardComponents } from './dashboard-components.js'; 
import { DashboardCharts } from './dashboard-charts.js';

// Inicializar dashboard quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard Expertzy iniciado - Vite Mode');
    
    try {
        // Inicializar DashboardCore com async/await
        window.dashboardCore = await new DashboardCore().initialize();
        console.log('✅ DashboardCore inicializado');
    } catch (error) {
        console.error('❌ Erro ao inicializar DashboardCore:', error);
        return;
    }
    
    try {
        window.dashboardComponents = new DashboardComponents(window.dashboardCore);
        console.log('✅ DashboardComponents inicializado');
    } catch (error) {
        console.error('❌ Erro ao inicializar DashboardComponents:', error);
        return;
    }
    
    try {
        window.dashboardCharts = new DashboardCharts(window.dashboardCore);
        console.log('✅ DashboardCharts inicializado');
    } catch (error) {
        console.error('❌ Erro ao inicializar DashboardCharts:', error);
        return;
    }
});