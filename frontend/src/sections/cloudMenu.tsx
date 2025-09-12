import { useState, useEffect, Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { auth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useConnector } from "@/context/ConnectorContext";


export default function CloudMenu() {

    const { connectors, setConnector } = useConnector();

    const handleLogout = async (): Promise<void> => {
        await signOut(auth);
    };

    return (
        <div className="relative inline-block text-left">
            <Menu>
                {({ open }) => (
                    <>
                        <Menu.Button className="inline-flex justify-center w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow">
                            Account & Clouds
                        </Menu.Button>

                        <Transition
                            show={open}
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className="absolute right-0 mt-2 w-60 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none z-50">

                                <div className="p-2">
                                    <h4 className="text-sm font-semibold mb-2">Connected Clouds</h4>

                                    {/* AWS */}
                                    <div className="flex items-center justify-between px-2 py-1">
                                        <label>AWS</label>
                                        <input
                                            type="checkbox"
                                            checked={connectors.aws}
                                            onChange={() => setConnector("aws", !connectors.aws)}
                                        />
                                    </div>

                                    {/* Azure */}
                                    <div className="flex items-center justify-between px-2 py-1">
                                        <label>Azure</label>
                                        <input
                                            type="checkbox"
                                            checked={connectors.azure}
                                            onChange={() => setConnector("azure", !connectors.azure)}
                                        />
                                    </div>

                                    {/* GCP */}
                                    <div className="flex items-center justify-between px-2 py-1 text-gray-400 cursor-not-allowed">
                                        <label>GCP</label>
                                        <span className="text-xs italic">WIP</span>
                                    </div>

                                    {/* Heroku */}
                                    <div className="flex items-center justify-between px-2 py-1 text-gray-400 cursor-not-allowed">
                                        <label>Heroku</label>
                                        <span className="text-xs italic">WIP</span>
                                    </div>
                                </div>

                                <div className="p-2 border-t border-gray-100">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                className={`${active ? "bg-gray-100" : ""} w-full text-left px-2 py-2 text-sm text-red-500`}
                                                onClick={handleLogout}
                                            >
                                                Logout
                                            </button>
                                        )}
                                    </Menu.Item>
                                </div>
                            </Menu.Items>
                        </Transition>
                    </>
                )}
            </Menu>
        </div>
    );
}
