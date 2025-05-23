import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function BusinessDataTool() {
    const [businessName, setBusinessName] = useState("");

    const handleSend = async () => {
        if (!businessName.trim()) {
            toast.warn("Please enter a business name", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
            return;
        }

        try {
            const requestBody = JSON.stringify({ query: businessName });

            const [tripRes, yelpRes] = await Promise.all([
                fetch("/api/tripadvisor/restaurant_details", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: requestBody,
                }),
               
            ]);

            const tripData = await tripRes.json();

            toast.success(tripData.message || "Google data sent successfully", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });

        } catch (err) {
            console.error(err);
            toast.error("Failed to send data", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
        }
    };



    const [dataUrls, setDataUrls] = useState({
        google: null,
        tripadvisor: null,
        yelp: null,
    });

    useEffect(() => {
        const fetchAllData = async () => {
            const sources = ["google", "tripadvisor", "yelp"];
            const updatedUrls = {};
            let allSuccess = true;

            for (const source of sources) {
                try {
                    const res = await fetch(`/api/${source}/restaurant_details?format=json`);
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    updatedUrls[source] = url;
                } catch (err) {
                    allSuccess = false;
                    toast.error(`Failed to prepare the file for ${source}`, {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "light",
                    });
                }
            }

            setDataUrls(updatedUrls);

            if (allSuccess) {
                toast.success("All data is ready to download", {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
            }

            // Cleanup on unmount
            return () => {
                Object.values(updatedUrls).forEach(url => {
                    if (url) window.URL.revokeObjectURL(url);
                });
            };
        };

        fetchAllData();
    }, []);

    const handleDownloadAll = () => {
        let downloaded = false;

        Object.entries(dataUrls).forEach(([source, url]) => {
            if (!url) {
                toast.warning(`File for ${source} not ready yet.`, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
                return;
            }

            // Fetch the JSON data with proper encoding
            fetch(url)
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(data => {
                    // Create a Blob with proper encoding
                    const blob = new Blob([JSON.stringify(data, null, 2)], {
                        type: 'application/json;charset=utf-8'
                    });

                    // Create download link
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = `business_data_${source}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Revoke the object URL to free memory
                    setTimeout(() => URL.revokeObjectURL(link.href), 100);
                    downloaded = true;
                })
                .catch(error => {
                    console.error('Error downloading file:', error);
                    toast.error(`Failed to download ${source} data`, {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "light",
                    });
                });
        });

        if (downloaded) {
            toast.success("All available files downloaded", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
        }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
            <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md">
                <h1 className="text-2xl font-semibold mb-4 text-center">Business Data Tool</h1>
                <input
                    type="text"
                    placeholder="Enter business name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full p-2 border rounded-md mb-4"
                />
                <button
                    onClick={handleSend}
                    className="w-full bg-blue-600 text-white py-2 rounded-md mb-4 hover:bg-blue-700"
                >
                    Send Request to Server
                </button>

                <div className="flex justify-between space-x-4">
                    <button
                        onClick={handleDownloadAll}
                        className="w-full bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600"
                    >
                        Download Data in JSON
                    </button>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
        </div>
    );
}
