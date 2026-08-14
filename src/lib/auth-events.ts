let intentionalSignOut = false;

export function markIntentionalSignOut() {
  intentionalSignOut = true;
}

export function consumeIntentionalSignOut(): boolean {
  const value = intentionalSignOut;
  intentionalSignOut = false;
  return value;
}
