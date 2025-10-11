'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';

interface CaptchaData {
  captcha_id: string;
  image: string;
}

interface CaptchaProps {
  onCaptchaChange: (captchaId: string, captchaText: string) => void;
  error?: string;
}

export function Captcha({ onCaptchaChange, error }: CaptchaProps) {
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const [captchaText, setCaptchaText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchCaptcha = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      console.log('Fetching captcha...');
      const response = await fetch(`/api/captcha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch captcha: ${response.status}`);
      }

      const data = await response.json();
      console.log('Captcha data received:', data);
      
      if (!data.captcha || !data.captcha.captcha_id || !data.captcha.image) {
        throw new Error('Invalid captcha data received');
      }
      
      setCaptchaData(data.captcha);
      setCaptchaText(''); // Clear previous input
      onCaptchaChange(data.captcha.captcha_id, ''); // Reset captcha callback
    } catch (error) {
      console.error('Captcha fetch error:', error);
      setErrorMessage(`Failed to load captcha: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleCaptchaTextChange = (value: string) => {
    setCaptchaText(value);
    if (captchaData) {
      onCaptchaChange(captchaData.captcha_id, value);
    }
  };

  const handleRefresh = () => {
    fetchCaptcha();
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="captcha" className="text-sm font-medium text-foreground">
        Captcha Verification *
      </Label>
      
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          {captchaData ? (
            <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
              <img 
                src={`data:image/png;base64,${captchaData.image}`}
                alt="Captcha"
                className="w-full h-12 object-contain"
                onError={(e) => {
                  console.error('Image load error:', e);
                  setErrorMessage('Failed to load captcha image');
                }}
                onLoad={() => {
                  console.log('Captcha image loaded successfully');
                  setErrorMessage('');
                }}
              />
            </div>
          ) : (
            <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 h-12 flex items-center justify-center">
              {loading ? 'Loading captcha...' : 'No captcha available'}
            </div>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="h-12 px-3"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Input
        id="captcha"
        type="text"
        placeholder="Enter captcha text"
        value={captchaText}
        onChange={(e) => handleCaptchaTextChange(e.target.value)}
        required
        className="h-12 border-input rounded-lg focus:ring-2 focus:ring-ring"
      />

      {(errorMessage || error) && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {errorMessage || error}
        </p>
      )}
    </div>
  );
}
