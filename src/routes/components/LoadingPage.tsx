const LoadingPage = ({ showText = true, size = 60, fullScreen = true }) => {
    const circleRadius = size * 0.38; // This is approximately 23/60
    const strokeWidth = size * 0.067; // This is approximately 4/60
    const textSize = size * 0.02; // Adjust text size based on spinner size

    return (
        <div className={`flex flex-col justify-center items-center select-none ${fullScreen ? "w-full h-full" : ""}`}>
            <svg className="loading-spinner" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={circleRadius}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    stroke="#f3f3f3"
                />
                <path
                    d={`M ${size / 2} ${size / 2} m -${circleRadius} 0 a ${circleRadius} ${circleRadius} 0 0 1 ${
                        circleRadius * 0.87
                    } -${circleRadius}`}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    stroke="url(#gradient)"
                />
                <defs>
                    <linearGradient id="gradient" x1="100%" y1="100%">
                        <stop stopColor="#005072" offset="0%" />
                        <stop stopColor="#2c6c64" offset="100%" />
                    </linearGradient>
                </defs>
            </svg>
            {showText && (
                <div style={{ fontSize: `${textSize}rem` }} className="text-gray-400 mt-2">
                    Loading
                </div>
            )}
            <style>{`
                .loading-spinner {
                    transform-origin: center;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoadingPage;
