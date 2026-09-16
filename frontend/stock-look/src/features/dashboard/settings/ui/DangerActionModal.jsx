/**
 * @file DangerActionModal.jsx
 * @purpose Professional, high-security confirmation modal for Praxis administrative actions.
 * Enforces explicit keyword verification and 6-digit Authenticator TOTP authentication.
 * Strictly 0 unicode emojis.
 */

import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

export default function DangerActionModal({
    isOpen,
    onClose,
    onConfirm,
    config,
    isLoading = false,
    errorMessage = ''
}) {
    const [confirmText, setConfirmText] = useState('');
    const [totp, setTotp] = useState('');
    const [selectedOption, setSelectedOption] = useState(
        config?.defaultOption || config?.options?.[0]?.id || ''
    );

    // Sync selected option when config changes
    React.useEffect(() => {
        if (config?.defaultOption || config?.options?.[0]?.id) {
            setSelectedOption(config.defaultOption || config.options[0].id);
        }
    }, [config?.id]);

    if (!isOpen || !config) return null;

    const {
        title,
        description,
        requiredConfirmText,
        actionButtonText,
        buttonVariant = 'red', // red | orange | amber
        options = []
    } = config;

    const isKeywordMatch = confirmText.trim() === requiredConfirmText;
    const isTotpValidLength = totp.length === 6;
    const canSubmit = isKeywordMatch && isTotpValidLength && !isLoading;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onConfirm({ totp, confirmText: confirmText.trim(), clearMode: selectedOption });
    };

    const handleClose = () => {
        if (isLoading) return;
        setConfirmText('');
        setTotp('');
        if (config?.defaultOption || config?.options?.[0]?.id) {
            setSelectedOption(config.defaultOption || config.options[0].id);
        }
        onClose();
    };

    // Professional theme styles
    const buttonStyles = {
        red: 'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-600/20',
        orange: 'bg-orange-600 hover:bg-orange-500 text-white shadow-sm shadow-orange-600/20',
        amber: 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm shadow-amber-600/20',
    }[buttonVariant] || 'bg-red-600 hover:bg-red-500 text-white';

    const noticeStyles = {
        red: 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400',
        orange: 'border-orange-500/20 bg-orange-500/5 text-orange-600 dark:text-orange-400',
        amber: 'border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400',
    }[buttonVariant] || 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400';

    const selectedOptionObj = options.find(o => o.id === selectedOption) || null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div 
                className={`w-full ${options.length > 0 ? 'max-w-md sm:max-w-lg' : 'max-w-md'} rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1017] p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-left`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
                            {title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Two-factor authentication required to proceed
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {/* Scope Options Selector (if configured) */}
                    {options && options.length > 0 && (
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                                Select Market Data Scope
                            </label>
                            <div className="space-y-2">
                                {options.map((opt) => {
                                    const isSelected = selectedOption === opt.id;
                                    return (
                                        <div
                                            key={opt.id}
                                            onClick={() => !isLoading && setSelectedOption(opt.id)}
                                            className={`cursor-pointer rounded-lg border p-3 transition-all ${
                                                isSelected
                                                    ? 'border-orange-500/60 bg-orange-500/10 dark:bg-orange-950/20 ring-1 ring-orange-500/30'
                                                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center transition-colors ${
                                                        isSelected ? 'border-orange-500 bg-orange-500' : 'border-slate-400 dark:border-slate-600'
                                                    }`}>
                                                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                                        {opt.label}
                                                    </span>
                                                </div>
                                                {opt.badge && (
                                                    <span className={`px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded border ${
                                                        isSelected
                                                            ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30'
                                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                                                    }`}>
                                                        {opt.badge}
                                                    </span>
                                                )}
                                            </div>
                                            {opt.description && (
                                                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-6">
                                                    {opt.description}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Concise Notice Banner */}
                    <div className={`p-3 rounded-lg border text-xs leading-relaxed ${noticeStyles}`}>
                        {selectedOptionObj?.notice || description}
                    </div>

                    {/* Error Banner */}
                    {errorMessage && (
                        <div className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Keyword Confirmation Input */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                            Type <span className="font-mono font-bold text-slate-900 dark:text-white select-all">{requiredConfirmText}</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={e => setConfirmText(e.target.value)}
                            placeholder={requiredConfirmText}
                            disabled={isLoading}
                            autoFocus
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/70 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition-all"
                        />
                    </div>

                    {/* Authenticator TOTP Input */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                            Authenticator Code
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={totp}
                            onChange={e => setTotp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            placeholder="000000"
                            disabled={isLoading}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/70 px-3 py-2 text-xs font-mono tracking-widest text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-slate-400 dark:focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400/20 transition-all text-center"
                        />
                    </div>

                    {/* Actions Footer */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${buttonStyles}`}
                        >
                            {isLoading && <Loader2 size={13} className="animate-spin" />}
                            <span>{actionButtonText}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
