import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { CoachHomeView } from '@/components/coach';
import { useCoachHome, useCoachQuestion } from '@/lib/hooks/coach';

export default function CoachScreen() {
  const { state } = useCoachHome();
  const { askState, submitQuestion, resetAsk } = useCoachQuestion();
  const [askVisitKey, setAskVisitKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      return () => {
        resetAsk();
        setAskVisitKey((current) => current + 1);
      };
    }, [resetAsk]),
  );

  const handleSubmitQuestion = useCallback(
    (question: string) => {
      if (state.status !== 'ready' || !state.model.ask.canAsk) {
        return;
      }
      void submitQuestion(question);
    },
    [state, submitQuestion],
  );

  return (
    <CoachHomeView
      state={state}
      askState={askState}
      askVisitKey={askVisitKey}
      onSubmitQuestion={handleSubmitQuestion}
    />
  );
}
