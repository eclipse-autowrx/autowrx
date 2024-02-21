import React, { useRef, useState, useEffect } from "react";
import styles from "./DeployAnimate.module.scss"; // Assuming you've a separate SCSS file for this component
import { VehicleType } from "./RenderDeployVehicle";

interface DeployAnimateProps {
    selectedVehicle?: VehicleType | null;
    isAuthenticated?: boolean;
    isDeploying?: boolean;
}

const DeployAnimate: React.FC<DeployAnimateProps> = ({ selectedVehicle, isAuthenticated, isDeploying }) => {
    const vehicleIdMap = {
        VirtualMachine: "1",
        dreamKIT: "2",
        XSPACE: "3",
        PilotFleet: "4",
    };
    const [prevSelectedVehicle, setPrevSelectedVehicle] = useState<string | null>(null);

    useEffect(() => {
        if (prevSelectedVehicle) {
            const prevDeployElement = document.getElementById(`deploy_${vehicleIdMap[prevSelectedVehicle]}`);
            if (prevDeployElement) {
                prevDeployElement.style.opacity = "0";
            }
        }
        if (selectedVehicle) {
            setPrevSelectedVehicle(selectedVehicle);
        }

        // Dash: normal with thick stroke when selected to authenticate - not authenticated
        if (selectedVehicle && !isAuthenticated) {
            Object.entries(vehicleIdMap).forEach(([vehicle, id]) => {
                const pathElement = document.getElementById(id);
                if (pathElement) {
                    pathElement.style.strokeWidth = vehicle === selectedVehicle ? "1.2" : "0.3";
                    pathElement.style.strokeOpacity = vehicle === selectedVehicle ? "1" : "0.3";
                }
            });
        }

        // Dash: gradient without flow animation - authenticated
        if (selectedVehicle && isAuthenticated) {
            const deployElement = document.getElementById(`deploy_${vehicleIdMap[selectedVehicle]}`);
            if (deployElement) {
                if (isAuthenticated) {
                    deployElement.classList.remove(styles.animate);
                    deployElement.style.opacity = "1";
                    Object.entries(vehicleIdMap).forEach(([vehicle, id]) => {
                        const pathElement = document.getElementById(id);
                        if (pathElement) {
                            pathElement.style.strokeWidth = "0.3";
                            pathElement.style.strokeOpacity = "0.3";
                        }
                    });
                }
            }
        }

        // Dash: gradient with flow animation - deploying
        if (selectedVehicle && isDeploying) {
            const deployElement = document.getElementById(`deploy_${vehicleIdMap[selectedVehicle]}`);
            if (deployElement) {
                if (isDeploying) {
                    deployElement.classList.add(styles.animate);
                } else {
                    deployElement.classList.remove(styles.animate);
                }
                deployElement.style.opacity = "1";
                Object.entries(vehicleIdMap).forEach(([vehicle, id]) => {
                    const pathElement = document.getElementById(id);
                    if (pathElement) {
                        pathElement.style.strokeWidth = vehicle === selectedVehicle ? "0" : "0.3";
                        pathElement.style.strokeOpacity = vehicle === selectedVehicle ? "0.3" : "0.3";
                    }
                });
            }
        }
    }, [selectedVehicle, isAuthenticated, isDeploying]);

    return (
        <div className="relative h-[80px] w-[700px]">
            {/* Outer left and right */}
            <svg
                id="outer_left"
                xmlns="http://www.w3.org/2000/svg"
                width="295"
                height="75"
                viewBox="0 0 295 75"
                fill="none"
                className="absolute left-[60px]"
            >
                <path
                    d="M25.0002 36C2.50002 36 5.50017 55.7101 5.50017 70M214.633 36C192.133 36 195.133 55.7101 195.133 70M35 36H265M290 24C290 31.5 284.5 36 275 36M290 5V14"
                    stroke="#ADB5BD"
                    strokeOpacity="0.1"
                    strokeWidth="10"
                    strokeLinecap="square"
                    strokeLinejoin="round"
                />
            </svg>
            <svg
                id="outer_right"
                xmlns="http://www.w3.org/2000/svg"
                width="295"
                height="75"
                viewBox="0 0 295 75"
                fill="none"
                className="absolute left-[345px]"
            >
                <path
                    d="M270 36C292.5 36 289.5 55.7101 289.5 70M80.3672 36C102.867 36 99.8672 55.7101 99.8672 70M260 36H30.0001M5 24C5 31.5 10.5 36 20 36M5.00012 5V14"
                    stroke="#ADB5BD"
                    strokeOpacity="0.1"
                    strokeWidth="10"
                    strokeLinecap="square"
                    strokeLinejoin="round"
                />
            </svg>
            {/* Inner Dataflow*/}
            <svg
                id="deploy_1"
                className={`absolute opacity-0 top-[3px] left-[64px] ${styles.animate}`}
                xmlns="http://www.w3.org/2000/svg"
                width="287"
                height="70"
                viewBox="0 0 287 65"
                fill="none"
            >
                <path
                    d="M1.50011 65C1.50011 65 1.49985 58.5 1.50012 54.5C1.50039 50.5 1.50012 31 18.0001 31C19.0001 31 259.5 31 268.5 31C277.5 31 286 28.5 286 19.5C286 10.5 286 0 286 0"
                    stroke="url(#paint0_linear_349_326)"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="6 5"
                />
                <defs>
                    <linearGradient
                        id="paint0_linear_349_326"
                        x1="0.999999"
                        y1="28.5"
                        x2="293.5"
                        y2="26.5"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#005072" />
                        <stop offset="1" stopColor="#2c6c64" />
                    </linearGradient>
                </defs>
            </svg>
            <svg
                id="deploy_2"
                className={`absolute opacity-0 top-[2px] left-[254px] ${styles.animate}`}
                xmlns="http://www.w3.org/2000/svg"
                width="97"
                height="69"
                viewBox="0 0 97 70"
                fill="none"
            >
                <path
                    d="M1.00006 69C1.00006 69 1.00001 70 1.00006 58.5C1.0001 47 3.48674 35 13 35C15.9999 35 70.5001 35 79.0001 35C87.5001 35 95.4999 33 96 23.5C96.5001 14 96 1 96 1"
                    stroke="url(#paint0_linear_349_326)"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="6 5"
                />
                <defs>
                    <linearGradient
                        id="paint0_linear_349_326"
                        x1="0.999999"
                        y1="28.5"
                        x2="293.5"
                        y2="26.5"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#005072" />
                        <stop offset="1" stopColor="#2c6c64" />
                    </linearGradient>
                </defs>
            </svg>
            <svg
                id="deploy_3"
                className={`absolute opacity-0 top-[2px] left-[349px] ${styles.animate}`}
                xmlns="http://www.w3.org/2000/svg"
                width="97"
                height="69"
                viewBox="0 0 97 70"
                fill="none"
            >
                <path
                    d="M96.2226 69C96.2226 69 96.2226 70 96.2226 58.5C96.2226 47 93.7359 35 84.2227 35C81.2228 35 26.7226 35 18.2226 35C9.7226 35 1.72271 33 1.22264 23.5C0.722572 14 1.22264 1 1.22264 1"
                    stroke="url(#paint0_linear_349_326)"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="6 5"
                />
                <defs>
                    <linearGradient
                        id="paint0_linear_349_326"
                        x1="1.22264"
                        y1="35"
                        x2="96.2226"
                        y2="35"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#005072" />
                        <stop offset="1" stopColor="#2c6c64" />
                    </linearGradient>
                </defs>
            </svg>
            <svg
                id="deploy_4"
                className={`absolute opacity-0 top-[1px] left-[349px] ${styles.animate}`}
                xmlns="http://www.w3.org/2000/svg"
                width="287"
                height="70"
                viewBox="0 0 287 68"
                fill="none"
            >
                <path
                    d="M285.5 68C285.5 68 285.5 61.5 285.5 57.5C285.5 53.5 285.5 34 269 34C268 34 27.5 34 18.5 34C9.5 34 0.999878 31.5 0.999878 22.5C0.999878 13.5 0.999878 0 0.999878 0"
                    stroke="url(#paint0_linear_349_326)"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="6 5"
                />
                <defs>
                    <linearGradient
                        id="paint0_linear_349_326"
                        x1="0.999878"
                        y1="34"
                        x2="285.5"
                        y2="34"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#005072" />
                        <stop offset="1" stopColor="#2c6c64" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Inner not flow */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="286"
                height="70"
                viewBox="0 0 286 68"
                fill="none"
                className="absolute top-[1px]  left-[65px] opacity-50"
            >
                <path
                    id="1"
                    d="M0.500121 68C0.500121 68 0.499849 61.5 0.500121 57.5C0.500393 53.5 0.50012 34 17.0001 34C18.0001 34 258.5 34 267.5 34C276.5 34 285 31.5 285 22.5C285 13.5 285 0 285 0"
                    stroke="#4B5563"
                    strokeOpacity="0.2"
                    strokeWidth="0.5"
                    strokeDasharray="6 5"
                />
            </svg>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="97"
                height="70"
                viewBox="0 0 97 70"
                fill="none"
                className="absolute top-[1px] left-[254px] opacity-50"
            >
                <path
                    id="2"
                    d="M1.00006 69C1.00006 69 1.00001 70 1.00006 58.5C1.0001 47 3.48674 35 13 35C15.9999 35 70.5001 35 79.0001 35C87.5001 35 95.4999 33 96 23.5C96.5001 14 96 1 96 1"
                    stroke="#4B5563"
                    strokeOpacity="0.2"
                    strokeWidth="0.5"
                    strokeDasharray="6 5"
                />
            </svg>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="97"
                height="70"
                viewBox="0 0 97 70"
                fill="none"
                className="absolute top-[1px] left-[349px] opacity-50"
            >
                <path
                    id="3"
                    d="M96.2226 69C96.2226 69 96.2226 70 96.2226 58.5C96.2226 47 93.7359 35 84.2227 35C81.2228 35 26.7226 35 18.2226 35C9.7226 35 1.72271 33 1.22264 23.5C0.722572 14 1.22264 1 1.22264 1"
                    stroke="#4B5563"
                    strokeOpacity="0.2"
                    strokeWidth="0.5"
                    strokeDasharray="6 5"
                />
            </svg>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="286"
                height="70"
                viewBox="0 0 286 68"
                fill="none"
                className="absolute top-[1px] left-[349px] opacity-50"
            >
                <path
                    id="4"
                    d="M285.5 68C285.5 68 285.5 61.5 285.5 57.5C285.5 53.5 285.5 34 269 34C268 34 27.5 34 18.5 34C9.5 34 0.999878 31.5 0.999878 22.5C0.999878 13.5 0.999878 0 0.999878 0"
                    stroke="#4B5563"
                    strokeOpacity="0.2"
                    strokeWidth="0.5"
                    strokeDasharray="6 5"
                />
            </svg>
        </div>
    );
};

export default DeployAnimate;
