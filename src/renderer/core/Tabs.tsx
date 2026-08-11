import { useState, type ReactNode } from 'react';

interface TabDef {
  id: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ tabs }: { tabs: TabDef[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap gap-1 border-b border-neutral-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveId(tab.id)}
            className={
              tab.id === active?.id
                ? 'border-b-2 border-neutral-100 px-3 py-2 text-sm font-medium text-neutral-100'
                : 'border-b-2 border-transparent px-3 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-300'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active?.content}
    </div>
  );
}
