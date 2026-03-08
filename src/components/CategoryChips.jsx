export default function CategoryChips({ categories, activeCategory, onSelect }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {categories.map((chip) => {
        const isActive = chip.id === activeCategory;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelect(chip.id)}
            className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-150 ${
              isActive
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : "border-slate-300 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
