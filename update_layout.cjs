const fs = require('fs');
const file = 'resources/js/layouts/admin-layout.tsx';
let content = fs.readFileSync(file, 'utf8');

// Section Titles
content = content.replace(/text-xs font-semibold tracking-wider text-gray-400 uppercase/g, 'text-[11px] font-bold tracking-widest text-slate-400 uppercase');
content = content.replace(/px-3 sm:px-4/g, 'px-4 sm:px-5');

// Base typography & padding changes for items
content = content.replace(/text-sm font-medium/g, 'text-[13px] font-medium');
content = content.replace(/rounded-lg px-3 py-2\.5/g, 'rounded-md mx-2 px-3 py-2 mb-[2px]');
content = content.replace(/rounded-lg py-2 pr-3 pl-11/g, 'rounded-md mx-2 py-1.5 pr-3 pl-10 mb-[2px]');

// Icon sizing
content = content.replace(/h-5 w-5 flex-shrink-0/g, 'h-[18px] w-[18px] flex-shrink-0');
content = content.replace(/h-4 w-4 flex-shrink-0/g, 'h-[16px] w-[16px] flex-shrink-0');

// Hover states (Inactive)
content = content.replace(/text-gray-700 hover:bg-gray-100 hover:text-gray-900/g, 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors');
content = content.replace(/text-gray-600 hover:bg-gray-50 hover:text-gray-900/g, 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors');
content = content.replace(/text-gray-400 group-hover:text-gray-500/g, 'text-slate-400 group-hover:text-slate-500 transition-colors');

// Active styles replacement for the various colored sections
const colorMap = {
    'blue': 'blue',
    'indigo': 'indigo',
    'teal': 'teal',
    'purple': 'purple',
    'orange': 'orange',
    'emerald': 'emerald'
};

for (const [key, color] of Object.entries(colorMap)) {
    // Parent active
    const parentRegex = new RegExp(`border-r-2 border-${color}-700 bg-${color}-50 text-${color}-700`, 'g');
    content = content.replace(parentRegex, `bg-${color}-50 text-${color}-700 font-semibold shadow-sm ring-1 ring-inset ring-${color}-600/20 relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-full before:bg-${color}-600`);
    
    // Child active
    const childRegex = new RegExp(`border-r-2 border-${color}-600 bg-${color}-100 text-${color}-800`, 'g');
    content = content.replace(childRegex, `bg-${color}-50 text-${color}-700 font-semibold relative before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] before:rounded-r-full before:bg-${color}-500`);
}

// Logo Header
content = content.replace(/bg-gradient-to-r from-blue-600 to-indigo-600/g, 'bg-white border-b border-slate-100');
// Instead of replacing all text-white (which breaks role badges), let's specifically replace the logo text
content = content.replace(/<span className="ml-3 text-xl font-bold text-white">/g, '<span className="ml-3 text-xl font-extrabold tracking-tight text-slate-800">');
// Revert logo header button icon
content = content.replace(/rounded-lg p-2 text-white transition-colors hover:bg-white\/15/g, 'rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100');
content = content.replace(/border-b border-white\/10 bg-gradient-to-r/g, 'border-b border-slate-200 bg-white');

// User profile section
content = content.replace(/bg-gray-50\/90/g, 'bg-white');
content = content.replace(/border-b border-gray-200 bg-gray-50\/90/g, 'border-b border-slate-100 bg-white');
content = content.replace(/text-gray-900/g, 'text-slate-900');

// General sidebar layout
content = content.replace(/border-r border-gray-200\/80 bg-white shadow-xl/g, 'border-r border-slate-200/70 bg-white shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]');

fs.writeFileSync(file, content);
console.log('Admin layout updated successfully');
