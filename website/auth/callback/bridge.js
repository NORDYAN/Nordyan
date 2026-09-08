const NATIVE_CALLBACK = 'nordyan://auth/callback';
const FORWARDED_PARAMS = ['code', 'sb_flow_id'];

function firstParam(searchParams, key) {
  const value = searchParams.get(key);
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveEmailVerificationBridgeView(searchParams) {
  if (
    firstParam(searchParams, 'error') ||
    firstParam(searchParams, 'error_code') ||
    firstParam(searchParams, 'error_description')
  ) {
    return { kind: 'error' };
  }

  const code = firstParam(searchParams, 'code');
  if (!code) {
    return { kind: 'error' };
  }

  return {
    kind: 'ready',
    code,
    sbFlowId: firstParam(searchParams, 'sb_flow_id'),
  };
}

export function buildNativeEmailVerificationCallbackUrl(view) {
  if (view.kind !== 'ready') {
    return null;
  }

  const params = new URLSearchParams();
  params.set('code', view.code);
  if (view.sbFlowId) {
    params.set('sb_flow_id', view.sbFlowId);
  }

  const forwarded = [...params.keys()];
  if (forwarded.some((key) => !FORWARDED_PARAMS.includes(key))) {
    return null;
  }

  return `${NATIVE_CALLBACK}?${params.toString()}`;
}

export function bindEmailVerificationBridge(doc, search, openUrl) {
  const title = doc.getElementById('bridge-title');
  const body = doc.getElementById('bridge-body');
  const help = doc.getElementById('bridge-help');
  const button = doc.getElementById('open-nordyan');
  if (!title || !body || !help || !button) {
    return { kind: 'error' };
  }

  const view = resolveEmailVerificationBridgeView(new URLSearchParams(search));
  help.textContent = 'Öppna länken på samma enhet där du skapade ditt NORDYAN-konto.';

  if (view.kind !== 'ready') {
    title.textContent = 'Länken kunde inte användas';
    body.textContent =
      'Verifieringslänken är ogiltig eller har gått ut. Begär ett nytt verifieringsmail i NORDYAN.';
    button.hidden = true;
    button.disabled = true;
    return view;
  }

  title.textContent = 'Bekräfta din e-postadress';
  body.textContent =
    'Din e-postadress är bekräftad. Öppna NORDYAN för att slutföra registreringen.';
  button.hidden = false;
  button.disabled = false;
  button.addEventListener('click', (event) => {
    event.preventDefault();
    const nativeUrl = buildNativeEmailVerificationCallbackUrl(view);
    if (nativeUrl) {
      openUrl(nativeUrl);
    }
  });

  return view;
}

export { NATIVE_CALLBACK, FORWARDED_PARAMS };
