
import { useState } from 'react'
import HexagonPattern from '../components/Hexagon'
import Logo from "../assets/pcred_logo.webp"

function Login() {
    const [phoneNo, setPhoneNo] = useState('')
    const [otp, setOtp] = useState('')
    const [showOtp, setShowOtp] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const sendOtp = (e) => {
        e.preventDefault();
        if (!/^[0-9]{10}$/.test(phoneNo)) {
            setErrorMsg("Please enter a valid 10-digit phone number.");
            return;
        }
        setErrorMsg('')
        setShowOtp(true)
    }

    const verifyOtp = (e) => {
        e.preventDefault();

        if (!/^[0-9]{6}$/.test(otp)) {
            setErrorMsg("Please enter a valid 6-digit OTP.");
            return;
        }

        setErrorMsg("");
    }

    const handleSubmit = (e) => {
        if (showOtp) {
            verifyOtp(e);
        } else {
            sendOtp(e);
        }
    };

    return (
        <>
            <section className="relative isolate overflow-hidden h-screen bg-slate-50 p-12">
                <HexagonPattern
                    className="text-[#003DD9]"
                    radius={35}
                    gap={4}
                />
                <div className="relative h-full flex items-center justify-center px-4 py-12">

                    <div className="w-full max-w-md">
                        {/* Login Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/50 sm:p-10">
                            {/* Header */}
                            <div className="mb-8 text-center">
                                <div className="flex items-center justify-center">
                                    <img src={Logo} alt="Logo" className='h-10' />
                                </div>
                                <h1 className="sr-only">Sign in</h1>
                            </div>
                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="phone_no"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Phone Number
                                    </label>

                                    <input name="phone_no" id="phone_no" value={phoneNo} onChange={(e) => setPhoneNo(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Enter your phone number" inputMode="numeric" pattern="[0-9]{10}" title="Enter a valid 10-digit phone number" className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00245A] focus:ring-4 focus:ring-[#00245A]/10 disabled:cursor-default disabled:bg-slate-100" disabled={showOtp} />
                                    
                                </div>

                                {showOtp &&
                                    <>
                                        <div>
                                            <div className="mb-2 flex items-center justify-between">
                                                <label htmlFor="otp" className="block text-sm font-medium text-slate-700">OTP</label>
                                            </div>

                                            <input name="otp" id="otp" value={otp} inputMode="numeric" pattern="[0-6]{6}" onChange={(e) => setOtp(e.target.value)} placeholder="Enter your OTP" className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00245A] focus:ring-4 focus:ring-[#00245A]/10 " required />
                                        </div>
                                    </>
                                }

                                {errorMsg && (
                                    <p role="alert" className="text-xs text-red-600">
                                        {errorMsg}
                                    </p>
                                )}

                                <button type='submit' className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#00B2FC] via-[#004FDE] to-[#00245A] px-4 py-3 text-sm font-semibold text-white shadow-md transition duration-200 hover:bg-[#003578] focus:outline-none focus:ring-4 focus:ring-[#00245A]/20 active:scale-[0.99] disabled:bg-[#5e80ae] cursor-pointer">{showOtp ? 'Verify OTP' : 'Send OTP'}</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Login
