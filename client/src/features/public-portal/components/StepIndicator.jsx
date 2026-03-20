import styles from './StepIndicator.module.css';

const StepIndicator = ({ currentStep, steps }) => {
  return (
    <div className={styles.container}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div key={stepNumber} className={`${styles.step} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}>
            <div className={styles.circle}>
              {isCompleted ? '✓' : stepNumber}
            </div>
            <span className={styles.label}>{step}</span>
            {index < steps.length - 1 && <div className={styles.line} />}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
