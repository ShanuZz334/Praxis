
import fs from "fs";
const path = "c:/project/ALLBACKUP/Praxis/frontend/stock-look/src/features/dashboard/options/ui/OptionsPage.jsx";
let content = fs.readFileSync(path, "utf-8");
content = content.replace("import React, { useState, useEffect, useMemo, useCallback } from \"react\";", "import React, { useState, useEffect, useMemo, useCallback, useRef } from \"react\";");
fs.writeFileSync(path, content);

