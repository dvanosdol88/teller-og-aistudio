
import React from 'react';

interface ErrorBannerProps {
    message: string;
    onDismiss: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => {
    return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-8" role="alert">
            <div className="flex items-center">
                <div className="py-1">
                    <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2h-2a1 1 0 0 1-1-1zm-1-4a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1z"/></svg>
                </div>
                <div className="flex-grow">
                    <p className="font-bold">Data Fetch Error</p>
                    <p>{message}</p>
                </div>
                <button 
                    onClick={onDismiss} 
                    className="ml-4 p-1 text-red-500 hover:text-red-700 hover:bg-red-200 rounded-full text-2xl leading-none"
                    aria-label="Dismiss"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

export default ErrorBanner;
