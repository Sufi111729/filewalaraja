export default function CategoryChips({ categories, activeCategory, onSelect }) {
  return (
    <div className="category-chips-shell">
      <div className="category-chips-track" role="tablist" aria-label="Tool categories">
        {categories.map((chip) => {
          const isActive = chip.id === activeCategory;
          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(chip.id)}
              className={`category-chip ${isActive ? "category-chip-active" : ""}`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
