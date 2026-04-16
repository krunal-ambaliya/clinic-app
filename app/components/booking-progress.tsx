"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BookingProgressProps = {
  steps: string[];
  currentStep: number;
  stepLinks?: Array<string | undefined>;
  enableStepNavigation?: boolean;
  className?: string;
};

function clampStep(step: number, max: number) {
  return Math.min(Math.max(step, 1), max);
}

export function BookingProgress({
  steps,
  currentStep,
  stepLinks,
  enableStepNavigation = false,
  className,
}: BookingProgressProps) {
  const [animatedStep, setAnimatedStep] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedStep(clampStep(currentStep, steps.length));
    }, 120);

    return () => clearTimeout(timeout);
  }, [currentStep, steps.length]);

  const progressPercentage = useMemo(() => {
    if (steps.length <= 1) {
      return 100;
    }
    return ((animatedStep - 1) / (steps.length - 1)) * 100;
  }, [animatedStep, steps.length]);

  return (
    <div
      className={`rounded-[2rem] border border-[#cfd7d3] bg-[#f3f5f4] p-4 shadow-sm ${className ?? ""}`}
    >
      <div className="relative">
        <div className="absolute left-0 right-0 top-3 h-[2px] bg-[#c8cfcc]" />
        <div
          className="absolute left-0 top-3 h-[2px] bg-[#00695c] transition-all duration-700 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />

        <div className="relative grid grid-cols-4 gap-2">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isComplete = stepNumber <= animatedStep;
            const href = stepLinks?.[index];
            const canNavigate =
              enableStepNavigation && Boolean(href) && stepNumber <= currentStep;
            const content = (
              <>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold transition-colors ${
                    isComplete
                      ? "border-[#00695c] bg-[#00695c] text-white"
                      : "border-[#95a4a0] bg-white text-[#52625f]"
                  }`}
                >
                  {stepNumber}
                </span>
                <span
                  className={`text-xs font-semibold transition-colors ${
                    isComplete ? "text-[#0f312c]" : "text-[#5c6b67]"
                  }`}
                >
                  {step}
                </span>
              </>
            );

            if (canNavigate) {
              return (
                <Link
                  key={step}
                  href={href!}
                  className="group flex flex-col items-center gap-2 text-center"
                  aria-label={`Go to step ${stepNumber}: ${step}`}
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={step}
                className="group flex flex-col items-center gap-2 text-center"
                aria-label={`Step ${stepNumber}: ${step}`}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}