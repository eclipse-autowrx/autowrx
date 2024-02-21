import { FC } from "react";
import StarRatings from "react-star-ratings";

interface StarsProps {
    rating?: number;
}

const Stars: FC<StarsProps> = ({ rating }) => {
    return (
        <StarRatings
            starDimension="30px"
            starSpacing="1px"
            rating={rating}
            starRatedColor="#ffdb58"
            numberOfStars={5}
            name="rating"
        />
    );
};

export default Stars;
