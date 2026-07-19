/* --------------------------------------------------------------------------
   FUNDAMENTAL DATA CONSTANTS
   Defines the core sections and configuration for the Fundamental Engine.
-------------------------------------------------------------------------- */

export const FUNDAMENTAL_SECTIONS = [
    { id: 'Valuation',      label: 'Valuation',         desc: 'Price vs Value metrics', weight: 0.18 },
    { id: 'Earnings',       label: 'Earnings',          desc: 'Earnings Growth',        weight: 0.20 },
    { id: 'Macro',          label: 'Macro',             desc: 'Economic Indicators',    weight: 0.05 },
    { id: 'Liquidity',      label: 'Liquidity',         desc: 'Flows & Market Depth',   weight: 0.07 },
    { id: 'Sector',         label: 'Sector',            desc: 'Group Performance',      weight: 0.13 },
    { id: 'Corporate',      label: 'Corporate',         desc: 'Balance Sheet Health',   weight: 0.17 },
    { id: 'Global',         label: 'Global',            desc: 'Systemic Stress',        weight: 0.10 },
    { id: 'Ownership',      label: 'Ownership & Flow',  desc: 'Shareholding Quality',   weight: 0.10 },
    { id: 'Risk',           label: 'Risk',              desc: 'Systemic Vulnerabilities', weight: 0.05 },
];

export const WEIGHTS = FUNDAMENTAL_SECTIONS.reduce((acc, curr) => {
    acc[curr.id] = curr.weight;
    return acc;
}, {});
