import { useContext, useEffect, useState } from 'react'
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { postData } from '../../utils/api';
import { MyContext } from '../../App';
import toast from 'react-hot-toast';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';

import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseApp } from '../../firebase';
import PropTypes from 'prop-types';
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();


const Register = () => {

    const context = useContext(MyContext);
    const navigate = useNavigate();

    const [isShowPassword, setIsShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formFields, setFormFields] = useState({
        name: "",
        email: "",
        password: "",
    });

    useEffect(()=>{
        window.scrollTo(0,0);
    },[]);

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setFormFields((formFields) => ({
            ...formFields,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Array to store missing fields
        let missingFields = [];

        // Validate form fields
        if (!formFields.name) missingFields.push("Full Name");
        if (!formFields.email) missingFields.push("Email Id");
        if (!formFields.password) missingFields.push("Password");

        // If any required fields are missing, show a single alert and exit
        if (missingFields.length > 0) {
            const missingFieldsList = missingFields.join(", ").replace(/, ([^,]*)$/, " and $1");
            context.openAlertBox("error", `Please enter your ${missingFieldsList}`);
            return; // Stop further execution
        }

        // Check if an email already exists in localStorage
        const storedEmail = localStorage.getItem("User email");

        if (storedEmail) {
            if (storedEmail !== formFields.email) {
                // Notify the user about the conflict
                // Optionally, provide an option to clear the stored email
                const confirmSwitch = window.confirm("Another user already exists on this profile. Do you want to switch to a new user? This will clear the current user data for this site.");

                if (confirmSwitch) {
                    localStorage.clear();
                    // Proceed with registration or login for the new user
                } else {
                    return; // Stop further execution if the user doesn't confirm the switch
                }
            }
        } else {
            // Continue with the registration or login process
        }

        // Start loading and disable the fields
        setIsLoading(true);

        try {
            // Wrap the registration API call inside a toast.promise
            await toast.promise(
                postData("/api/user/register", formFields),
                {
                    loading: "Registering... Please wait.",
                    success: (res) => {
                        if (res && res.error === false) {
                            localStorage.setItem("User email", formFields.email);
                            setFormFields({ name: "", email: "", password: "" });
                            // Set OTP expiration time and trigger timer
                            const currentTime = Date.now();
                            const otpExpirationTime = currentTime + 5 * 60 * 1000; // OTP expires in 5 minutes
                            localStorage.setItem("OTP_EXPIRES", otpExpirationTime); // Store the OTP expiration time
                            navigate("/verify"); // Navigate to verification page
                            return res?.message;

                        } else {
                            throw new Error(res?.message || "Oops! Server is slow. Try again!");
                        }
                    },
                    error: (err) => {
                        return err.message || "An unexpected error occurred. Please try again.";
                    }
                }
            ).then((res) => {
                // Add any actions that you want after the promise resolves successfully here
                console.log("Registration successful:", res);
                // You could, for example, show an additional confirmation message, perform analytics tracking, etc.
            }).catch((err) => {
                // Handle any errors here if they weren't caught earlier in the toast.promise
                console.error("Error in registration:", err);
            });
        } catch (err) {
            if (!err.message.includes("Registration successful!")) {
                context.openAlertBox("error", err.message || "An error occurred during registration.");
            }
        } finally {
            setIsLoading(false);
        }
    };


    const authWithGoogle = () => {
        signInWithPopup(auth, googleProvider)
            .then((result) => {
                // This gives you a Google Access Token. You can use it to access the Google API.
                // const credential = GoogleAuthProvider.credentialFromResult(result);
                // const token = credential.accessToken;
                // The signed-in user info.
                const user = result.user;
                // IdP data available using getAdditionalUserInfo(result)

                const fields = {
                    name: user.providerData[0].displayName,
                    email: user.providerData[0].email,
                    password: null,
                    avatar: user.providerData[0].photoURL,
                    mobile: user.providerData[0].phoneNumber,
                    role: "USER",
                }

                postData(`/api/user/authWithGoogle`, fields).then((res) => {
                    if (res?.error !== true) {
                        setIsLoading(false);
                        context.openAlertBox("success", res?.message);
                        localStorage.setItem("User email", fields.email);
                        localStorage.setItem("accessToken", res?.data?.accessToken);
                        localStorage.setItem("refreshToken", res?.data?.refreshToken);
                        context.setIsLogin(true);
                        navigate('/');
                    } else {
                        context.openAlertBox("error", res?.message);
                        setIsLoading(false);
                    }
                })

                console.log(user);
                // ...
            }).catch((error) => {
                // Log the error code and message to the console for debugging
                const errorCode = error.code;
                const errorMessage = error.message;
            
                // Optionally, log the email and credential if needed
                const email = error.customData?.email;
                const credential = GoogleAuthProvider.credentialFromError(error);
            
                // Display a message to the user, showing a generic error or custom error message
                context.openAlertBox("error", "An error occurred while signing in with Google. Please try again.");
            
                // You can log the error information for development purposes
                console.error("Google Auth Error:", { errorCode, errorMessage, email, credential });
            
                // Optionally, you can also send the error details to an analytics service like Sentry
            });            
    }


    return (
        // <div>
        //     <section className="section py-10">
        //         <div className="container">
        //             <div className="card shadow-md w-[400px] m-auto rounded-md bg-white p-5 px-10">
        //                 <h3 className="text-[18px] text-center font-bold flex items-center justify-center gap-2">
        //                     <img src="/favicon.png" className="w-[18px] h-[18px]" />
        //                     Create an account
        //                 </h3>

        //                 <form action="" className="w-full mt-5" onSubmit={handleSubmit}>
        //                     <div className="form-group w-full mb-5 relative">
        //                         <TextField
        //                             type="text"
        //                             name="name"
        //                             id="fullName"
        //                             label="Full Name"
        //                             placeholder="Enter your full name"
        //                             variant="outlined"
        //                             className="custom-textfield w-full mb-5"
        //                             value={formFields.name}
        //                             disabled={isLoading} // Disable input field when loading
        //                             onChange={onChangeInput}
        //                         />
        //                     </div>
        //                     <div className="form-group w-full mb-5 relative">
        //                         <TextField
        //                             type="email"
        //                             name="email"
        //                             id="email"
        //                             label="Email Id"
        //                             placeholder="Enter email"
        //                             variant="outlined"
        //                             className="custom-textfield w-full mb-5"
        //                             value={formFields.email}
        //                             disabled={isLoading} // Disable input field when loading
        //                             onChange={onChangeInput}
        //                         />
        //                     </div>
        //                     <div className="form-group w-full mb-2 relative">
        //                         <TextField
        //                             type={isLoading ? 'password' : (isShowPassword ? 'text' : 'password')}
        //                             name="password"
        //                             id="password"
        //                             label="Password"
        //                             placeholder="Enter password"
        //                             variant="outlined"
        //                             className="custom-textfield w-full mb-5"
        //                             value={formFields.password}
        //                             disabled={isLoading} // Disable input field when loading
        //                             onChange={onChangeInput}
        //                         />
        //                         <Button
        //                             className="!absolute top-[10px] right-[10px] z-50 !w-[35px] !h-[35px] !min-w-[35px] !rounded-full !text-[rgba(0,0,0,0.7)]"
        //                             onClick={() => setIsShowPassword(!isShowPassword)}
        //                             disabled={isLoading} // Disable button when loading
        //                         >
        //                             {isShowPassword === false ? (
        //                                 <FaRegEyeSlash className="text-[20px]" />
        //                             ) : (
        //                                 <FaRegEye className="text-[20px]" />
        //                             )}
        //                         </Button>
        //                     </div>

        //                     <Button
        //                         type="submit"
        //                         className={`${isLoading === true ? "buttonDisabled" : "buttonPrimaryBlack"} !w-full !text-[15px] !font-semibold !mt-4 flex gap-3`}
        //                         disabled={isLoading} // Disable submit button when loading
        //                     >
        //                         {
        //                             isLoading ? <CircularProgress color="inherit" /> : "Sign Up"
        //                         }
        //                     </Button>

        //                     <p className="text-[14px] font-medium flex items-center justify-center gap-1 mt-4">
        //                         Already have an account?
        //                         <Link
        //                             to="/login"
        //                             className="text-[var(--bg-primary)] hover:text-blue-700 hover:underline underline-offset-8 cursor-pointer text-[14px] font-medium"
        //                         >
        //                             Sign In
        //                         </Link>
        //                     </p>

        //                     <p className="text-[14px] font-medium flex items-center justify-center gap-1 mt-1">
        //                         Or continue with social account
        //                     </p>

        //                     <Button
        //                         className="w-full !bg-[#f1f1f1] hover:!bg-[#ffe6db] hover:!text-gray-700 flex items-center gap-2 !text-[15px] !font-semibold !mt-2"
        //                         disabled={isLoading} onClick={authWithGoogle}
        //                     >
        //                         <FcGoogle className="text-[18px]" />
        //                         Sign Up with Google
        //                     </Button>
        //                 </form>
        //             </div>
        //         </div>
        //     </section>

        // </div>

        <div>
  <section className="section py-10">
    <div className="container px-4 sm:px-6 lg:px-8">
      <div className="card shadow-md w-full max-w-md mx-auto rounded-md bg-white p-5 sm:p-6 md:p-8">
        <h3 className="text-[18px] text-center font-bold flex items-center justify-center gap-2">
          <img src="/favicon.png" className="w-[18px] h-[18px]" alt="icon" />
          Create an account
        </h3>

        <form action="" className="w-full mt-5" onSubmit={handleSubmit}>
          <div className="form-group w-full mb-5 relative">
            <TextField
              type="text"
              name="name"
              id="fullName"
              label="Full Name"
              placeholder="Enter your full name"
              variant="outlined"
              className="custom-textfield w-full"
              value={formFields.name}
              disabled={isLoading}
              onChange={onChangeInput}
            />
          </div>
          <div className="form-group w-full mb-5 relative">
            <TextField
              type="email"
              name="email"
              id="email"
              label="Email Id"
              placeholder="Enter email"
              variant="outlined"
              className="custom-textfield w-full"
              value={formFields.email}
              disabled={isLoading}
              onChange={onChangeInput}
            />
          </div>
          <div className="form-group w-full mb-2 relative">
            <TextField
              type={isLoading ? 'password' : (isShowPassword ? 'text' : 'password')}
              name="password"
              id="password"
              label="Password"
              placeholder="Enter password"
              variant="outlined"
              className="custom-textfield w-full"
              value={formFields.password}
              disabled={isLoading}
              onChange={onChangeInput}
            />
            <Button
              type="button"
              className="!absolute top-[10px] right-[10px] z-50 !w-[35px] !h-[35px] !min-w-[35px] !rounded-full !text-[rgba(0,0,0,0.7)]"
              onClick={() => setIsShowPassword(!isShowPassword)}
              disabled={isLoading}
            >
              {isShowPassword ? (
                <FaRegEye className="text-[20px]" />
              ) : (
                <FaRegEyeSlash className="text-[20px]" />
              )}
            </Button>
          </div>

          <Button
            type="submit"
            className={`${isLoading ? 'buttonDisabled' : 'buttonPrimaryBlack'} !capitalize !w-full !text-[15px] !font-semibold !mt-4 flex gap-3`}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress color="inherit" /> : 'Sign Up'}
          </Button>

          <p className="text-[14px] font-medium flex items-center justify-center gap-1 mt-4">
            Already have an account?
            <Link
              to="/login"
              className="text-[var(--bg-primary)] hover:text-blue-700 hover:underline underline-offset-8 cursor-pointer"
            >
              Sign In
            </Link>
          </p>

          <p className="text-[14px] font-medium flex items-center justify-center gap-1 mt-1">
            Or continue with social account
          </p>

          <Button
            className="w-full !capitalize !bg-[#f1f1f1] hover:!bg-[#ffe6db] hover:!text-gray-700 flex items-center gap-2 !text-[15px] !font-semibold !mt-2"
            disabled={isLoading}
            onClick={authWithGoogle}
          >
            <FcGoogle className="text-[18px]" />
            Sign Up with Google
          </Button>
        </form>
      </div>
    </div>
  </section>
</div>

    )
}


Register.propTypes = {
    // No props are passed directly, but if you want to validate context, do so by defining the context's shape.
    // Example for context:
    context: PropTypes.shape({
      openAlertBox: PropTypes.func.isRequired,
      setIsLogin: PropTypes.func.isRequired,
    }).isRequired,
  };

export default Register
