import { OutputPart } from "./models"
import dedent from "dedent";

const buildBrythonError = (error: any): OutputPart => {
    if (typeof error.args === "undefined") {
        const string = "\n" + dedent`
        ${error.message}
        ` + "\n\n"
        
        return {
            text: string,
            type: "error"
        }    
    } else {
        const string = "\n" + dedent`
        Line ${error["$line_info"]}
        
        ${error.__class__.$infos.__name__}: ${error.args[0]}
        ` + "\n\n"
        
        return {
            text: string,
            type: "error"
        }    
    }
}

export default buildBrythonError