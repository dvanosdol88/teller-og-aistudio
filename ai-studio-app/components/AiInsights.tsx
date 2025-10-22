import React, { useState } from 'react';
import { AccountsData } from '../types';
import { generateFinancialSummary, askAccountant } from '../services/geminiService';
import { marked } from 'marked';
import Spinner from './Spinner';

interface AiInsightsProps {
    accountsData: AccountsData;
    totalEquity: number;
}

const AiInsights: React.FC<AiInsightsProps> = ({ accountsData, totalEquity }) => {
    const [summary, setSummary] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    
    const [accountantAnswer, setAccountantAnswer] = useState('');
    const [isAccountantLoading, setIsAccountantLoading] = useState(false);
    const [question, setQuestion] = useState('');

    const handleGenerateSummary = async () => {
        setIsSummaryLoading(true);
        setSummary('');
        const financialData = { accounts: accountsData, totalEquity };
        const result = await generateFinancialSummary(financialData);
        setSummary(result);
        setIsSummaryLoading(false);
    };

    const handleAskAccountant = async () => {
        if (!question.trim()) return;
        setIsAccountantLoading(true);
        setAccountantAnswer('');
        const result = await askAccountant(question);
        setAccountantAnswer(result);
        setIsAccountantLoading(false);
    };

    const createMarkup = (markdownText: string) => {
        return { __html: marked(markdownText) };
    };

    return (
        <section id="ai-insights" className="mb-16">
            <h3 className="text-3xl font-bold text-center text-slate-800 mb-8">✨ AI Financial Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Financial Summary */}
                <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 flex flex-col">
                    <h4 className="text-xl font-semibold text-slate-800 mb-4">Generate Financial Summary</h4>
                    <p className="text-slate-600 mb-4">Get a quick, AI-powered analysis of your LLC's current financial health based on the dashboard data.</p>
                    <button 
                        onClick={handleGenerateSummary} 
                        disabled={isSummaryLoading}
                        className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {isSummaryLoading ? <Spinner /> : 'Generate Summary'}
                    </button>
                    {(isSummaryLoading || summary) && (
                        <div className="prose prose-sm max-w-none mt-4 text-slate-700 bg-slate-50 p-4 rounded-lg flex-grow">
                           {isSummaryLoading && <p>Generating analysis, please wait...</p>}
                           {summary && <div dangerouslySetInnerHTML={createMarkup(summary)} />}
                        </div>
                    )}
                </div>
                {/* Ask an AI Accountant */}
                <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 flex flex-col">
                    <h4 className="text-xl font-semibold text-slate-800 mb-4">Ask an AI Accountant</h4>
                    <p className="text-slate-600 mb-4">Have a question about real estate accounting? Ask here for a clear explanation.</p>
                    <textarea 
                        id="ai-accountant-question" 
                        className="w-full border border-slate-300 rounded-lg p-2 disabled:bg-slate-100" 
                        rows={3} 
                        placeholder="e.g., What is the difference between capital improvements and repairs?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        disabled={isAccountantLoading}
                    ></textarea>
                    <button 
                        onClick={handleAskAccountant} 
                        disabled={isAccountantLoading || !question.trim()}
                        className="w-full mt-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {isAccountantLoading ? <Spinner /> : 'Ask Question'}
                    </button>
                    {(isAccountantLoading || accountantAnswer) && (
                         <div className="prose prose-sm max-w-none mt-4 text-slate-700 bg-slate-50 p-4 rounded-lg flex-grow">
                           {isAccountantLoading && <p>Thinking...</p>}
                           {accountantAnswer && <div dangerouslySetInnerHTML={createMarkup(accountantAnswer)} />}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default AiInsights;