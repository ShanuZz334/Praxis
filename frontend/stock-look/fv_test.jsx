import React from "react";
import { toast } from "sonner";
function Test() {
    return (
        <div>
                    {/* Future Vision Settings */}
                    <div className="pt-6">
                        <div className="mb-4">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-medium">Future Vision</h3>
                            </div>
                        </div>
                        <div className="mb-5">
                            <div className="flex flex-wrap gap-2">
                                {[3, 5, 7].map(n => {
                                    const fvs = (() => { try { return JSON.parse(localStorage.getItem("x") || "{}"); } catch { return {}; } })();
                                    const isCurrent = (fvs.horizonBars ?? 7) === n;
                                    return (
                                        <button key={n}
                                            onClick={() => {
                                                const cur = (() => { try { return JSON.parse("{}"); } catch { return {}; } })();
                                                toast.success(`Set to ${n}`);
                                            }}
                                            className={`px-3 ${isCurrent ? "active" : "inactive"}`}
                                        >
                                            {n} bars
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
        </div>
    );
}
export default Test;
