import clsx from "clsx"
import { useNavigate } from "react-router-dom"
import { ImagePin } from "../../../apis/models"

interface PinProps {
    pin: ImagePin
    link: string
}

const Pin = ({pin, link}: PinProps) => {
    const navigate = useNavigate()
    return (
        <div
        className={clsx("pointer-events-none", "absolute")}
        style={{left: `${pin.x}%`, top: `${pin.y}%`, transform: "translate(-50%, -100%)"}}
        onClick={() => navigate(link)}
        >
            <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
            height="25px" viewBox="0 0 395.000000 640.000000"
            preserveAspectRatio="xMidYMid meet"
            >
                <g transform="translate(0.000000,640.000000) scale(0.100000,-0.100000)" fill="#c92a2a" stroke="none">
                    <path d="M1708 6384 c-830 -107 -1503 -725 -1668 -1534 -28 -138 -35 -215 -35
                    -395 0 -178 6 -245 37 -385 45 -210 107 -358 281 -670 162 -292 184 -329 473
                    -776 364 -563 503 -799 662 -1120 204 -413 356 -822 462 -1247 28 -109 50
                    -207 50 -218 0 -36 17 -19 24 24 14 92 100 418 152 580 202 621 446 1101 972
                    1912 363 560 430 670 575 961 159 318 216 487 244 719 10 88 10 359 0 445 -12
                    107 -16 130 -48 260 -118 480 -453 926 -891 1184 -195 114 -451 207 -678 245
                    -36 6 -81 13 -100 16 -77 13 -407 12 -512 -1z m440 -1220 c31 -8 95 -33 142
                    -56 67 -33 103 -61 171 -128 73 -73 94 -100 132 -180 60 -126 72 -181 71 -320
                    -1 -95 -6 -129 -27 -195 -95 -292 -359 -485 -662 -485 -303 0 -567 193 -662
                    485 -21 66 -26 100 -27 195 -1 138 11 194 71 319 37 77 59 108 126 176 182
                    183 421 251 665 189z"/>
                </g>
            </svg>
        </div>
    )
}

export default Pin