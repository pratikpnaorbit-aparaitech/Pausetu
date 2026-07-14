export class FlowManager {
  constructor(flows = {}) {
    this.flows = flows;
    this.currentFlow = null;
    this.answers = {};
  }

  loadFlow(flowId) {
    if (!this.flows[flowId]) {
      throw new Error(`Flow with ID ${flowId} not found`);
    }
    this.currentFlow = this.flows[flowId];
    this.answers = {};
    return this.getStep(this.currentFlow.startStep);
  }

  getStep(stepId) {
    if (!this.currentFlow || !stepId) return null;
    const step = this.currentFlow.steps[stepId];
    if (!step) return null;

    // Resolve dynamic options based on prior answers
    let resolvedOptions = [];
    if (typeof step.options === 'function') {
      resolvedOptions = step.options(this.answers);
    } else if (Array.isArray(step.options)) {
      resolvedOptions = step.options;
    }

    return {
      ...step,
      options: resolvedOptions
    };
  }

  submitAnswer(stepId, value) {
    this.answers[stepId] = value;
    const step = this.currentFlow.steps[stepId];
    if (!step) return { nextStep: null, isComplete: true };

    let nextStepId = null;
    if (typeof step.nextStep === 'function') {
      nextStepId = step.nextStep(this.answers);
    } else {
      nextStepId = step.nextStep;
    }

    return {
      nextStep: this.getStep(nextStepId),
      isComplete: nextStepId === null
    };
  }

  getAnswers() {
    return this.answers;
  }

  getProgress(currentStepId) {
    if (!this.currentFlow) return 0;
    const stepIds = Object.keys(this.currentFlow.steps);
    const currentIndex = stepIds.indexOf(currentStepId);
    if (currentIndex === -1) return 1;
    return (currentIndex + 1) / stepIds.length;
  }
}
