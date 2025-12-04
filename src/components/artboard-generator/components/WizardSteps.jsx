import React from 'react';

/**
 * Compact wizard step indicator - horizontal inline layout
 * Following Adobe Spectrum patterns with better space efficiency
 */
const WizardSteps = ({ steps, currentStep, onStepClick, stepStatus = {} }) => {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  const getStepState = (step, index) => {
    if (stepStatus[step.id] === 'complete') return 'complete';
    if (stepStatus[step.id] === 'warning') return 'warning';
    if (step.id === currentStep) return 'active';
    if (index < currentIndex) return 'visited';
    return 'upcoming';
  };

  return (
    <div className="wizard-steps">
      {steps.map((step, index) => {
        const state = getStepState(step, index);
        const isClickable = state !== 'upcoming' || index === currentIndex + 1;
        const stepNumber = index + 1;

        return (
          <React.Fragment key={step.id}>
            <button
              className={`wizard-step wizard-step--${state}`}
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              title={step.description || step.label}
              type="button"
            >
              <span className="wizard-step-num">{state === 'complete' ? '✓' : stepNumber}</span>
              <span className="wizard-step-text">{step.label}</span>
            </button>
            
            {index < steps.length - 1 && (
              <span className={`wizard-sep ${index < currentIndex ? 'wizard-sep--done' : ''}`}>›</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default WizardSteps;
