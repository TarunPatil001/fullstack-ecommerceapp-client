import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import AccountSidebar from '../../components/AccountSidebar'
import { MyContext } from '../../App';
import { useNavigate } from 'react-router-dom';
import { Checkbox, CircularProgress, Divider, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import toast from 'react-hot-toast';
import { editData, fetchDataFromApi, postData } from '../../utils/api';
import 'react-international-phone/style.css';
import { FiEdit, FiPlus } from 'react-icons/fi';
import { RiResetLeftFill } from 'react-icons/ri';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import 'react-international-phone/style.css';
import { TextField, } from '@mui/material';
import { IoIosSave } from 'react-icons/io';
import { MuiPhone } from '../../components/MuiPhone';
import { TbDotsVertical } from 'react-icons/tb';



const Address = () => {

    const context = useContext(MyContext);
    const navigate = useNavigate();

    const formRef = useRef(); // Create ref to the form
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoading2, setIsLoading2] = useState(false);
    const [isLoading3, setIsLoading3] = useState(false);
    const [address, setAddress] = useState([]);
    const [isAddressType, setIsAddressType] = useState("");
    const [selectedValue, setSelectedValue] = useState(false);
    const [userIdForEdit, setUserIdForEdit] = useState("");
    const [addressIdForEdit, setAddressIdForEdit] = useState("");

    const [phone, setPhone] = useState('');
    const [error, setError] = useState(false);
    const [status, setStatus] = useState("");
    const [isOpenModel, setIsOpenModel] = useState(false);

    const nameRef = useRef(null);
    const addressLine1Ref = useRef(null);
    const cityRef = useRef(null);
    const stateRef = useRef(null);
    const countryRef = useRef(null);
    const pincodeRef = useRef(null);
    const mobileRef = useRef(null);
    const addressTypeRef = useRef(null);

    const dropdownRef = useRef(null);

    const [formFields, setFormFields] = useState({
        name: '',
        address_line1: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        mobile: '',
        addressType: '',
        status: '',
        userId: '',
        selected: false,
    });



    // Effect for checking if the user is logged in and setting phone once user data is available
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            context?.setIsLogin(true);
        } else {
            navigate("/");
        }

        // Set phone only if user data exists
        if (context?.userData) {
            const validPhone = context?.userData?.mobile ? String(context?.userData?.mobile) : "";
            setPhone(validPhone);
        }
    }, [context, navigate]);

    // Effect for setting userId in form fields when context changes
    useEffect(() => {
        const userId = context?.userData?._id;
        if (userId) {
            setFormFields((prevState) => ({
                ...prevState,
                userId: context.userData._id,
            }));
        }
    }, [context?.userData]);

    const fetchAddress = useCallback(() => {
        if (!context?.userData?._id) return;

        setIsLoading(true);
        fetchDataFromApi(`/api/address/get-address?userId=${context?.userData?._id}`)
            .then((res) => setAddress(res.data))
            .catch((err) => console.error("Error fetching address:", err))
            .finally(() => setIsLoading(false));
    }, [context?.userData]);  // ✅ Stable function that updates only when userData changes

    useEffect(() => {
        fetchAddress();
    }, [fetchAddress]);  // ✅ Triggers only when fetchAddress reference changes

    useEffect(() => {
        setIsOpen(null); // Reset popover when addresses update
    }, [address]); // Run whenever address list changes


    // Effect for fetching address data
    useEffect(() => {
        if (context?.userData?._id) {
            setIsLoading(true);  // Start loading
            fetchDataFromApi(`/api/address/get-address?userId=${context?.userData?._id}`)
                .then((res) => {

                    setAddress(res.data);  // Set the fetched address data
                    setIsLoading(false);    // Stop loading

                })
                .catch((err) => {
                    console.error("Error fetching data from API:", err);
                    setIsLoading(false);  // Stop loading in case of error
                });
        }
    }, [context?.userData?._id]);


    // Effect for handling address edits and populating form fields
    useEffect(() => {
        const { userId, addressId } = { userId: userIdForEdit, addressId: addressIdForEdit };

        if (!addressId) {
            setAddressIdForEdit(undefined);
            setUserIdForEdit(context?.userData?._id);
            setFormFields({
                name: '',
                address_line1: "",
                landmark: '',
                city: "",
                state: "",
                pincode: "",
                country: "India",
                mobile: "",
                addressType: '',
                status: "",
                userId: userId || context?.userData?._id,
            });
            setPhone("");
            setIsAddressType("");
            setStatus("");
            return;
        }

        if (addressId && userId) {
            setAddressIdForEdit(addressId);
            setUserIdForEdit(userId);
            const fetchAddressData = async () => {
                try {
                    const response = await fetchDataFromApi(
                        `/api/address/get-single-address?userId=${userId}&_id=${addressId}`,
                        { withCredentials: true }
                    );

                    if (response.success && response.data) {
                        const address = response.data;
                        setIsAddressType(address.addressType || "");
                        setFormFields({
                            name: address.name || "",
                            address_line1: address.address_line1 || "",
                            landmark: address.landmark || "",
                            city: address.city || "",
                            state: address.state || "",
                            pincode: address.pincode || "",
                            country: address.country || "",
                            addressType: address.addressType || "",
                            status: address.status || "",
                            userId: address.userId || userId,

                        });

                        const validPhone = address.mobile ? String(address.mobile) : "";
                        setPhone(validPhone);

                        const statusValue = address.status === true || address.status === false ? address.status : "";
                        setStatus(statusValue);
                    } else {
                        console.error("Address data not found or response unsuccessful.");
                    }
                } catch (error) {
                    console.error("Error fetching address:", error);
                }
            };

            fetchAddressData();
        }
    }, [userIdForEdit, addressIdForEdit, context?.userData?._id, context?.isReducer]);

    // Effect to manage selected address
    useEffect(() => {
        const safeAddress = address || [];  // Ensure address is an array (in case it's null or undefined)

        // Find the address that is selected
        const selectedAddress = safeAddress.find(addr => addr.selected === true);

        if (selectedAddress) {
            // Set the selected address ID
            setSelectedValue(selectedAddress._id);
        } else {
            // No address is selected, set a default value or handle as needed
            setSelectedValue(null);  // Example: Set selectedValue to null if no address is selected
        }
    }, [address]); // This effect runs whenever the address list changes

    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setFormFields((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleStatusChange = (event) => {
        const value = event.target.checked;
        setStatus(value);
        setFormFields((prevState) => ({
            ...prevState,
            status: value,
        }));
    };

    const handleAddressType = (event) => {
        const value = event.target.value;
        setIsAddressType(value);
        setFormFields((prevState) => ({
            ...prevState,
            addressType: value,
        }));
    }

    const handleClickOpen = (addressId) => {
        setUserIdForEdit(context?.userData?._id);
        setAddressIdForEdit(undefined);
        console.log(userIdForEdit);
        console.log(addressId);
        setIsOpenModel(true);
        context.forceUpdate();
    };

    const handleClose = () => {
        setIsOpenModel(false);
        formRef.current.reset();
        setFormFields({
            name: '',
            address_line1: '',
            landmark: '',
            city: '',
            state: '',
            country: '',
            pincode: '',
            mobile: '',
            addressType: '',
        });
        setPhone('');
        setStatus('');
        setError(false);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form fields
        if (!formFields.name) {
            context.openAlertBox("error", "Please enter name");
            nameRef.current.focus();
            return;
        }
        if (!formFields.address_line1) {
            context.openAlertBox("error", "Please enter address line 1");
            addressLine1Ref.current.focus();
            return;
        }
        if (!formFields.city) {
            context.openAlertBox("error", "Please enter city");
            cityRef.current.focus();
            return;
        }
        if (!formFields.state) {
            context.openAlertBox("error", "Please enter state");
            stateRef.current.focus();
            return;
        }
        if (!formFields.pincode) {
            context.openAlertBox("error", "Please enter pincode");
            pincodeRef.current.focus();
            return;
        }
        if (!formFields.country) {
            context.openAlertBox("error", "Please enter country");
            countryRef.current.focus();
            return;
        }
        if (!phone) {
            context.openAlertBox("error", "Please enter mobile");
            mobileRef.current.focus();
            return;
        }
        if (!isAddressType) {
            context.openAlertBox("error", "Please select address type");
            addressTypeRef.current.focus();
            return;
        }

        setIsLoading(true);

        try {
            const result = await toast.promise(
                postData("/api/address/add-address", formFields, { withCredentials: true }),
                {
                    loading: "Submitting address... Please wait.",
                    success: (res) => {
                        if (res?.success) {
                            // Optimistically update the address list by adding the new address
                            const newAddress = res?.data;  // Assuming the new address data is returned
                            context?.setAddress((prevAddresses = []) => [...prevAddresses, newAddress]); // Add the new address to the list

                            // Optionally, fetch updated addresses from the API to get the full list
                            fetchDataFromApi(`/api/address/get-address?userId=${context?.userData?._id}`).then((res) => {
                                context?.setAddress(res.data); // Update state with fresh data
                            });
                            fetchAddress();
                            handleClose();  // Close modal or form
                            return res.message || "Address added successfully!";
                        } else {
                            throw new Error(res?.message || "An unexpected error occurred.");
                        }
                    },
                    error: (err) => {
                        const errorMessage = err?.response?.data?.message || err.message || "Failed to add address. Please try again.";
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


    const handleEditClick = (userId, addressId) => {

        setAddressIdForEdit(addressId);
        setUserIdForEdit(userId);
        console.log("Edit Click userid", userId);
        console.log("Edit Click addressId", addressId);


        const fetchAddressData = async () => {
            try {
                const response = await fetchDataFromApi(
                    `/api/address/get-single-address?userId=${userId}&_id=${addressId}`,
                    { withCredentials: true }
                );

                if (response.success && response.data) {
                    const address = response.data;

                    setFormFields({
                        name: address.name || "",
                        address_line1: address.address_line1 || "",
                        landmark: address.landmark || "",
                        city: address.city || "",
                        state: address.state || "",
                        pincode: address.pincode || "",
                        country: address.country || "",
                        addressType: address.addressType || "",
                        status: address.status || "",
                        userId: address.userId || userId,
                    });

                    const validPhone = address.mobile ? String(address.mobile) : "";
                    setPhone(validPhone);

                    const statusValue = address.status === true || address.status === false ? address.status : "";
                    setStatus(statusValue);
                } else {
                    console.error("Address data not found or response unsuccessful.");
                }
            } catch (error) {
                console.error("Error fetching address:", error);
            }
        };

        fetchAddressData();
        fetchAddress();

        setIsOpenModel(true); // Open modal or form for editing

    };


    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await toast.promise(
                editData("/api/address/update-address", {
                    ...formFields,
                    userId: context?.userData?._id,
                    addressId: addressIdForEdit,
                }, { withCredentials: true }),
                {
                    loading: "Updating address... Please wait.",
                    success: (res) => {
                        if (res?.success) {
                            const updatedAddresses = context?.address?.map((address) =>
                                address._id === addressIdForEdit
                                    ? { ...address, ...formFields }
                                    : address
                            );
                            context?.setAddress(updatedAddresses); // Update the address state
                            fetchAddress();
                            handleClose();
                            return res.message || "Address updated successfully!";
                        } else {
                            throw new Error(res?.message || "An unexpected error occurred.");
                        }
                    },
                    error: (err) => {
                        const errorMessage = err?.response?.data?.message || err.message || "Failed to update address. Please try again.";
                        return errorMessage;
                    },
                }
            );
            console.log("Update Result:", result);
        } catch (err) {
            console.error("Error in handleUpdate:", err);
            toast.error(err?.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false); // Hide the loading spinner
        }
    };


    const handleDeleteAddress = async (e, addressId) => {
        e.preventDefault();
        // Start loading and disable the fields
        setIsLoading2(true);

        try {
            // Delete address API call wrapped with toast.promise
            await toast.promise(
                postData("/api/address/delete-address", {
                    userId: context?.userData?._id, // Replace with the actual userId
                    addressId: addressId, // Address ID to delete
                }, { withCredentials: true }),
                {
                    loading: "Deleting address... Please wait.",
                    success: (res) => {
                        if (res && res.error === false) {
                            // Handle success, e.g., remove the address from the state
                            setAddress(Array.isArray(address) ? address.filter(addr => addr._id !== addressId) : []);
                            fetchAddress();
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
            return err.message || "An error occurred while deleting the address.";
        } finally {
            setIsLoading2(false);
        }
    };


    const handleSelectAddress = async (event) => {
        const addressId = event.target.value;
        const selected = event.target.checked;

        try {
            const result = await toast.promise(
                editData("/api/address/select-address", {
                    addressId: addressId,
                    userId: context?.userData?._id,
                    selected: selected,
                }, { withCredentials: true }),
                {
                    loading: "Updating address selection... Please wait.",
                    success: (res) => {
                        if (res?.success) {
                            const updatedAddresses = context?.address?.map((address) =>
                                address._id === addressId
                                    ? { ...address, selected: selected }
                                    : address
                            );

                            context?.setAddress(updatedAddresses);
                            setSelectedValue(addressId); // Set selected value to the newly selected address
                            context.forceUpdate();
                            return res.message || "Address selection updated successfully!";
                        } else {
                            throw new Error(res?.message || "An unexpected error occurred.");
                        }
                    },
                    error: (err) => {
                        const errorMessage = err?.response?.data?.message || err.message || "Failed to update address selection.";
                        return errorMessage;
                    },
                }
            );

            console.log("Select Address Result:", result);
        } catch (err) {
            console.error("Error in handleSelectAddress:", err);
            toast.error(err?.message || "An unexpected error occurred.");
        }
    };

    const handleToggle = (e, index) => {
        e.stopPropagation();
        if (context?.windowWidth < 992) {
            setIsOpen((prev) => (prev === index ? false : index));
        }
    };

    const handleMouseEnter = (index) => {
        if (context?.windowWidth >= 992) {
            setIsOpen(index);
        }
    };

    const handleMouseLeave = () => {
        if (context?.windowWidth >= 992) {
            setIsOpen(false);
        }
    };

    // 🧠 Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            {/* <section className="py-10 w-full">
                <div className="container flex gap-5">
                    <AccountSidebar />
                    <div className="col-2 w-[100%]">
                        <div className="card bg-white p-5 shadow-md rounded-md mb-5 h-full">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="pb-0 font-bold text-[20px]">Address Details</h2>
                                {address?.length > 0 &&
                                    <Button className={`h-[40px] buttonPrimaryBlack !text-white flex items-center justify-center gap-1 rounded-md p-3 text-[14px] ${isLoading === true ? "cursor-not-allowed" : ""}`} onClick={() => handleClickOpen()} disabled={isLoading}>
                                        <span className='text-center flex items-center justify-center'>
                                            {
                                                isLoading ? <CircularProgress color="inherit" /> : <><FiPlus className='text-[16px] font-bold' />Add Address</>
                                            }

                                        </span>
                                    </Button>
                                }
                            </div>
                            <Divider />
                            <form action="" className="mt-6" onSubmit={handleSubmit}>

                                <div className="flex items-center gap-5">
                                    <div
                                        className={`w-full grid grid-cols-1 gap-4 text-md ${isLoading ? 'cursor-not-allowed' : ''}`}
                                    >
                                        {Array.isArray(address) && address.length > 0 ? (
                                            address.map((address, index) => {
                                                const name = address?.name;
                                                const mobile = address?.mobile;
                                                const addressType = address?.addressType;
                                                const pincode = address?.pincode;
                                                const fullAddress = [
                                                    address?.address_line1,
                                                    address?.landmark,
                                                    address?.city,
                                                    address?.state,
                                                    address?.country,
                                                ]
                                                    .filter(Boolean) // Removes empty, null, or undefined values                                                
                                                    .join(", ");

                                                return (
                                                    <div
                                                        key={index}
                                                        className="relative border addressBox w-full flex flex-col items-center justify-between rounded-md p-2 hover:border-[var(--bg-primary)]"
                                                        onClick={() => handleSelectAddress(address?._id)} // Clicking the box selects the radio
                                                    >
                                                        <div className="flex items-start w-full"> */}
            {/* Radio Button with Label */}
            {/* <label htmlFor={`address-${index}`} className="cursor-pointer w-full flex items-start mr-[70px] p-2">
                                                                <Radio
                                                                    id={`address-${index}`}
                                                                    name="address"
                                                                    checked={selectedValue === address?._id}
                                                                    value={address?._id}
                                                                    onChange={handleSelectAddress}
                                                                /> */}

            {/* Address Content */}
            {/* <div className="w-full px-5 text-[14px] mt-2">
                                                                    <div className="flex flex-col items-start mb-2 gap-2">
                                                                        <span className="bg-gray-200 px-2 rounded-sm">{addressType}</span>
                                                                        <div className="flex gap-5 font-semibold">
                                                                            <span>{name}</span>
                                                                            <span>{mobile}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-auto">{fullAddress} - <span className="font-semibold">{pincode}</span></div>
                                                                </div>
                                                            </label> */}

            {/* Edit/Delete Popover */}
            {/* <div
                                                                className="relative inline-block"
                                                                onMouseEnter={() => setIsOpen(index)}
                                                                onMouseLeave={() => setIsOpen(false)}
                                                            >
                                                                <button className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-200">
                                                                    <TbDotsVertical size={20} />
                                                                </button>

                                                                {isOpen === index && (
                                                                    <span className="absolute right-0 top-0 w-24 bg-white shadow-md rounded p-2">
                                                                        <div
                                                                            className="cursor-pointer p-1 hover:bg-gray-100"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleEditClick(address?.userId, address?._id);
                                                                            }}
                                                                        >
                                                                            Edit
                                                                        </div>
                                                                        <div
                                                                            className="cursor-pointer p-1 hover:bg-gray-100"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteAddress(e, address?._id);
                                                                            }}
                                                                        >
                                                                            Delete
                                                                        </div>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                );
                                            })
                                        ) : (
                                            <div className='w-full h-full flex flex-col items-center'>
                                                <img src="../empty-myaddresses.png" className='w-[200px]' />
                                                <span className='font-bold mt-5'>No Addresses found in your account!</span>
                                                <span className='text-[14px]'>Add a delivery address.</span>
                                                <Button className={`h-[40px] !px-10 !mt-4 buttonPrimaryBlack !text-white flex items-center justify-center gap-1 rounded-md p-3 text-[14px] ${isLoading === true ? "cursor-not-allowed" : ""}`} onClick={() => handleClickOpen()} disabled={isLoading}>
                                                    <span className='text-center flex items-center justify-center'>
                                                        {
                                                            isLoading ? <CircularProgress color="inherit" /> : <><FiPlus className='text-[16px] font-bold' />Add Address</>
                                                        }

                                                    </span>
                                                </Button>
                                            </div>

                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </section> */}

            <section className="py-10 w-full">
                <div className="container gap-5 flex w-full flex-col sm:flex-row">
                    {
                        context?.windowWidth > 992 &&
                        <AccountSidebar />
                    }
                    <div className="w-full"> {/* Adjust width based on sidebar */}
                        <div className="card bg-white p-5 shadow-md rounded-md mb-5 h-full">
                            <form onSubmit={handleSubmit}>
                                <div className="flex flex-wrap flex-row items-start sm:items-center justify-between mb-2 gap-4">
                                    <h2 className="font-bold text-[20px]">Address Details</h2>
                                    {address?.length > 0 && (
                                        <Button
                                            className={`h-[40px] buttonPrimaryBlack !capitalize !text-white flex items-center justify-center gap-1 rounded-md px-4 text-[14px] ${isLoading ? "cursor-not-allowed" : ""
                                                }`}
                                            onClick={() => handleClickOpen()}
                                            disabled={isLoading3}
                                        >
                                            <span className="text-center flex items-center justify-center">
                                                {isLoading3 ? (
                                                    <CircularProgress color="inherit" />
                                                ) : (
                                                    <>
                                                        <FiPlus className="text-[16px] font-bold" /> Add {context?.windowWidth < 992 ? "" : "Address"}
                                                    </>
                                                )}
                                            </span>
                                        </Button>
                                    )}
                                </div>
                            </form>

                            <Divider />

                            {/* <div className="flex flex-col gap-5 mt-6">
                                    <div
                                        className={`w-full grid grid-cols-1 gap-4 text-md ${isLoading ? "cursor-not-allowed" : ""
                                            }`}
                                    >
                                        {Array.isArray(address) && address.length > 0 ? (
                                            address.map((address, index) => {
                                                const name = address?.name;
                                                const mobile = address?.mobile;
                                                const addressType = address?.addressType;
                                                const pincode = address?.pincode;
                                                const fullAddress = [
                                                    address?.address_line1,
                                                    address?.landmark,
                                                    address?.city,
                                                    address?.state,
                                                    address?.country,
                                                ]
                                                    .filter(Boolean)
                                                    .join(", ");

                                                return (
                                                    <div
                                                        key={index}
                                                        className="relative border addressBox w-full flex flex-col items-center justify-between rounded-md p-2 hover:border-[var(--bg-primary)]"
                                                        onClick={() => handleSelectAddress(address?._id)}
                                                    >
                                                        <div className="flex flex-col sm:flex-row items-start w-full">
                                                            <label
                                                                htmlFor={`address-${index}`}
                                                                className="cursor-pointer w-full flex items-start mr-0 sm:mr-[70px] p-2"
                                                            >
                                                                <Radio
                                                                    id={`address-${index}`}
                                                                    name="address"
                                                                    checked={selectedValue === address?._id}
                                                                    value={address?._id}
                                                                    onChange={handleSelectAddress}
                                                                />

                                                                <div className="w-full px-5 text-[14px] mt-2">
                                                                    <div className="flex flex-col items-start mb-2 gap-2">
                                                                        <span className="bg-gray-200 px-2 rounded-sm">
                                                                            {addressType}
                                                                        </span>
                                                                        <div className="flex flex-wrap gap-3 font-semibold">
                                                                            <span>{name}</span>
                                                                            <span>{mobile}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-auto">
                                                                        {fullAddress} -{" "}
                                                                        <span className="font-semibold">
                                                                            {pincode}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </label>

                                                            <div
                                                                className="absolute top-0 right-0 inline-block mt-2 sm:mt-0"
                                                                onMouseEnter={() => setIsOpen(index)}
                                                                onMouseLeave={() => setIsOpen(false)}
                                                            >
                                                                <button className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-200">
                                                                    <TbDotsVertical size={20} />
                                                                </button>

                                                                {isOpen === index && (
                                                                    <span className="absolute right-0 top-0 w-24 bg-white shadow-md rounded p-2 z-10">
                                                                        <div
                                                                            className="cursor-pointer p-1 hover:bg-gray-100"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleEditClick(
                                                                                    address?.userId,
                                                                                    address?._id
                                                                                );
                                                                            }}
                                                                        >
                                                                            Edit
                                                                        </div>
                                                                        <div
                                                                            className="cursor-pointer p-1 hover:bg-gray-100"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteAddress(
                                                                                    e,
                                                                                    address?._id
                                                                                );
                                                                            }}
                                                                        >
                                                                            Delete
                                                                        </div>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center text-center">
                                                <img
                                                    src="../empty-myaddresses.png"
                                                    className="w-[200px]"
                                                    alt="Empty Address"
                                                />
                                                <span className="font-bold mt-5">
                                                    No Addresses found in your account!
                                                </span>
                                                <span className="text-[14px]">Add a delivery address.</span>
                                                <Button
                                                    className={`h-[40px] !px-10 !mt-4 buttonPrimaryBlack !text-white flex items-center justify-center gap-1 rounded-md p-3 text-[14px] ${isLoading ? "cursor-not-allowed" : ""
                                                        }`}
                                                    onClick={() => handleClickOpen()}
                                                    disabled={isLoading}
                                                >
                                                    <span className="flex items-center justify-center">
                                                        {isLoading ? (
                                                            <CircularProgress color="inherit" />
                                                        ) : (
                                                            <>
                                                                <FiPlus className="text-[16px] font-bold" />
                                                                Add Address
                                                            </>
                                                        )}
                                                    </span>
                                                </Button>
                                            </div>
                                            )}
                                            </div>
                                            </div> */}

                            <div className="grid grid-cols-1 gap-5 mt-4">
                                {
                                    isLoading ? (
                                        <div className="w-full h-[200px] flex items-center justify-center">
                                            <CircularProgress sx={{ color: 'var(--bg-primary)' }} />
                                        </div>
                                    )
                                        :
                                        Array.isArray(address) && address.length !== 0 ? (
                                            address.map((address, index) => {
                                                const fullAddress = [
                                                    address?.address_line1,
                                                    address?.landmark,
                                                    address?.city,
                                                    address?.state,
                                                    address?.country,
                                                ]
                                                    .filter(Boolean)
                                                    .join(", ");

                                                return (
                                                    <div
                                                        key={index}
                                                        className="relative border addressBox w-full flex flex-col items-center justify-between rounded-md p-2 hover:border-[var(--bg-primary)]"
                                                        onClick={() => handleSelectAddress(address?._id)}
                                                    >
                                                        <div className="flex flex-col md:flex-row items-start w-full">
                                                            <label
                                                                htmlFor={`address-${index}`}
                                                                className="cursor-pointer w-full flex items-start p-2"
                                                            >
                                                                <Radio
                                                                    id={`address-${index}`}
                                                                    name="address"
                                                                    checked={selectedValue === address?._id}
                                                                    value={address?._id}
                                                                    onChange={handleSelectAddress}
                                                                />
                                                                <div className="w-full px-5 text-[14px] mt-2">
                                                                    <div className="flex flex-col items-start mb-2 gap-2">
                                                                        <span className="bg-gray-200 px-2 rounded-sm">
                                                                            {address?.addressType}
                                                                        </span>
                                                                        <div className="flex gap-5 font-semibold flex-wrap">
                                                                            <span>{address?.name}</span>
                                                                            <span>{address?.mobile}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-auto">
                                                                        {fullAddress} -{" "}
                                                                        <span className="font-semibold">{address?.pincode}</span>
                                                                    </div>
                                                                </div>
                                                            </label>

                                                            {/* <div
                                                        className="absolute top-2 right-2 inline-block mt-2 md:mt-0"
                                                        onClick={(e) => e.stopPropagation()}
                                                        onMouseEnter={() => setIsOpen(index)}
                                                        onMouseLeave={() => setIsOpen(false)}

                                                    >
                                                        <button
                                                            className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-200"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <TbDotsVertical size={20} />
                                                        </button>

                                                        {isOpen === index && (
                                                            <span className="absolute right-0 top-0 w-24 bg-white shadow-md rounded p-2">
                                                                <div
                                                                    className="cursor-pointer p-1 hover:bg-gray-100"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEditClick(address?.userId, address?._id);
                                                                    }}
                                                                >
                                                                    Edit
                                                                </div>
                                                                <div
                                                                    className="cursor-pointer p-1 hover:bg-gray-100"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteAddress(e, address?._id);
                                                                    }}
                                                                >
                                                                    Delete
                                                                </div>
                                                            </span>
                                                        )}
                                                    </div> */}
                                                            <div
                                                                className="absolute top-2 right-2 inline-block mt-2 md:mt-0"
                                                                onClick={(e) => handleToggle(e, index)}
                                                                onMouseEnter={() => handleMouseEnter(index)}
                                                                onMouseLeave={handleMouseLeave}
                                                                ref={dropdownRef}
                                                            >
                                                                <button
                                                                    className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-200"
                                                                    onClick={(e) => handleToggle(e, index)}
                                                                >
                                                                    <TbDotsVertical size={20} />
                                                                </button>

                                                                {isOpen === index && (
                                                                    <span className="absolute right-0 top-0 w-24 bg-white shadow-md rounded p-2">
                                                                        <div
                                                                            className="cursor-pointer p-1 hover:bg-gray-100"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleEditClick(address?.userId, address?._id);
                                                                            }}
                                                                        >
                                                                            Edit
                                                                        </div>
                                                                        <div
                                                                            className="cursor-pointer p-1 hover:bg-gray-100"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteAddress(e, address?._id);
                                                                            }}
                                                                        >
                                                                            Delete
                                                                        </div>
                                                                    </span>
                                                                )}
                                                            </div>

                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center text-center">
                                                <img src="../empty-myaddresses.png" className="w-[200px]" />
                                                <span className="font-bold mt-5">No Addresses found in your account!</span>
                                                <span className="text-[14px]">Add a delivery address.</span>
                                                <Button
                                                    className={`h-[40px] w-[250px] !capitalize !mt-4 px-6 buttonPrimaryBlack !text-white flex items-center justify-center gap-1 rounded-md text-[14px] ${isLoading3 ? "cursor-not-allowed" : ""
                                                        }`}
                                                    onClick={() => handleClickOpen()}
                                                    disabled={isLoading}
                                                >
                                                    <span className="flex items-center justify-center">
                                                        {isLoading ? (
                                                            <CircularProgress color="inherit" size={18} />
                                                        ) : (
                                                            <>
                                                                <FiPlus className="text-[16px] font-bold" /> Add Address
                                                            </>
                                                        )}
                                                    </span>
                                                </Button>
                                            </div>
                                        )
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            <Dialog open={isOpenModel} onClose={handleClose}>
                <DialogTitle>{addressIdForEdit !== undefined ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                <form onSubmit={handleSubmit} ref={formRef}>
                    <div className='flex flex-col w-auto h-[400px] overflow-y-scroll px-5 pb-5'>
                        <h2 className='text-gray-500 sticky top-0 z-50 bg-white pb-2 border-b'>
                            Share your delivery details, and we&apos;ll take care of the rest! &#128522;
                        </h2>

                        <TextField
                            autoFocus
                            margin="dense"
                            id="name"
                            name="name"
                            label="Name*"
                            type="text"
                            value={formFields?.name || ''}
                            disabled={isLoading}
                            className='custom-textfield'
                            onChange={onChangeInput}
                            inputRef={nameRef}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />
                        <TextField
                            margin="dense"
                            id="address_line1"
                            name="address_line1"
                            label="Address Line1 (House No, Building/Street/Area Name)*"
                            type="text"
                            value={formFields?.address_line1 || ''}
                            disabled={isLoading}
                            className='custom-textfield'
                            onChange={onChangeInput}
                            inputRef={addressLine1Ref}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />
                        <TextField
                            margin="dense"
                            id="landmark"
                            name="landmark"
                            label="Landmark"
                            type="text"
                            value={formFields?.landmark || ''}
                            disabled={isLoading}
                            className='custom-textfield'
                            onChange={onChangeInput}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />
                        <TextField
                            margin="dense"
                            id="city"
                            name="city"
                            label="City/District*"
                            value={formFields?.city || ''}
                            disabled={isLoading}
                            onChange={onChangeInput}
                            className='custom-textfield'
                            type="text"
                            inputRef={cityRef}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />
                        <TextField
                            margin="dense"
                            id="state"
                            name="state"
                            label="State*"
                            value={formFields?.state || ''}
                            disabled={isLoading}
                            onChange={onChangeInput}
                            className='custom-textfield'
                            type="text"
                            inputRef={stateRef}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />
                        <TextField
                            margin="dense"
                            id="country"
                            name="country"
                            label="Country*"
                            value={formFields?.country || ''}
                            disabled={isLoading}
                            onChange={onChangeInput}
                            className='custom-textfield'
                            type="text"
                            inputRef={countryRef}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />

                        <TextField
                            margin="dense"
                            id="pincode"
                            name="pincode"
                            label="Pincode*"
                            value={formFields?.pincode || ''}
                            disabled={isLoading}
                            inputProps={{
                                maxLength: 6,
                            }}
                            error={error}
                            helperText={error ? "Please enter a valid 6-digit pincode" : ""}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d{0,6}$/.test(value)) {
                                    setError(false);
                                } else {
                                    setError(true);
                                }
                                onChangeInput(e);
                            }}
                            type="text"
                            inputRef={pincodeRef}
                            className='custom-textfield'
                            fullWidth
                            variant="outlined"
                            size="small"
                        />

                        <MuiPhone
                            margin="dense"
                            defaultCountry="in"
                            value={phone || ''}  // Set value to the phone state
                            onChange={(phone) => {
                                setPhone(phone); // Update phone state when the value changes
                                setFormFields((prevState) => ({ ...prevState, mobile: phone })); // Also update formFields with the new phone
                            }}
                            disabled={isLoading}
                            type="text"
                            inputRef={mobileRef}
                            className='custom-textfield'
                            fullWidth
                            variant="outlined"
                            size="small"
                        />

                        {/* <fieldset ref={addressTypeRef} className="border rounded-md p-2 hover:border-black">
                            <legend className="text-[12px] font-normal text-gray-700 px-2">Address Type*</legend>
                            <RadioGroup
                                aria-labelledby="demo-radio-buttons-group-label"
                                value={isAddressType}
                                onChange={(e) => handleAddressType(e)}
                                name="radio-buttons-group"
                            >
                                <div className="flex items-center space-x-4 px-4">
                                    <FormControlLabel value="Home" control={<Radio />} label="Home" />
                                    <FormControlLabel value="Office" control={<Radio />} label="Office" />
                                </div>
                            </RadioGroup>
                        </fieldset> */}

                        <fieldset ref={addressTypeRef} className="border rounded-md p-2 hover:border-black w-full">
                            <legend className="text-[12px] font-normal text-gray-700 px-2">Address Type*</legend>
                            <RadioGroup
                                aria-labelledby="demo-radio-buttons-group-label"
                                value={isAddressType}
                                onChange={(e) => handleAddressType(e)}
                                name="radio-buttons-group"
                            >
                                <div className="flex flex-wrap flex-row sm:items-center gap-2 sm:gap-4 px-2 sm:px-4">
                                    <FormControlLabel value="Home" control={<Radio />} label="Home" />
                                    <FormControlLabel value="Office" control={<Radio />} label="Office" />
                                </div>
                            </RadioGroup>
                        </fieldset>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={status} // Convert string to boolean
                                    onChange={handleStatusChange}
                                    inputProps={{ "aria-label": "Active Status" }}
                                    sx={{
                                        color: "var(--bg-primary)", // Default color
                                        "&.Mui-checked": {
                                            color: "var(--bg-primary) !important", // Checked color
                                        },
                                    }}
                                />
                            }
                            label="Make it default"
                            className='mt-2 px-2'
                        />

                    </div>

                    <div className='flex flex-row items-center justify-end px-4 pt-4 sm:px-5 pb-4 gap-4 sm:gap-5 '>
                        <Button
                            type="reset"
                            onClick={handleClose}
                            className='buttonPrimaryWhite !text-white w-full sm:w-[150px] h-[40px] flex items-center justify-center gap-2'
                        >
                            <RiResetLeftFill className='text-[20px]' />Discard
                        </Button>

                        {
                            addressIdForEdit === undefined ? (
                                <Button
                                    type='submit'
                                    className={`${isLoading3 ? "buttonDisabled" : "buttonPrimaryBlack"} w-full sm:w-[150px] h-[40px] flex items-center justify-center gap-2`}
                                    disabled={isLoading3}
                                >
                                    {isLoading3 ? <CircularProgress color="inherit" /> : <><IoIosSave className='text-[20px]' />Create</>}
                                </Button>
                            ) : (
                                <Button
                                    className={`${isLoading3 ? "buttonDisabled" : "buttonPrimaryBlack"} w-full sm:w-[150px] h-[40px] flex items-center justify-center gap-2`}
                                    disabled={isLoading3}
                                    onClick={handleUpdate}
                                >
                                    {isLoading3 ? <CircularProgress color="inherit" /> : <><FiEdit className='text-[20px]' />Update</>}
                                </Button>
                            )
                        }
                    </div>
                </form>
            </Dialog>

        </>
    )
}

export default Address
