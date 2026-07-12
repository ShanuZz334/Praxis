 = Get-Content -Raw "C:\project\ALLBACKUP\Praxis\tech_indicators.txt"
 = @("EMA 20", "EMA 50", "EMA 200", "SMA 50", "SMA 200", "ADX", "Supertrend")
foreach ( in ) {
    Write-Host "--- Extracting  ---"
    # Find the section starting with the indicator name or number followed by indicator name
    if ( -match "(?s)(?<=\n\s*\d+\.\s*\r?\n).*?(?=\n\s*\d+\.\s*(?:Moving|Exponential|Average|Relative|Super|Stochastic|Commodity|Williams|On-Balance|Volume|Average|Bollinger|Keltner|India|Support|Resistance|Trendline|Fibonacci|Pivot|Advance|New|Breadth|ARMS|McClellan|Market|Technical)|$)") {
        # This regex might not be perfect. Let's just output matches of "Name: "
    }
}
