import { useState } from 'react';
import { authApi } from '../api/authApi';

export function useAuth() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [step, setStep] = useState('phone'); // 'phone' | 'otp'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [ttlMinutes, setTtlMinutes] = useState(5);

    const sendOtp = async (phone) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await authApi.sendOtp(phone);
            setPhoneNumber(phone);
            setTtlMinutes(data.ttlMinutes);
            setStep('otp');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (otpCode) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await authApi.verifyOtp(phoneNumber, otpCode);

            return { success: true, isNewUser: data.isNewUser, user: data.user };
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP code.');
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        setStep('phone');
        setError('');
    };

    return {
        step,
        phoneNumber,
        loading,
        error,
        ttlMinutes,
        sendOtp,
        verifyOtp,
        goBack,
    };
}