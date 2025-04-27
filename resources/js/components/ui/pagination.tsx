import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  className?: string;
}

export function Pagination({ links, className }: PaginationProps) {
  // Don't render pagination if there's only 1 page
  if (links.length <= 3) return null;

  return (
    <div className={cn("flex justify-center mt-6", className)}>
      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
        {links.map((link, i) => {
          // Skip "Next" and "Previous" if there are no more pages
          if ((link.label === '&laquo; Previous' && !link.url) ||
              (link.label === 'Next &raquo;' && !link.url)) {
            return null;
          }

          // Replace HTML entities with actual icons
          const label = link.label === '&laquo; Previous' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : link.label === 'Next &raquo;' ? (
            <ChevronRight className="h-4 w-4" />
          ) : link.label === '....' ? (
            <MoreHorizontal className="h-4 w-4" />
          ) : (
            link.label
          );

          // Style the active link differently
          const activeClasses = link.active
            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50';

          // Style ellipsis and disabled links
          if (link.label === '....' || !link.url) {
            return (
              <span
                key={i}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
              >
                {label}
              </span>
            );
          }

          // Style "Previous" and "Next" buttons
          const isPrevNext = link.label === '&laquo; Previous' || link.label === 'Next &raquo;';
          const prevNextClasses = isPrevNext
            ? 'relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50'
            : `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${activeClasses}`;

          return (
            <Link
              key={i}
              href={link.url || '#'}
              className={prevNextClasses}
              preserveScroll
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default Pagination;
