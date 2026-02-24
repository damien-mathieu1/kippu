interface PaginationProps {
  total: number;
  current: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ total, current, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-3 h-3 rounded-full border-2 border-black transition-colors ${
            i === current ? "bg-primary" : "bg-white"
          }`}
          aria-label={`Page ${i + 1}`}
        />
      ))}
    </div>
  );
}
