import Popup from "../../reusable/Popup/Popup"

interface WIPPopupProps {
    trigger: React.ReactElement
}

const WIPPopup = ({trigger}: WIPPopupProps) => {
    return (
        <Popup trigger={trigger}>
            <div className="text-2xl mb-2">Work In Progress</div>
            <div>This feature is still being built.</div>
        </Popup>
    )
}

export default WIPPopup