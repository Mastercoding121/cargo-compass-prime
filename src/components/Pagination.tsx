/* PAGINATION: URL-based reusable pagination component */
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  className = "",
}: PaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers: (number | "ellipsis")[] = [];

    if (totalPages <= 5) {
      // Show all pages if 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show first page, current page, last page, and ellipses
      if (currentPage > 2) pageNumbers.push(1);
      if (currentPage > 3) pageNumbers.push("ellipsis");

      // Show 2 pages before current, current, and 2 after
      for (
        let i = Math.max(1, currentPage - 2);
        i <= Math.min(totalPages, currentPage + 2);
        i++
      ) {
        pageNumbers.push(i);
      }

      if (currentPage < totalPages - 2) pageNumbers.push("ellipsis");
      if (currentPage < totalPages - 1) pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          to="/"
          search={(prev) => ({ ...prev, page: currentPage - 1 })}
          className="flex items-center gap-1 px-3 py-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Prev</span>
        </Link>
      ) : (
        <button
          disabled
          className="flex items-center gap-1 px-3 py-2 rounded-md border border-slate-200 text-slate-300 cursor-not-allowed text-sm"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>
      )}

      {/* Page Numbers */}
      {pageNumbers.map((page, index) => (
        <div key={index}>
          {page === "ellipsis" ? (
            <span className="px-2 py-2 text-slate-400 text-sm">...</span>
          ) : (
            <Link
              to="/"
              search={(prev) => ({ ...prev, page })}
              className={`min-w-9 px-3 py-2 rounded-md text-sm font-medium transition ${
                page === currentPage
                  ? "bg-[#ff5000] text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {page}
            </Link>
          )}
        </div>
      ))}

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          to="/"
          search={(prev) => ({ ...prev, page: currentPage + 1 })}
          className="flex items-center gap-1 px-3 py-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <button
          disabled
          className="flex items-center gap-1 px-3 py-2 rounded-md border border-slate-200 text-slate-300 cursor-not-allowed text-sm"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  );
}
