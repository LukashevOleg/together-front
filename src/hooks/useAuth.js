import { useState } from 'react';
import { sendOtpRequest, verifyOtpRequest } from '../api/authApi';

export function useAuth() {
    const [step,        setStep]        = useState('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading,     setLoading]     = useState(false);
    const [error,       setError]       = useState(null);
    const [ttlMinutes,  setTtlMinutes]  = useState(5);

    const sendOtp = async (phone) => {
        setLoading(true);
        setError(null);
        try {
            const data = await sendOtpRequest(phone);
            setPhoneNumber(phone);
            setTtlMinutes(data.ttlMinutes || 5);
            setStep('otp');
        } catch (e) {
            setError(e.response?.data?.message || 'Не удалось отправить код');
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (otpCode) => {
        setLoading(true);
        setError(null);
        try {
            const data = await verifyOtpRequest(phoneNumber, otpCode);
            return { success: true, ...data };
        } catch (e) {
            setError(e.response?.data?.message || 'Неверный код. Попробуйте ещё раз.');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => { setStep('phone'); setError(null); };

    return { step, phoneNumber, loading, error, ttlMinutes, sendOtp, verifyOtp, goBack };
}