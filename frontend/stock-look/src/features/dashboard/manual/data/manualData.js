import { Activity, BookOpen, Clock, Globe, LineChart, Wallet, BookMarked, Target } from "lucide-react";

export const manualData = {
    dashboard: { title: "Master Dashboard", description: "", topics: [] },
    fundamental: { title: "Fundamental Engine", description: "", topics: [] },
    technical: { title: "Technical Engine", description: "", topics: [] },
    options: { title: "Options Engine", description: "", topics: [] },
    global: { title: "Global Macro Engine", description: "", topics: [] },
    events: { title: "Events Engine", description: "", topics: [] },
    wallet: { title: "Risk Management", description: "", topics: [] },
    journal: { title: "Trading Psychology", description: "", topics: [] }
};

export const MANUAL_CONTENT = manualData;

export const MANUAL_SECTIONS = [
    {
        id: "dashboard",
        icon: Activity,
        label: "Master Dashboard",
        overview: "",
        coreQuestion: ""
    },
    {
        id: "fundamental",
        icon: BookOpen,
        label: "Fundamental Engine",
        overview: "",
        coreQuestion: ""
    },
    {
        id: "technical",
        icon: LineChart,
        label: "Technical Engine",
        overview: "",
        coreQuestion: ""
    },
    {
        id: "options",
        icon: Target,
        label: "Options Engine",
        overview: "",
        coreQuestion: ""
    },
    {
        id: "global",
        icon: Globe,
        label: "Global Macro Engine",
        overview: "",
        coreQuestion: ""
    },
    {
        id: "events",
        icon: Clock,
        label: "Events Engine",
        overview: "",
        coreQuestion: ""
    },
    {
        id: "wallet",
        icon: Wallet,
        label: "Risk Management",
        overview: "",
        coreQuestion: ""
    },
    {
        id: "journal",
        icon: BookMarked,
        label: "Trading Psychology",
        overview: "",
        coreQuestion: ""
    }
];