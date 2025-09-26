/**
 * Arquivo de entrada principal para index.html
 * Sistema Expertzy - Landing Page
 * Migração para Vite
 */

// Importar estilos
import './shared/styles/expertzy-brand.css'
import './shared/styles/landing.css'

// Inicialização da aplicação
console.log('🚀 Sistema Expertzy - Vite Loaded')
console.log('📦 Versão:', __APP_VERSION__ || '1.0.0')

// Configurar navegação suave para links internos
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Landing page initialized')
    
    // Smooth scroll para links âncora
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault()
            const target = document.querySelector(this.getAttribute('href'))
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                })
            }
        })
    })

    // Adicionar classe active no navbar baseado no scroll
    const sections = document.querySelectorAll('section[id]')
    const navLinks = document.querySelectorAll('.navbar-nav a')
    
    window.addEventListener('scroll', () => {
        let current = ''
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop
            const sectionHeight = section.clientHeight
            if (scrollY >= (sectionTop - 100)) {
                current = section.getAttribute('id')
            }
        })
        
        navLinks.forEach(link => {
            link.classList.remove('active')
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active')
            }
        })
    })

    // Log de ambiente
    if (import.meta.env.DEV) {
        console.log('🔧 Modo de desenvolvimento ativado')
    }
})

// Exportar para uso global se necessário
export const APP_INFO = {
    name: 'Sistema Expertzy',
    module: 'Landing Page',
    version: __APP_VERSION__ || '1.0.0'
}