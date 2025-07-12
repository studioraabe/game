// js/ui-integration.js - UI Integration Module

import uiManager from './ui-manager.js';

/**
 * Integrates the UI Manager with existing game systems
 * - Replaces legacy UI update functions
 * - Ensures backward compatibility
 * - Makes UI manager available globally
 */
export function integrateUISystem() {
    console.log('🎮 Integrating UI Manager with existing systems');
    
    // Initialize the UI manager
    uiManager.init();
    
    // Replace existing UI update functions with centralized ones
    window.updateUI = () => uiManager.update();
    window.updateEnhancedDisplays = () => uiManager.update();
    window.updateActiveBuffsDisplay = () => uiManager.updateBuffsDisplay();
    window.updateComboDisplay = () => uiManager.updateComboDisplay();
    window.updateHealthBar = () => uiManager.updateHealthBar();
    window.createDamageNumber = (x, y, damage, critical) => uiManager.createDamageNumber(x, y, damage, critical);
    window.showAchievementPopup = (achievement) => uiManager.showAchievementPopup(achievement);
    window.toggleStatsOverlay = () => uiManager.toggleStatsOverlay();
    
    // Hook into the game loop update function if it exists
    if (window.update) {
        const originalUpdate = window.update;
        window.update = function() {
            // Call the original update
            originalUpdate();
            
            // Update the UI
            uiManager.update();
        };
    }
    
    // Hook into screens
    integrateScreens();
    
    console.log('🎮 UI Integration complete');
}

/**
 * Integrate with screen management functions
 */
function integrateScreens() {
    // Hook into the hideAllScreens function
    if (window.hideAllScreens) {
        const originalHideAllScreens = window.hideAllScreens;
        window.hideAllScreens = function() {
            // Call the original function
            originalHideAllScreens();
            
            // Additional UI cleanup
            const criticalOverlay = document.getElementById('criticalHealthOverlay');
            if (criticalOverlay) {
                criticalOverlay.style.opacity = '0';
            }
        };
    }
    
    // Hook into screen transition functions
    const screenFunctions = ['startGame', 'restartGame', 'pauseGame', 'resumeGame', 'gameOver'];
    
    screenFunctions.forEach(funcName => {
        if (window[funcName]) {
            const originalFunc = window[funcName];
            window[funcName] = function(...args) {
                // Call the original function
                originalFunc(...args);
                
                // Update UI after screen change
                setTimeout(() => uiManager.update(), 100);
            };
        }
    });
}

/**
 * Update import styles to use consolidated CSS
 * This is a helper function called on initialization
 */
function updateStyles() {
    // Remove any old enhanced-ui.css references
    const oldStylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .filter(link => link.href.includes('enhanced-ui.css'));
    
    oldStylesheets.forEach(link => link.remove());
    
    // Make sure all consolidated CSS files are loaded
    const requiredStyles = [
        'main.css',
        'ui-components.css',
        'ui-overlays.css',
        'ui-effects.css',
        'ui-utilities.css'
    ];
    
    requiredStyles.forEach(style => {
        const exists = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .some(link => link.href.includes(style));
        
        if (!exists) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `styles/${style}`;
            document.head.appendChild(link);
            console.log(`📝 Added missing stylesheet: ${style}`);
        }
    });
}

// Auto-initialize when this script is loaded
if (document.readyState === 'complete') {
    setTimeout(() => {
        updateStyles();
        integrateUISystem();
    }, 1000);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            updateStyles();
            integrateUISystem();
        }, 1000);
    });
}

// Export functions for direct import
export { updateStyles, integrateScreens };
export default { integrateUISystem, updateStyles, integrateScreens };