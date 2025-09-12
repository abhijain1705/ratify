"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import Image from "next/image";
import AzureLogo from "@/assets/azure.png";
import AWSLogo from "@/assets/images.png";

export type Visual = {
    id: string;
    label: string;
    component: React.ReactNode;
    provider: "azure" | "aws";
};

export type Group = {
    id: string;
    label: string;
    provider: "azure" | "aws";
    visuals: string[];
};

interface Props {
    visuals: Visual[];
    groups: Group[];
    visible: Record<string, boolean>;
    toggleVisual: (id: string) => void;
    toggleGroup: (groupId: string) => void;
}

const VisualsControlPopover: React.FC<Props> = ({
    visuals,
    groups,
    visible,
    toggleVisual,
    toggleGroup,
}) => {
    const [open, setOpen] = useState(false);

    const Checkbox = ({
        checked,
        onChange,
    }: {
        checked: boolean;
        onChange: () => void;
    }) => (
        <button
            onClick={onChange}
            className={`w-7 h-7 flex items-center justify-center rounded-md border-2 transition
        ${checked ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 bg-white"}
      `}
        >
            {checked && <Check size={18} />}
        </button>
    );

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow hover:bg-gray-50"
            >
                <span>⚙️ Visuals Control</span>
                {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 min-w-[600px] bg-white rounded-lg shadow-lg border p-6 z-50 space-y-8">
                    {/* Groups Section */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-4">Groups</h4>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(5, 1fr)",
                                gap: "16px",
                            }}
                        >
                            {groups.map((group) => (
                                <div
                                    key={group.id}
                                    style={{
                                        padding: "14px",
                                    }}
                                    className="flex flex-col items-start gap-3 border rounded-md shadow-sm hover:bg-gray-50 transition"
                                ><Image
                                        src={group.provider === "azure" ? AzureLogo : AWSLogo}
                                        alt={group.provider}
                                        width={50}
                                        height={50}
                                        className="rounded"
                                    />
                                    <span className="text-gray-800">{group.label}</span>
                                    <Checkbox
                                        checked={group.visuals.every((id) => visible[id])}
                                        onChange={() => toggleGroup(group.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Individual Visuals */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-4">Individual</h4>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(5, 1fr)",
                                gap: "16px",
                                maxHeight: "260px",
                                overflowY: "auto",
                            }}
                        >
                            {visuals.map((visual) => (
                                <div
                                    key={visual.id}
                                    style={{
                                        padding: "14px",
                                    }}
                                    className="flex items-center justify-between border rounded-md shadow-sm hover:bg-gray-50 transition"
                                >
                                    <div className="flex flex-col items-start gap-2">
                                        <Image
                                            src={visual.provider === "azure" ? AzureLogo : AWSLogo}
                                            alt={visual.provider}
                                            width={50}
                                            height={50}
                                            className="rounded"
                                        />
                                        <span className="text-gray-800">{visual.label}</span>
                                    </div>
                                    <Checkbox
                                        checked={visible[visual.id]}
                                        onChange={() => toggleVisual(visual.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisualsControlPopover;
