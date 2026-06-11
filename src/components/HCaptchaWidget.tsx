import React, { forwardRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface Props {
  onVerify: (token: string) => void;
  onExpire: () => void;
}

const SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY as string | undefined;

/**
 * Renders the hCaptcha widget only when VITE_HCAPTCHA_SITE_KEY is configured.
 * In dev (key absent) the widget is hidden so auth works without CAPTCHA setup.
 */
const HCaptchaWidget = forwardRef<HCaptcha, Props>(({ onVerify, onExpire }, ref) => {
  if (!SITE_KEY) return null;
  return (
    <div className="flex justify-center">
      <HCaptcha
        ref={ref}
        sitekey={SITE_KEY}
        onVerify={onVerify}
        onExpire={onExpire}
        theme="light"
      />
    </div>
  );
});

HCaptchaWidget.displayName = 'HCaptchaWidget';
export default HCaptchaWidget;
