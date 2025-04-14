import { useContext, useEffect, useState } from 'react'
import { Button, CircularProgress, Divider, TextField } from '@mui/material'
import AccountSidebar from '../../components/AccountSidebar'
import { MyContext } from '../../App'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { editData, fetchDataFromApi } from '../../utils/api'
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa'
import { postData } from './../../utils/api';
import { Collapse } from 'react-collapse'
import { MuiPhone } from '../../components/MuiPhone'
import 'react-international-phone/style.css';


const MyAccount = () => {

    const context = useContext(MyContext);
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [isLoading2, setIsLoading2] = useState(false);
    const [isChangePasswordFormShow, setIsChangePasswordFormShow] = useState(false);
    const [isShowPassword1, setIsShowPassword1] = useState(false);
    const [isShowPassword2, setIsShowPassword2] = useState(false);
    const [isShowPassword3, setIsShowPassword3] = useState(false);
    const [userId, setUserId] = useState("");
    const [setAddress] = useState([]);
    const [phone, setPhone] = useState('')
    const [formFields, setFormFields] = useState({
        name: '',
        email: '',
        mobile: '',
    })
    const [changePassword, setChangePassword] = useState({
        email: '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setFormFields((formFields) => ({
            ...formFields,
            [name]: value,
        }));
        setChangePassword((formFields) => ({
            ...formFields,
            [name]: value,
        }));
    };

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token !== undefined && token !== null && token !== '') {
            context?.setIsLogin(true);
        } else {
            navigate("/");
        }
    }, [context, navigate]);

    useEffect(() => {
        // Only run the effect when user data is available
        if (context?.userData?._id) {

            // Fetch addresses when the component mounts or userData changes
            fetchDataFromApi(`/api/address/get-address?userId=${context?.userData?._id}`).then((res) => {
                setAddress(res.data); // Store the fetched addresses in state
                context?.setAddress(res.data); // Store the fetched addresses in context
            });

            // Set user data in state
            setUserId(context?.userData?._id);
            setFormFields({
                name: context?.userData?.name,
                email: context?.userData?.email,
            });

            setChangePassword({
                email: context?.userData?.email,
            });

            const validPhone = context?.userData?.mobile ? String(context?.userData?.mobile) : "";
            setPhone(validPhone);
            // setPhone(`${context?.userData?.mobile}`);  // Set initial phone value from user data
        }
    }, [context?.userData]);  // Only re-run when context?.userData changes


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formFields.name === "") {
            context.openAlertBox("error", "Please enter your full name.");
            return;
        }

        if (formFields.email === "") {
            context.openAlertBox("error", "Please enter your email ID.");
            return;
        }

        if (formFields.mobile === "") {
            context.openAlertBox("error", "Please enter your mobile number.");
            return;
        }

        // Start a toast.promise for handling loading, success, and error states
        try {
            const result = await toast.promise(
                editData(`/api/user/${userId}`, formFields, { withCredentials: true }), {
                loading: "Updating profile... Please wait.",
                success: (res) => {
                    if (res?.success) {
                        navigate("/"); // Redirect to the home page
                        return res.message || "Profile updated successfully!";
                    } else {
                        throw new Error(res?.message || "An unexpected error occurred.");
                    }
                },
                error: (err) => {
                    // Check if err.response exists, else fallback to err.message
                    const errorMessage = err?.response?.data?.message || err.message || "Failed to update profile. Please try again.";
                    return errorMessage;
                },
            }
            );
            console.log("Result:", result);
        } catch (err) {
            console.error("Error:", err);
            toast.error(err?.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitChangePassword = async (e) => {
        e.preventDefault();

        // Array to store missing fields
        const missingFields = [];

        // Validate form fields
        if (context?.userData?.signUpWithGoogle === false && !changePassword.oldPassword) missingFields.push("Old Password");
        if (!changePassword.newPassword) missingFields.push("New Password");
        if (!changePassword.confirmPassword) missingFields.push("Confirm Password");
        if (changePassword.confirmPassword !== changePassword.newPassword) missingFields.push("New & Confirm Passwords correctly. They don't match.");

        // If any required fields are missing, show a single alert and exit
        if (missingFields.length > 0) {
            const missingFieldsList = missingFields.join(", ").replace(/, ([^,]*)$/, " and $1");
            context.openAlertBox("error", `Please enter your ${missingFieldsList}`);
            return; // Stop further execution
        }

        // Start loading and disable the fields
        setIsLoading2(true);

        try {

            // Login API call wrapped with toast.promise
            await toast.promise(
                postData("/api/user/reset-password", changePassword, { withCredentials: true }),
                {
                    loading: "Updating password... Please wait.",
                    success: (res) => {
                        if (res && res.error === false) {
                            // Clear form fields and store tokens
                            setChangePassword({ oldPassword: "", newPassword: "", confirmPassword: "" });
                            navigate("/"); // Navigate to home page
                            return res?.message;
                        } else {
                            throw new Error(res?.message || "Oops! Server is slow. Try again!");
                        }
                    },
                    error: (err) => {
                        // Ensure err.response exists and check the message structure
                        const errorMessage = err?.response?.data?.message || err.message || "An unexpected error occurred. Please try again.";
                        return errorMessage;
                    },
                }
            ).then((res) => {
                console.log(res);
                // Add any additional success actions here
            }).catch((err) => {
                console.error(err);
            });
        } catch (err) {
            // Final fallback for unexpected errors
            return err.message || "An error occurred during updating password.";
        } finally {
            setIsLoading2(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [])

    useEffect(() => {
        if (isChangePasswordFormShow) {
            const el = document.getElementById('pass');
            if (el) {
              const yOffset = -150; // adjust this for how much space you want
              const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
            
        }
    }, [isChangePasswordFormShow]);


    return (
        // <section className="py-10 w-full">
        //     <div className="container flex gap-5">
        //         <AccountSidebar />
        //         <div className="col-2 w-[100%]">
        //             <div className="card bg-white p-5 shadow-md rounded-md mb-5">
        //                 <div className="flex items-center mb-2">
        //                     <h2 className="pb-0 font-bold text-[20px]">My Account</h2>
        //                     <Button className='!ml-auto' onClick={() => setIsChangePasswordFormShow(!isChangePasswordFormShow)}>Change Password</Button>
        //                 </div>
        //                 <Divider />
        //                 <form action="" className="mt-6" onSubmit={handleSubmit}>
        //                     <div className="flex items-center gap-5">
        //                         <div className="w-[50%]">
        //                             <TextField type='text' label="Full Name" variant="outlined" size="small" className="custom-textfield w-full" name="name" value={formFields.name} disabled={isLoading} onChange={onChangeInput} />
        //                         </div>
        //                         <div className="w-[50%]">
        //                             <TextField type='email' label="Email" variant="outlined" size="small" className="custom-textfield w-full" name="email" value={formFields.email} disabled onChange={onChangeInput} />
        //                         </div>
        //                     </div>
        //                     <div className="flex items-center gap-5 mt-4">
        //                         <div className="w-[50%]">
        //                             <MuiPhone margin="dense" defaultCountry="in" name='mobile' value={phone} onChange={(phone) => { setPhone(phone); setFormFields(prevState => ({ ...prevState, mobile: phone })); }} disabled={isLoading} type="text" className={`!w-full h-[40px] flex items-center custom-textfield ${isLoading === true ? "!cursor-not-allowed" : ""}`} fullWidth variant="outlined" size="small" />
        //                         </div>
        //                         <div className="w-[50%]"></div>
        //                     </div>
        //                     <div className="flex items-center gap-5 mt-5">
        //                         <div className="flex gap-5 w-[50%]">
        //                             <Button type='submit' className={`${isLoading === true ? "buttonDisabled" : "buttonPrimaryBlack"} w-full`} disabled={isLoading}>
        //                                 {
        //                                     isLoading ? <CircularProgress color="inherit" /> : "Save"
        //                                 }
        //                             </Button>
        //                             <Button type='reset' className="buttonPrimaryWhite w-full" disabled={isLoading}>Cancel</Button>
        //                         </div>
        //                         <div className="flex gap-5 w-[50%]">
        //                         </div>
        //                     </div>
        //                 </form>
        //             </div>


        //             <Collapse isOpened={isChangePasswordFormShow}>
        //                 <div className="card bg-white p-5 shadow-md rounded-md" >
        //                     <div className="flex items-center mb-2">
        //                         <h2 className="pb-0 font-semibold">Change Password</h2>
        //                     </div>
        //                     <Divider />
        //                     <form action="" className="mt-6" onSubmit={handleSubmitChangePassword}>
        //                         <div className="grid grid-cols-2 gap-5">
        //                             {
        //                                 context?.userData?.signUpWithGoogle === false &&
        //                                 <div className="col relative">
        //                                     <TextField type={isLoading2 ? 'password' : (isShowPassword1 ? 'text' : 'password')} label="Old Password" variant="outlined" size="small" className="custom-textfield w-full" name="oldPassword" value={changePassword.oldPassword} disabled={isLoading2} onChange={onChangeInput} />
        //                                     <Button className="!absolute top-[3px] right-[10px] z-50 !w-[35px] !h-[35px] !min-w-[35px] !rounded-full !text-[rgba(0,0,0,0.7)]" onClick={() => setIsShowPassword1(!isShowPassword1)} disabled={isLoading} >
        //                                         {
        //                                             isShowPassword1 === false ?
        //                                                 <FaRegEyeSlash className="text-[20px]" />
        //                                                 :
        //                                                 <FaRegEye className="text-[20px]" />
        //                                         }
        //                                     </Button>
        //                                 </div>
        //                             }

        //                             <div className="col relative">
        //                                 <TextField type={isLoading2 ? 'password' : (isShowPassword2 ? 'text' : 'password')} label="New Password" variant="outlined" size="small" className="custom-textfield w-full" name="newPassword" value={changePassword.newPassword} disabled={isLoading2} onChange={onChangeInput} />
        //                                 <Button className="!absolute top-[3px] right-[10px] z-50 !w-[35px] !h-[35px] !min-w-[35px] !rounded-full !text-[rgba(0,0,0,0.7)]" onClick={() => setIsShowPassword2(!isShowPassword2)} disabled={isLoading} >
        //                                     {
        //                                         isShowPassword2 === false ?
        //                                             <FaRegEyeSlash className="text-[20px]" />
        //                                             :
        //                                             <FaRegEye className="text-[20px]" />
        //                                     }
        //                                 </Button>
        //                             </div>
        //                             <div className="col relative">
        //                                 <TextField type={isLoading2 ? 'password' : (isShowPassword3 ? 'text' : 'password')} label="Confirm Password" variant="outlined" size="small" className="custom-textfield w-full" name="confirmPassword" value={changePassword.confirmPassword} disabled={isLoading2} onChange={onChangeInput} />
        //                                 <Button className="!absolute top-[3px] right-[10px] z-50 !w-[35px] !h-[35px] !min-w-[35px] !rounded-full !text-[rgba(0,0,0,0.7)]" onClick={() => setIsShowPassword3(!isShowPassword3)} disabled={isLoading} >
        //                                     {
        //                                         isShowPassword3 === false ?
        //                                             <FaRegEyeSlash className="text-[20px]" />
        //                                             :
        //                                             <FaRegEye className="text-[20px]" />
        //                                     }
        //                                 </Button>
        //                             </div>
        //                             <div className="col"></div>
        //                         </div>
        //                         <div className="grid grid-cols-2 gap-5 mt-5">
        //                             <div className="flex gap-5 col">
        //                                 <Button type='submit' className={`${isLoading2 === true ? "buttonDisabled" : "buttonPrimaryBlack"} w-full`} disabled={isLoading2}>
        //                                     {
        //                                         isLoading2 ? <CircularProgress color="inherit" /> : "Change Password"
        //                                     }
        //                                 </Button>
        //                                 <Button type='reset' className="buttonPrimaryWhite w-full" disabled={isLoading2}>Cancel</Button>
        //                             </div>
        //                         </div>
        //                     </form>
        //                 </div>
        //             </Collapse>

        //         </div>
        //     </div>
        // </section>
        <section className="py-10 w-full">
            <div className="container flex flex-col sm:flex-row gap-5">
                <AccountSidebar />
                <div className="w-full">
                    <div className="card bg-white p-5 shadow-md rounded-md mb-5">
                        <div className="flex flex-wrap flex-row items-start justify-between md:items-center gap-3 mb-2">
                            <h2 className="font-bold text-[20px]">My Account</h2>
                            <Button className="md:ml-auto w-auto !capitalize" onClick={() => setIsChangePasswordFormShow(!isChangePasswordFormShow)}>Change Password ?</Button>
                        </div>

                        <Divider />

                        <form className="mt-6" onSubmit={handleSubmit}>
                            <div className="flex flex-col lg:flex-row items-center gap-5">
                                <div className="w-full lg:w-1/2">
                                    <TextField type="text" label="Full Name" variant="outlined" size="small" className="custom-textfield w-full" name="name" value={formFields.name} disabled={isLoading} onChange={onChangeInput} />
                                </div>
                                <div className="w-full lg:w-1/2">
                                    <TextField type="email" label="Email" variant="outlined" size="small" className="custom-textfield w-full" name="email" value={formFields.email} disabled onChange={onChangeInput} />
                                </div>
                            </div>

                            <div className="flex flex-col lg:flex-row items-center lg:gap-5 mt-4">
                                <div className="w-full lg:w-1/2">
                                    <MuiPhone
                                        margin="dense"
                                        defaultCountry="in"
                                        name="mobile"
                                        value={phone}
                                        onChange={(phone) => {
                                            setPhone(phone);
                                            setFormFields(prevState => ({ ...prevState, mobile: phone }));
                                        }}
                                        disabled={isLoading}
                                        type="text"
                                        className={`!w-full h-[40px] flex items-center custom-textfield ${isLoading ? "!cursor-not-allowed" : ""}`}
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                    />
                                </div>
                                <div className="w-full lg:w-1/2"></div>
                            </div>

                            {/* <div className="flex flex-col md:flex-row items-center gap-5 mt-5"> */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
                                {/* <div className="flex gap-5 w-full md:w-1/2"> */}
                                <Button type="submit" className={`${isLoading ? "buttonDisabled" : "buttonPrimaryBlack"} w-full !capitalize`} disabled={isLoading}>
                                    {isLoading ? <CircularProgress color="inherit" /> : "Save"}
                                </Button>
                                <Button type="reset" className="buttonPrimaryWhite w-full !capitalize" disabled={isLoading}>Cancel</Button>
                                {/* </div>
                                <div className="w-full md:w-1/2"></div> */}
                            </div>
                        </form>
                    </div>

                    <Collapse isOpened={isChangePasswordFormShow} >
                        <div className="card bg-white p-5 shadow-md rounded-md" id="pass">
                            <div className="flex items-center mb-2">
                                <h2 className="font-semibold">Change Password</h2>
                            </div>
                            <Divider />

                            <form className="mt-6" onSubmit={handleSubmitChangePassword}>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    {context?.userData?.signUpWithGoogle === false && (
                                        <div className="relative">
                                            <TextField type={isLoading2 ? 'password' : (isShowPassword1 ? 'text' : 'password')} label="Old Password" variant="outlined" size="small" className="custom-textfield w-full" name="oldPassword" value={changePassword.oldPassword} disabled={isLoading2} onChange={onChangeInput} />
                                            <Button className="!absolute top-[3px] right-[10px] z-50 !w-[35px] !h-[35px] !min-w-[35px] !rounded-full !text-[rgba(0,0,0,0.7)]" onClick={() => setIsShowPassword1(!isShowPassword1)} disabled={isLoading}>
                                                {isShowPassword1 ? <FaRegEye className="text-[20px]" /> : <FaRegEyeSlash className="text-[20px]" />}
                                            </Button>
                                        </div>
                                    )}

                                    <div className="relative">
                                        <TextField type={isLoading2 ? 'password' : (isShowPassword2 ? 'text' : 'password')} label="New Password" variant="outlined" size="small" className="custom-textfield w-full" name="newPassword" value={changePassword.newPassword} disabled={isLoading2} onChange={onChangeInput} />
                                        <Button className="!absolute top-[3px] right-[10px] z-50 !w-[35px] !h-[35px] !min-w-[35px] !rounded-full !text-[rgba(0,0,0,0.7)]" onClick={() => setIsShowPassword2(!isShowPassword2)} disabled={isLoading}>
                                            {isShowPassword2 ? <FaRegEye className="text-[20px]" /> : <FaRegEyeSlash className="text-[20px]" />}
                                        </Button>
                                    </div>

                                    <div className="relative">
                                        <TextField type={isLoading2 ? 'password' : (isShowPassword3 ? 'text' : 'password')} label="Confirm Password" variant="outlined" size="small" className="custom-textfield w-full" name="confirmPassword" value={changePassword.confirmPassword} disabled={isLoading2} onChange={onChangeInput} />
                                        <Button className="!absolute top-[3px] right-[10px] z-50 !w-[35px] !h-[35px] !min-w-[35px] !rounded-full !text-[rgba(0,0,0,0.7)]" onClick={() => setIsShowPassword3(!isShowPassword3)} disabled={isLoading}>
                                            {isShowPassword3 ? <FaRegEye className="text-[20px]" /> : <FaRegEyeSlash className="text-[20px]" />}
                                        </Button>
                                    </div>

                                    <div className="col"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
                                    {/* <div className="flex gap-5"> */}
                                    <Button type="submit" className={`${isLoading2 ? "buttonDisabled" : "buttonPrimaryBlack"} w-full !capitalize`} disabled={isLoading2}>
                                        {isLoading2 ? <CircularProgress color="inherit" /> : "Change Password"}
                                    </Button>
                                    <Button type="reset" className="buttonPrimaryWhite w-full !capitalize" disabled={isLoading2} onClick={() => { setIsChangePasswordFormShow(!isChangePasswordFormShow); window.scrollTo(0, 0); }}
                                    >Cancel</Button>
                                    {/* </div> */}
                                </div>
                            </form>
                        </div>
                    </Collapse>
                </div>
            </div>
        </section>

    )
}

export default MyAccount
