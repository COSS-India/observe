import { NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST() {
  try {
    // Call FastAPI backend to get captcha
    const backendResponse = await axios.post(`${BACKEND_URL}/v1/captcha`, {}, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const captchaData = backendResponse.data;

    return NextResponse.json(captchaData);
  } catch (error) {
    console.error('Captcha fetch error:', error);
    
    // Handle backend errors
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.detail || 'Failed to generate captcha';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
