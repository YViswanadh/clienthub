import React from 'react';

export default function PhaseTimeline({ phases = [] }) {
  if (!phases || phases.length === 0) return null;

  const totalPhases = phases.length;
  const completedPhasesCount = phases.filter((p) => p.done).length;
  
  // Calculate exact percentage for active progress line
  // If no phases are done, it's 0%. If all done, it's 100%. Otherwise, it scales to the last completed step.
  let progressPercentage = 0;
  if (completedPhasesCount === totalPhases) {
    progressPercentage = 100;
  } else if (completedPhasesCount > 0 && totalPhases > 1) {
    progressPercentage = (completedPhasesCount / (totalPhases - 1)) * 100;
  }

  // Find the index of the first not-done phase to set as current/active
  const activeIndex = phases.findIndex((p) => !p.done);

  return (
    <div className="relative pt-6 pb-6 select-none w-full font-body-md">
      {/* Background Track Line */}
      <div className="absolute top-10 left-0 w-full h-[1.5px] bg-outline-variant" />
      
      {/* Active Track Line */}
      <div 
        className="absolute top-10 left-0 h-[1.5px] bg-primary transition-all duration-500 ease-out" 
        style={{ width: `${progressPercentage}%` }}
      />

      {/* Nodes Container */}
      <div className="flex justify-between relative z-10 w-full">
        {phases.map((phase, idx) => {
          const isDone = phase.done;
          const isActive = idx === activeIndex;
          const isPending = !isDone && !isActive;

          return (
            <div key={phase.name || idx} className="flex flex-col items-center gap-3 w-1/5">
              {/* Step Circle Node */}
              {isDone ? (
                // Done State
                <div className="w-5 h-5 rounded-full bg-primary border border-primary flex items-center justify-center transition-all duration-300">
                  <span className="material-symbols-outlined text-[12px] font-bold text-on-primary">
                    check
                  </span>
                </div>
              ) : isActive ? (
                // Active State (Current)
                <div className="w-5 h-5 rounded-full bg-surface border-2 border-primary flex items-center justify-center transition-all duration-300 ring-4 ring-primary/10">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
              ) : (
                // Pending State
                <div className="w-5 h-5 rounded-full bg-surface border-2 border-outline-variant flex items-center justify-center transition-all duration-300" />
              )}

              {/* Title Label */}
              <span 
                className={`
                  font-label-sm text-label-sm text-center truncate max-w-full px-1 uppercase tracking-wider
                  ${isDone || isActive ? 'text-primary font-bold' : 'text-on-surface-variant'}
                `}
              >
                {phase.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
