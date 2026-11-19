import React from 'react';
import { publicApiRequest } from '../../services/apiClient';

export const AppVersion: React.FC<{ className?: string; portal?: string }> = ({
  className = '',
  portal = 'manager',
}) => {
  const [runtimeVersion, setRuntimeVersion] = React.useState('');

  React.useEffect(() => {
    let active = true;
    void publicApiRequest<{ manager?: { version?: string } }>('/api/v1/config/app-version')
      .then((config) => { if (active) setRuntimeVersion(config.manager?.version?.trim() || ''); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const portalVersion =
    portal === 'manager'
      ? import.meta.env.VITE_MANAGER_APP_VERSION
      : portal === 'factory'
      ? import.meta.env.VITE_FACTORY_APP_VERSION
      : portal === 'sales'
      ? import.meta.env.VITE_SALES_APP_VERSION
      : '';

  const raw =
    runtimeVersion ||
    portalVersion ||
    import.meta.env.VITE_MANAGER_APP_VERSION ||
    import.meta.env.VITE_APP_VERSION ||
    import.meta.env.APP_VERSION ||
    '';

  const version = typeof raw === 'string' ? raw.trim().replace(/^[vV]/, '') : String(raw || '').trim().replace(/^[vV]/, '');

  return (
    <p className={`text-center text-[6px] font-semibold tracking-wide text-slate-400 ${className}`}>
      Reproutes{version ? ` V${version}` : ''}
    </p>
  );
};
