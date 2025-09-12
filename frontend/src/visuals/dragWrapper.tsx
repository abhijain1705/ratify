"use client";
import React, { FC } from "react";
import { useDrag, useDrop } from "react-dnd";

type DraggableCardProps = {
    id: string;
    index: number;
    moveCard: (dragIndex: number, hoverIndex: number) => void;
    children: React.ReactNode;
};

const DraggableCard: FC<DraggableCardProps> = ({ id, index, moveCard, children }) => {
    const ref = React.useRef<HTMLDivElement>(null);

    const [, drop] = useDrop({
        accept: "CARD",
        hover(item: { id: string; index: number }) {
            if (!ref.current) return;
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) return;
            moveCard(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: "CARD",
        item: { id, index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    drag(drop(ref));

    return (
        <div
            ref={ref}
            className="cursor-move"
            style={{
                opacity: isDragging ? 0.4 : 1,
                transition: "opacity 0.2s",
            }}
        >
            {children}
        </div>
    );
};

export default DraggableCard;
