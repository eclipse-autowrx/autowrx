import { useState } from "react";

const Input = ({}) => {
  const [inputValue, setInputValue] = useState("");
  return (
    <input
      className="border border-teal-400 rounded-md p-2 w-full"
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
    ></input>
  );
};

export { Input };
