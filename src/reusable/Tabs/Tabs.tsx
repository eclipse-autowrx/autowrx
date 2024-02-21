import React, { useState, ReactNode } from "react";
import clsx from "clsx";

export type TabType = {
    title: string;
    component: ReactNode;
    icon?: ReactNode; // Optional Icon
    iconPosition?: "before" | "after"; // If provided, icon can either be before or after the title
};

interface TabsProps {
    tabs: TabType[];
}

const Tabs: React.FC<TabsProps> = ({ tabs }) => {
    const [activeTab, setActiveTab] = useState(tabs[0].title);

    return (
        <>
            <div className="flex border-t pt-2 mb-4 space-x-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.title}
                        onClick={() => setActiveTab(tab.title)}
                        className={clsx(
                            "py-1 px-4 hover:bg-aiot-blue/5 flex items-center justify-center transition duration-300 cursor-pointer",
                            activeTab === tab.title ? "border-b-2 border-aiot-blue text-aiot-blue" : "text-gray-400"
                        )}
                    >
                        {tab.icon && tab.iconPosition === "before" && <span className="mr-1.5">{tab.icon}</span>}
                        <div className="">{tab.title}</div>
                        {tab.icon && tab.iconPosition === "after" && <span className="ml-1.5">{tab.icon}</span>}
                    </button>
                ))}
            </div>
            {tabs.find((tab) => tab.title === activeTab)?.component}
        </>
    );
};

export default Tabs;
