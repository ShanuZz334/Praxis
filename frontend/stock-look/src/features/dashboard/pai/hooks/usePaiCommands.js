import { useCallback } from 'react';

/**
 * usePaiCommands - Centralized parser and executor for PAI agentic commands.
 * 
 * Returns an `intercept(text, fromVoice)` function. 
 * If a command is matched and executed, it returns the confirmation `replyText`.
 * If no command is matched, it returns `null`.
 */
// Very simple string similarity for typo-tolerant instrument search
function getEditDistance(a, b) {
    if(a.length == 0) return b.length; 
    if(b.length == 0) return a.length; 
    var matrix = [];
    for(var i = 0; i <= b.length; i++){ matrix[i] = [i]; }
    for(var j = 0; j <= a.length; j++){ matrix[0][j] = j; }
    for(var i = 1; i <= b.length; i++){
        for(var j = 1; j <= a.length; j++){
            if(b.charAt(i-1) == a.charAt(j-1)){
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

export function usePaiCommands({
    // State setters
    setIsChatOpen,
    setIsDocked,
    setChatMode,
    setTempModel,
    setMessages,
    setMessage,
    // Contexts & Hooks
    availableModels,
    setProfile,
    themeContext,       // { theme, setTheme, toggleTheme }
    dashboardContext,   // { setSelectedInstrument, filteredInstruments }
    voiceContext,       // { toggleVoiceMode, skipTts }
    navigate            // react-router-dom useNavigate
}) {
    
    return useCallback((textToSubmit, fromVoice) => {
        if (!textToSubmit) return null;

        const lowerText = textToSubmit.toLowerCase().trim();
        const strippedText = lowerText.replace(/[.,!?]/g, "");
        
        // Define common action verbs (typo-tolerant)
        const actionVerbs = "(?:switch|swich|change|chage|chnage|set|use|choose|open|go|load|enable|disable|toggle)";

        // --------------------------------------------------------------------
        // Group 1: AI Level Selection
        // --------------------------------------------------------------------
        const levelMatch = strippedText.match(new RegExp(`(?:${actionVerbs}\\s*(?:to\\s*)?)?(?:level|lvl|intelligence|inteligence|intel)\\s*(\\d+)|(?:${actionVerbs}\\s*(?:to\\s*)?)?(\\d+)\\s*(?:as\\s*)?(?:level|lvl|intelligence|inteligence|intel)`, "i"));
        
        if (levelMatch && availableModels?.length > 0) {
            const targetLevel = parseInt(levelMatch[1] || levelMatch[2]);
            const modelToSelect = availableModels.find(m => m.level === targetLevel);
            
            if (modelToSelect) {
                if (setTempModel) setTempModel(modelToSelect.modelId);
                return `Upgrading cognitive engine to Level ${targetLevel} (${modelToSelect.displayName}).`;
            } else {
                const maxLevel = Math.max(...availableModels.map(m => m.level || 1));
                return `I do not have a Level ${targetLevel} model available. The maximum available intelligence level is ${maxLevel}.`;
            }
        }

        // --------------------------------------------------------------------
        // Group 2: Trading Horizon
        // --------------------------------------------------------------------
        const modeMatch = strippedText.match(new RegExp(`(?:${actionVerbs})?\\s*(?:the\\s*)?(?:trade\\s*mode|trading\\s*horizon|trading\\s*mode|mode|horizon|profile|proflie)\\s*(?:to\\s*)?(intraday|swing|positional)`, "i"));
        
        if (modeMatch && setProfile) {
            const targetMode = modeMatch[1].toLowerCase();
            setProfile(targetMode);
            return `Trading horizon changed to ${targetMode}. Presets synchronized.`;
        }

        // --------------------------------------------------------------------
        // Group 3: Theme & Visual Control
        // --------------------------------------------------------------------
        if (themeContext) {
            const themeMatch = strippedText.match(new RegExp(`(?:${actionVerbs})?\\s*(?:the\\s*)?(?:theme|thmeme|mode|moode)?\\s*(?:to\\s*)?(dark|light)\\s*(?:mode|moode|theme|thmeme)?`, "i"));
            
            if (themeMatch && themeMatch[1]) {
                const targetTheme = themeMatch[1].toLowerCase();
                
                // Only act if they explicitly typed a change command OR if the text is very short (e.g. "dark mode")
                if (strippedText.match(new RegExp(actionVerbs, "i")) || strippedText.length < 25) {
                    if (targetTheme === "dark") {
                        if (themeContext.theme === "dark") return "Dark mode is already active.";
                        themeContext.toggleTheme();
                        return "Switched to dark mode.";
                    } else if (targetTheme === "light") {
                        if (themeContext.theme === "light") return "Light mode is already active.";
                        themeContext.toggleTheme();
                        return "Switched to light mode.";
                    }
                }
            }
            if (strippedText.match(/toggle\s*theme/i)) {
                themeContext.toggleTheme();
                return "Theme toggled.";
            }
        }

        // --------------------------------------------------------------------
        // Group 4: Navigation
        // --------------------------------------------------------------------
        if (navigate) {
            const navMatch = strippedText.match(new RegExp(`(?:${actionVerbs}|show|nav|navigate)\\s*(?:to\\s*)?(?:the\\s*)?(fundamentals?|fund|technicals?|tech|options?|opt|events?|global|dashboard|home|settings?|ai\\s*settings?)`, "i"));
            
            if (navMatch && (strippedText.match(new RegExp(actionVerbs, "i")) || strippedText.match(/nav|show/i) || strippedText.length < 25)) {
                const dest = navMatch[1].toLowerCase();
                if (dest.includes('fundamental') || dest === 'fund') { navigate('/dashboard/fundamental'); return "Navigating to Fundamentals."; }
                if (dest.includes('technical') || dest === 'tech') { navigate('/dashboard/technical'); return "Navigating to Technicals."; }
                if (dest.includes('option') || dest === 'opt') { navigate('/dashboard/options'); return "Navigating to Options Flow."; }
                if (dest.includes('global')) { navigate('/dashboard/global'); return "Navigating to Global Markets."; }
                if (dest.includes('event')) { navigate('/dashboard/events'); return "Navigating to Market Events."; }
                if (dest.includes('home') || dest === 'dashboard') { navigate('/dashboard'); return "Navigating to Dashboard."; }
                if (dest.includes('setting')) { navigate('/dashboard/pai/settings'); return "Opening AI Settings."; }
            }
        }

        // --------------------------------------------------------------------
        // Group 5: Instrument Switching
        // --------------------------------------------------------------------
        if (dashboardContext?.setSelectedInstrument) {
            // Looking for short intent: "switch to reliance", "chart for bank nifty"
            const instMatch = strippedText.match(new RegExp(`(?:${actionVerbs}|chart\\s*for)\\s+(?:to\\s*)?(.+)`, "i"));
            
            // IF THERE IS NO EXPLICIT COMMAND, WE DO NOT SWITCH.
            if (instMatch && dashboardContext.filteredInstruments) {
                let query = instMatch[1].toLowerCase();
                // clean up potential trailing words
                query = query.replace(/(?:please|now|thanks)/gi, '').trim();
                
                // Fast path for common indices
                if (query === 'nifty' || query === 'nifty 50') {
                    dashboardContext.setSelectedCategory("Indices");
                    dashboardContext.setSelectedInstrument("NSE_INDEX|Nifty 50");
                    return "Switched instrument to Nifty 50.";
                }
                if (query === 'bank nifty' || query === 'banknifty' || query === 'nifty bank') {
                    dashboardContext.setSelectedCategory("Indices");
                    dashboardContext.setSelectedInstrument("NSE_INDEX|Nifty Bank");
                    return "Switched instrument to Bank Nifty.";
                }

                // Fuzzy search in all instruments
                const found = dashboardContext.filteredInstruments.find(inst => {
                    const labelStr = inst.label.toLowerCase();
                    const valStr = inst.value.toLowerCase();
                    const cleanQuery = query.replace(/\s/g, "");
                    const cleanLabel = labelStr.replace(/\s/g, "");
                    
                    // 1. Exact match always allowed
                    if (labelStr === query || cleanLabel === cleanQuery) return true;
                    if (valStr.endsWith(`|${cleanQuery}`)) return true;

                    // 2. If it was an explicit command ("switch to X"), allow substring and fuzzy match
                    if (instMatch) {
                        if (labelStr.includes(query) || valStr.includes(query) || cleanLabel.includes(cleanQuery)) return true;
                        if (query.length >= 4) {
                            const firstWord = labelStr.split(" ")[0];
                            if (getEditDistance(query, firstWord) <= 2) return true;
                            if (getEditDistance(query, labelStr.substring(0, query.length)) <= 2) return true;
                        }
                    }
                    return false;
                });

                if (found && (instMatch || strippedText.length < 20)) {
                    // Prevent normal conversational words from accidentally switching instruments if there was no explicit command
                    const ignoreWords = ['hi', 'hello', 'hey', 'ok', 'yes', 'no', 'thanks', 'bye', 'help', 'what', 'who', 'how', 'why', 'can', 'you'];
                    if (!instMatch && ignoreWords.includes(query)) return null;

                    dashboardContext.setSelectedInstrument(found.value);
                    return `Switched instrument to ${found.label}.`;
                }
            }
        }

        // --------------------------------------------------------------------
        // Group 6: Chat Mode Control
        // --------------------------------------------------------------------
        if (setChatMode) {
            const chatModeMatch = strippedText.match(new RegExp(`(?:${actionVerbs})?\\s*(?:to\\s*)?(global|contextual|page)\\s*(?:mode|moode)?`, "i"));
            
            if (chatModeMatch && (strippedText.match(new RegExp(actionVerbs, "i")) || strippedText.length < 25)) {
                const target = chatModeMatch[1].toLowerCase();
                if (target === 'global') {
                    setChatMode('global');
                    return "Global Mode activated. I now have cross-dashboard context.";
                } else if (target === 'contextual' || target === 'page') {
                    setChatMode('contextual');
                    return "Contextual Mode activated. I am now focused on the current page.";
                }
            }
        }

        // --------------------------------------------------------------------
        // Group 7: Session Control
        // --------------------------------------------------------------------
        if (strippedText.match(/(?:clear|reset|delete|remove|clean)\s*(?:chat|conversation|history|memory)/i)) {
            if (setMessages) setMessages([]);
            return "Chat history cleared.";
        }
        
        if (strippedText.match(/(?:reset|clear|remove|clean)\s*(?:model|intelligence|intel)/i) || 
            strippedText.match(/(?:use|set|switch|swich|change|chage|chnage)\s*(?:to\s*)?(?:default)\s*(?:model|intelligence|intel)?/i)) {
            if (setTempModel) setTempModel(null);
            return "Cognitive engine reset to Default.";
        }

        // --------------------------------------------------------------------
        // Group 8: Voice Control
        // --------------------------------------------------------------------
        if (voiceContext) {
            if (strippedText.match(/(?:mute|stop|shut|quiet)\s*(?:voice|speaking|talking)?/i) || strippedText.includes("shut up")) {
                if (voiceContext.skipTts) voiceContext.skipTts();
                return "Voice output muted.";
            }
            if (strippedText.match(/(?:toggle|enable|start|unmute|disable)\s*(?:voice|speaking|talking)/i)) {
                if (voiceContext.toggleVoiceMode) voiceContext.toggleVoiceMode();
                return "Voice mode toggled.";
            }
        }

        // --------------------------------------------------------------------
        // Group 9: UI Control
        // --------------------------------------------------------------------
        if (setIsChatOpen && setIsDocked) {
            if (strippedText.match(/(?:close|hide)\s*(?:the\s*)?(?:chat|window|panel)/i)) {
                setIsChatOpen(false);
                return "UI_CONTROL_NO_REPLY"; 
            }
            
            if (strippedText.match(/(?:open|show)\s*(?:the\s*)?(?:chat|window|panel)/i)) {
                setIsChatOpen(true);
                return "UI_CONTROL_NO_REPLY";
            }

            if (strippedText.match(/(?:dock|go\s*away)/i)) {
                setIsDocked(true);
                return "UI_CONTROL_NO_REPLY";
            }
        }

        // No command matched
        return null;
        
    }, [
        setIsChatOpen, setIsDocked, setChatMode, setTempModel, 
        setMessages, setMessage, availableModels, setProfile, 
        themeContext, dashboardContext, voiceContext, navigate
    ]);
}
