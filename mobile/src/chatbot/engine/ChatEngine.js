import { useState, useCallback, useRef } from 'react';
import { FlowManager } from './FlowManager';

export function useChatEngine(flows, initialFlowId, t) {
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const flowManagerRef = useRef(new FlowManager(flows));

  const startFlow = useCallback((flowId) => {
    const manager = flowManagerRef.current;
    const firstStep = manager.loadFlow(flowId);
    setMessages([
      {
        id: 'welcome',
        role: 'bot',
        type: 'text',
        content: t(manager.currentFlow.titleKey, { defaultValue: 'Guided Advisor' })
      },
      {
        id: firstStep.id,
        role: 'bot',
        type: 'question',
        questionKey: firstStep.questionKey,
        step: firstStep
      }
    ]);
    setCurrentStep(firstStep);
    setIsComplete(false);
    setIsTyping(false);
  }, [t]);

  const selectOption = useCallback(async (option) => {
    if (!currentStep) return;
    
    const manager = flowManagerRef.current;
    const selectedStepId = currentStep.id;

    // 1. Add user message bubble
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${selectedStepId}`,
        role: 'user',
        type: 'text',
        content: t(option.labelKey, { defaultValue: option.value })
      }
    ]);

    // 2. Submit answer
    const { nextStep, isComplete: flowFinished } = manager.submitAnswer(selectedStepId, option.value);

    // 3. Clear options on the active question
    setCurrentStep(null);
    setIsTyping(true);

    // 4. Simulated typing delay for natural feel
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsTyping(false);

    if (flowFinished) {
      setIsComplete(true);
    } else if (nextStep) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextStep.id,
          role: 'bot',
          type: 'question',
          questionKey: nextStep.questionKey,
          step: nextStep
        }
      ]);
      setCurrentStep(nextStep);
    }
  }, [currentStep, t]);

  const getAnswers = useCallback(() => {
    return flowManagerRef.current.getAnswers();
  }, []);

  const getProgress = useCallback(() => {
    if (!currentStep) return isComplete ? 1 : 0;
    return flowManagerRef.current.getProgress(currentStep.id);
  }, [currentStep, isComplete]);

  return {
    messages,
    currentStep,
    isTyping,
    isComplete,
    startFlow,
    selectOption,
    getAnswers,
    getProgress
  };
}
