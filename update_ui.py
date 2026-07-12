import os

filepath = r"C:\project\ALLBACKUP\Praxis\frontend\stock-look\src\features\dashboard\fundamentals\ui\FundamentalPage.jsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove saveComposite useEffect
import re
content = re.sub(
    r"// --- Store Composite & Sections for AI Analysis ---.*?React\.useEffect\(\(\) => \{.*?\}, \[compositeData\.compositeScore, selectedInstrument\]\);",
    "",
    content,
    flags=re.DOTALL
)

# 2. Insert handleClearAll
handle_clear_all = """
  const handleClearAll = () => {
      const resetState = getInitialOverrides(selectedInstrument) || {};
      
      const stored = localStorage.getItem('praxis_manual_overrides_v2');
      let allOverrides = {};
      if (stored) {
          try { allOverrides = JSON.parse(stored); } catch (e) {}
      }
      allOverrides[selectedInstrument] = resetState;
      localStorage.setItem('praxis_manual_overrides_v2', JSON.stringify(allOverrides));
      
      setManualOverrides(resetState);
      
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setManualLastUpdated(timeStr);
      
      const storedTime = localStorage.getItem('praxis_manual_last_updated_v2');
      let allTimes = {};
      if (storedTime) {
          try { allTimes = JSON.parse(storedTime); } catch(e) {}
      }
      allTimes[selectedInstrument] = timeStr;
      localStorage.setItem('praxis_manual_last_updated_v2', JSON.stringify(allTimes));
  };
"""
content = content.replace(
    "allTimes[selectedInstrument] = timeStr;\n      localStorage.setItem('praxis_manual_last_updated_v2', JSON.stringify(allTimes));\n  };\n",
    "allTimes[selectedInstrument] = timeStr;\n      localStorage.setItem('praxis_manual_last_updated_v2', JSON.stringify(allTimes));\n  };\n" + handle_clear_all
)

# 3. Add Clear All button
header_replace = """<div className="flex items-center justify-between gap-2 mb-4 border-b border-border-default pb-2 pr-8 md:pr-10">
              <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Manual Data Overrides</span>
                  <button 
                      onClick={handleClearAll}
                      className="px-2 py-0.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 rounded text-[10px] font-medium transition-colors border border-red-900/50"
                  >
                      Clear All
                  </button>
              </div>"""

content = content.replace(
    '<div className="flex items-center justify-between gap-2 mb-4 border-b border-border-default pb-2 pr-8 md:pr-10">\n              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Manual Data Overrides</span>',
    header_replace
)

# 4. Update labels
content = content.replace('label="Index P/E"', 'label="Index P/E (x)"')
content = content.replace('label="Index P/B"', 'label="Index P/B (x)"')
content = content.replace('label="Stock P/E"', 'label="Stock P/E (x)"')
content = content.replace('label="Forward P/E"', 'label="Forward P/E (x)"')
content = content.replace('label="Stock P/B"', 'label="Stock P/B (x)"')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Modifications applied successfully.")
