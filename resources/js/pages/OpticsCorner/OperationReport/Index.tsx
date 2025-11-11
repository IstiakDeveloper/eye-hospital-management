import React from 'react';
import { Head } from '@inertiajs/react';

const OperationReportIndex: React.FC = () => {
    return (
        <div className="p-6">
            <Head title="Operation Report" />
            <h1 className="text-2xl font-bold mb-4">Operation Report</h1>
            {/* Add summary, filters, or navigation here */}
            <div className="bg-white rounded shadow p-4">
                <p className="text-gray-600">Select a report type or filter to view operation data.</p>
            </div>
        </div>
    );
};

export default OperationReportIndex;
