/* eslint-disable import/no-anonymous-default-export */
export default {
    control: {
        backgroundColor: "#fff",
        fontSize: 16,
        fontWeight: "normal",
    },

    "&multiLine": {
        display: "flex",
        flexDirection: "column",
        control: {
            fontFamily: "monospace",
            minHeight: 60,
        },
        highlighter: {
            padding: 9,
            border: "1px solid transparent",
            boxSizing: "border-box",
            overflow: "hidden",
            height: 70,
        },
        input: {
            border: "none",
            borderRadius: 0,
            backgroundColor: "white",
            color: "black",
            padding: 15,
            margin: 100,
            width: "50%",
            overflow: "auto",
            height: 70,
        },
    },

    "&singleLine": {
        display: "inline-block",
        width: 180,

        highlighter: {
            padding: 1,
            border: "2px inset transparent",
        },
        input: {
            padding: 1,
            border: "2px inset",
        },
    },

    suggestions: {
        list: {
            backgroundColor: "white",
            border: "1px solid rgba(0,0,0,0.15)",
            fontSize: 16,
        },
        item: {
            padding: "5px 15px",
            borderBottom: "1px solid rgba(0,0,0,0.15)",
            "&focused": {
                backgroundColor: "#cee4e5",
            },
        },
    },
};
