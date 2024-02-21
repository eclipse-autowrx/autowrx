import React from "react";
import PropTypes from "prop-types";

Items.propTypes = {};

function Items({ currentItems }) {
    return <div className="flex">{currentItems && currentItems.map((item) => <div>Item #{item}</div>)}</div>;
}

export default Items;
