import React from 'react';
import { Head } from '@inertiajs/react';

const OperationReportDaily: React.FC = () => {
    return (
        <div className="p-6">
            <Head title="Operation Daily Statement" />
            <h1 className="text-2xl font-bold mb-4">Operation Daily Statement</h1>
            {/* Add date picker, summary, or table here */}
            <div className="bg-white rounded shadow p-4">
                <p className="text-gray-600">No daily operation data available. Please select a date.</p>
            </div>
        </div>
    );
};

export default OperationReportDaily;
