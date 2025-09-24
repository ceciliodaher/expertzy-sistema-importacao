/**
 * PathResolver.js - Utilitário para resolver caminhos de recursos dinamicamente
 * Garante compatibilidade entre ambiente local e produção
 */

class PathResolver {
    constructor() {
        // Detecta o ambiente baseado na URL
        this.basePath = this.detectBasePath();
        this.isProduction = this.detectEnvironment();
        console.log(`[PathResolver] Inicializado - Base Path: ${this.basePath}, Produção: ${this.isProduction}`);
    }

    /**
     * Detecta o ambiente (local vs produção)
     * @returns {boolean} True se estiver em produção
     */
    detectEnvironment() {
        if (typeof window === 'undefined') {
            return false; // Node.js environment
        }
        
        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.');
        return !isLocal;
    }

    /**
     * Detecta o base path correto baseado no ambiente
     * @returns {string} Base path para recursos
     */
    detectBasePath() {
        if (typeof window === 'undefined') {
            return ''; // Node.js environment
        }

        const pathname = window.location.pathname;
        
        // Se estiver em um subdiretório (ex: /sistema-importacao/), usa como base
        if (pathname.includes('/sistema-importacao/')) {
            return '/sistema-importacao';
        } else if (pathname.includes('/')) {
            // Pega o diretório base da aplicação
            const parts = pathname.split('/');
            // Remove o arquivo HTML do path
            if (parts[parts.length - 1].includes('.html')) {
                parts.pop();
            }
            // Se ainda houver partes, usa como base
            if (parts.length > 1 && parts[1] !== '') {
                return `/${parts[1]}`;
            }
        }
        
        return '';
    }

    /**
     * Resolve um caminho de recurso para o ambiente correto
     * @param {string} resourcePath - Caminho do recurso (ex: 'src/shared/data/aliquotas.json')
     * @returns {string} Caminho completo resolvido
     */
    resolve(resourcePath) {
        // Remove barras iniciais e ./ do caminho
        let cleanPath = resourcePath.replace(/^\.\//, '').replace(/^\//, '');
        
        // Se já for uma URL completa, retorna como está
        if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
            return cleanPath;
        }

        // Constrói o caminho completo
        if (this.basePath) {
            return `${this.basePath}/${cleanPath}`;
        }
        
        // Para desenvolvimento local, usa caminho relativo
        return `./${cleanPath}`;
    }

    /**
     * Resolve caminho para arquivos de dados JSON
     * @param {string} filename - Nome do arquivo JSON (ex: 'aliquotas.json')
     * @returns {string} Caminho completo para o arquivo JSON
     */
    resolveDataPath(filename) {
        return this.resolve(`src/shared/data/${filename}`);
    }

    /**
     * Resolve caminho para imagens
     * @param {string} imagePath - Caminho da imagem (ex: 'expertzy-it.png')
     * @returns {string} Caminho completo para a imagem
     */
    resolveImagePath(imagePath) {
        // Remove 'images/' se já estiver no path
        const cleanImagePath = imagePath.replace(/^images\//, '');
        return this.resolve(`images/${cleanImagePath}`);
    }

    /**
     * Resolve caminho para módulos
     * @param {string} modulePath - Caminho do módulo
     * @returns {string} Caminho completo para o módulo
     */
    resolveModulePath(modulePath) {
        return this.resolve(modulePath);
    }
}

// Cria instância única (Singleton)
const pathResolver = new PathResolver();

// Exporta a instância única
export default pathResolver;

// Exporta também a classe para testes
export { PathResolver };