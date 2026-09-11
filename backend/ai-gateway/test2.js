const str = '{\"candles\": [{\"open\": 100, \"close\":'; console.log(str.replace(/,?\s*\"[^\"]+\"\s*:\s*$/, '').replace(/,\s*$/, ''));
