
import React from 'react';

const Principles: React.FC = () => {
    return (
        <section id="principles" className="mb-16">
            <h3 className="text-3xl font-bold text-center text-slate-800 mb-8">Foundational Principles</h3>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                    <h4 className="text-xl font-semibold text-slate-800 mb-3">The Golden Rule: Financial Separation</h4>
                    <p className="text-slate-600">The most critical concept is treating the LLC as a completely separate entity. This means a dedicated business bank account is non-negotiable. All income and expenses must flow through it.</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                    <h4 className="text-xl font-semibold text-slate-800 mb-3">Pass-Through Taxation Explained</h4>
                    <p className="text-slate-600">Your LLC itself doesn't pay income tax. Profits and losses are "passed through" to you and David, and you report them on your personal tax returns.</p>
                </div>
            </div>
        </section>
    );
};

export default Principles;
