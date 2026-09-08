export function shouldPreventCheckEmailNativeBack(actionType: string): boolean {
  return actionType === 'GO_BACK' || actionType === 'POP';
}
