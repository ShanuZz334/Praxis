/**
 * @file useProfile.js
 * @purpose Bridges the user's selected Trading Profile (intraday / swing / positional)
 *          to the dashboard pages and AI prompt preset system.
 *
 * @exports
 *   useProfile()  -> { profile, setProfile, profileLabel, profileConfig, switchHeaderPresets }
 *
 * How it works:
 *   1. Reads `tradingMode` from ThemeContext (already persisted to localStorage).
 *   2. Exposes weight multipliers that scoring engines use to reweight section scores.
 *   3. When the profile changes, automatically calls the backend to switch the
 *      `activePresetId` of every page header prompt to the matching named preset
 *      (if one exists with that profile name).
 *
 * Profile -> Preset Name mapping:
 *   intraday   -> looks for a preset named "Intraday"   (case-insensitive)
 *   swing      -> looks for a preset named "Swing"
 *   positional -> looks for a preset named "Positional"
 */

import { useCallback, useEffect } from 'react';
import { useTheme } from '@/shared/context/ThemeContext';
import axiosInstance from '@/shared/utils/axiosInstance';

// -- Profile configuration ---------------------------------------------------

export const PROFILE_CONFIG = {
    intraday: {
        label: 'Intraday',
        description: 'Momentum & speed signals',
        color: 'orange',
        sectionMultipliers: {
            valuation:    0.5,
            growth:       0.6,
            quality:      0.5,
            technicals:   1.8,
            flow:         1.5,
            macro:        0.4,
        },
    },
    swing: {
        label: 'Swing',
        description: 'Balanced technicals & fundamentals',
        color: 'blue',
        sectionMultipliers: {
            valuation:    1.0,
            growth:       1.0,
            quality:      1.0,
            technicals:   1.2,
            flow:         1.2,
            macro:        0.8,
        },
    },
    positional: {
        label: 'Positional',
        description: 'Fundamentals & macro focus',
        color: 'emerald',
        sectionMultipliers: {
            valuation:    1.4,
            growth:       1.5,
            quality:      1.3,
            technicals:   0.6,
            flow:         0.8,
            macro:        1.3,
        },
    },
};

// All page header targetIds that support profile-specific prompt presets
const HEADER_TARGET_IDS = [
    'fundamentals_index_header',
    'fundamentals_company_header',
    'technical_index_header',
    'technical_company_header',
    'options_header',
    'foreign_header',
    'events_header',
    'events_macro',
    'events_earnings',
    'events_policy',
    'events_corporate',
    'events_geopolitical',
    'events_commodities',
    'praxis_composite_header',
];

// -- Hook --------------------------------------------------------------------

export function useProfile() {
    const { tradingMode, setTradingMode } = useTheme();

    const profile      = PROFILE_CONFIG[tradingMode] ? tradingMode : 'swing';
    const profileLabel = PROFILE_CONFIG[profile].label;
    const profileConfig = PROFILE_CONFIG[profile];

    /**
     * switchHeaderPresets -- for each page header targetId, fetch its saved
     * presets and activate the one matching the profile label (if found).
     * Silently no-ops if no matching preset exists.
     */
    const switchHeaderPresets = useCallback(async (targetProfile) => {
        const targetLabel = PROFILE_CONFIG[targetProfile]?.label;
        if (!targetLabel) return;

        await Promise.allSettled(
            HEADER_TARGET_IDS.map(async (targetId) => {
                try {
                    const res = await axiosInstance.get(`/api/v1/ai-prompts/${targetId}`);
                    const { presets = [], activePresetId } = res.data || {};
                    const match = presets.find(
                        (p) => p.name?.toLowerCase() === targetLabel.toLowerCase()
                    );
                    if (!match) return;
                    if (match.id === activePresetId) return;
                    await axiosInstance.put(`/api/v1/ai-prompts/${targetId}`, {
                        ...res.data,
                        activePresetId: match.id,
                    });
                } catch {
                    // Silent -- do not break UI if one header fails
                }
            })
        );
    }, []);

    /**
     * setProfile -- updates ThemeContext (persists to localStorage)
     * and auto-switches prompt presets for all headers.
     */
    const setProfile = useCallback((newProfile) => {
        if (!PROFILE_CONFIG[newProfile]) return;
        setTradingMode(newProfile);
        switchHeaderPresets(newProfile);
    }, [setTradingMode, switchHeaderPresets]);

    // On first mount, sync headers if a non-default profile is saved
    useEffect(() => {
        if (profile !== 'swing') {
            switchHeaderPresets(profile);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        profile,
        setProfile,
        profileLabel,
        profileConfig,
        allProfiles: PROFILE_CONFIG,
        switchHeaderPresets,
    };
}
