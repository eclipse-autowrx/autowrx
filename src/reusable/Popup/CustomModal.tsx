import React, { useState, useEffect, forwardRef, useRef } from "react";
import ReactDOM from "react-dom";

interface CustomModalProps {
    isOpen: boolean;
    onClose?: () => void;
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string; // Add this line
}

const CustomModal = forwardRef<HTMLDivElement, CustomModalProps>(
    ({ isOpen, onClose, children, style, className }: CustomModalProps, forwardedRef) => {
        const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
        const overlayRef = useRef<HTMLDivElement | null>(null);
        const modalRef = useRef<HTMLDivElement | null>(null);

        useEffect(() => {
            setModalRoot(document.querySelector("body"));
        }, []);

        useEffect(() => {
            const handleOutsideClick = (event: MouseEvent) => {
                if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                    onClose && onClose();
                }
            };

            if (isOpen) {
                overlayRef.current?.addEventListener("click", handleOutsideClick);
            } else {
                overlayRef.current?.removeEventListener("click", handleOutsideClick);
            }

            return () => {
                overlayRef.current?.removeEventListener("click", handleOutsideClick);
            };
        }, [isOpen, onClose]);

        if (!modalRoot || !isOpen) {
            return null;
        }

        return ReactDOM.createPortal(
            <div
                ref={(node) => {
                    // Use forwardRef the same time with overlay ref
                    overlayRef.current = node;
                    if (typeof forwardedRef === "function") {
                        forwardedRef(node);
                    } else if (forwardedRef) {
                        forwardedRef.current = node;
                    }
                }}
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 99999,
                }}
            >
                <div
                    ref={modalRef}
                    style={{
                        position: "absolute",
                        ...style,
                    }}
                    className={className}
                >
                    {children}
                </div>
            </div>,
            modalRoot
        );
    }
);

CustomModal.displayName = "CustomModal";

export default CustomModal;
