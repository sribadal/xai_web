export type MethodCopy = {
  title: string
  description: string
}

const COPY: MethodCopy = {
  title: "About this method",
  description:
    "Shows patients from the training data whose profiles are most similar to this patient. Comparing the shared and differing features — alongside the similar patients' observed outcomes — can help contextualise this patient's prediction.",
}

export function getMethodCopy(method: string): MethodCopy {
  void method
  return COPY
}