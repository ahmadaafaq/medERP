'use client';

import React from 'react';

export interface StepItem {
  id: number;
  label: string;
  sublabel: string;
}

interface WizardStepperProps {
  currentStep: number;
  steps: StepItem[];
  onStepClick: (stepId: number) => void;
  maxAccessibleStep: number;
}

export default function WizardStepper({
  currentStep,
  steps,
  onStepClick,
  maxAccessibleStep,
}: WizardStepperProps) {
  return (
    <div className="w-full bg-white rounded-[22px] border border-[#E7EAF3] shadow-sm p-5 mb-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 overflow-x-auto pb-2 md:pb-0">
        {steps.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = step.id <= maxAccessibleStep;

          return (
            <React.Fragment key={step.id}>
              <div
                onClick={() => isClickable && onStepClick(step.id)}
                className={`flex items-center gap-3 cursor-pointer group transition-all shrink-0 ${
                  !isClickable ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                    isCompleted
                      ? 'bg-[#00C48C] text-white ring-4 ring-[#00C48C]/20'
                      : isCurrent
                      ? 'bg-[#5B4BFF] text-white ring-4 ring-[#5B4BFF]/20 shadow-indigo-500/30'
                      : 'bg-[#F6F8FC] text-[#4E5969] border border-[#E7EAF3] group-hover:border-[#5B4BFF]'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>

                <div className="text-left">
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isCurrent ? 'text-[#5B4BFF]' : isCompleted ? 'text-[#00C48C]' : 'text-[#4E5969]'
                    }`}
                  >
                    Step {step.id}
                  </p>
                  <p className="text-sm font-bold text-[#1B1E28] whitespace-nowrap">{step.label}</p>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden lg:block flex-1 h-[2px] mx-2 bg-[#E7EAF3] relative">
                  <div
                    className="h-full bg-[#00C48C] transition-all duration-300"
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
