import { Zap } from 'lucide-react';

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-blue-100/30 rounded-full -mr-80 -mt-80 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/25 rounded-full -ml-60 -mb-60 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 py-10">
                {/* Brand */}
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-2xl font-black text-gray-900 tracking-tight">
                        Lead<span className="text-blue-600">Spark</span>
                    </span>
                </div>

                {children}

                {/* Footer */}
                <p className="mt-10 text-[11px] text-gray-400 font-medium">
                    © 2026 LeadSpark Co., Ltd. All rights reserved.
                </p>
            </div>
        </div>
    );
}
